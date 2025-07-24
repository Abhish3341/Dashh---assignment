import * as Realm from "realm-web";

// MongoDB Realm App configuration
const REALM_APP_ID = import.meta.env.VITE_MONGODB_APP_ID;

if (!REALM_APP_ID) {
  throw new Error("MongoDB App ID is not configured. Please set VITE_MONGODB_APP_ID in your .env file");
}

// Initialize Realm App
export const app = new Realm.App({ id: REALM_APP_ID });

// LocalStorage fallback service
class LocalStorageService {
  constructor() {
    this.prefix = 'dashh_';
  }

  getItem(key) {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return null;
    }
  }

  setItem(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('LocalStorage set error:', error);
      return false;
    }
  }

  removeItem(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error('LocalStorage remove error:', error);
      return false;
    }
  }

  getUserFiles(userId) {
    const files = this.getItem(`files_${userId}`) || [];
    return files;
  }

  saveUserFiles(userId, files) {
    return this.setItem(`files_${userId}`, files);
  }

  getUserStats(userId) {
    const files = this.getUserFiles(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayUploads = files.filter(file => 
      new Date(file.uploadedAt) >= today
    ).length;

    return {
      totalFiles: files.length,
      storageUsed: files.reduce((acc, file) => acc + (file.fileSize || 0), 0),
      todayUploads: todayUploads
    };
  }

  getUserProfile(userId) {
    return this.getItem(`profile_${userId}`) || null;
  }

  saveUserProfile(userId, profile) {
    return this.setItem(`profile_${userId}`, profile);
  }
}

const localStorageService = new LocalStorageService();

// MongoDB service functions
export class MongoDBService {
  constructor() {
    this.mongodb = null;
    this.db = null;
    this.users = null;
    this.files = null;
    this.isInitialized = false;
    this.useLocalStorage = false;
  }

  async initialize() {
    try {
      if (!app.currentUser || !app.currentUser.isLoggedIn) {
        throw new Error("User not authenticated");
      }

      // Get the MongoDB service
      this.mongodb = app.currentUser?.mongoClient("mongodb-atlas");
      this.db = this.mongodb?.db(import.meta.env.VITE_MONGODB_DATABASE_NAME || "dashh_db");
      
      // Collections
      this.users = this.db?.collection("users");
      this.files = this.db?.collection("files");
      
      this.isInitialized = true;
      this.useLocalStorage = false;
      return true;
    } catch (error) {
      console.error("MongoDB initialization error:", error);
      this.isInitialized = false;
      this.useLocalStorage = true;
      console.warn("Falling back to localStorage for data persistence");
      return false;
    }
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (!this.isInitialized && !this.useLocalStorage) {
      throw new Error("MongoDB service not initialized");
    }
  }
  // User authentication methods
  async loginUser(email, password) {
    try {
      const credentials = Realm.Credentials.emailPassword(email, password);
      const user = await app.logIn(credentials);
      await this.initialize();
      
      // Try to get or create user document
      if (!this.useLocalStorage) {
        try {
          let userDoc = await this.users.findOne({ _id: user.id });
          if (!userDoc) {
            // Create user document if it doesn't exist
            await this.users.insertOne({
              _id: user.id,
              email: email,
              name: email.split('@')[0],
              createdAt: new Date(),
              totalFiles: 0,
              storageUsed: 0,
              isFirstLogin: true,
              profileUpdateCount: 0
            });
          }
        } catch (dbError) {
          console.warn("Could not access user collection:", dbError.message);
          this.useLocalStorage = true;
        }
      }

      // Create/update user profile in localStorage if using fallback
      if (this.useLocalStorage) {
        const existingProfile = localStorageService.getUserProfile(user.id);
        if (!existingProfile) {
          localStorageService.saveUserProfile(user.id, {
            _id: user.id,
            email: email,
            name: email.split('@')[0],
            createdAt: new Date(),
            totalFiles: 0,
            storageUsed: 0,
            isFirstLogin: true,
            profileUpdateCount: 0
          });
        }
      }
      
      return {
        success: true,
        user: {
          id: user.id,
          email: email,
          name: email.split('@')[0]
        }
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async registerUser(email, password, name) {
    try {
      // Register user with Realm
      await app.emailPasswordAuth.registerUser({ email, password });
      
      // Login after registration
      const loginResult = await this.loginUser(email, password);
      
      // User document creation is now handled in loginUser
      
      return loginResult;
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async logoutUser() {
    try {
      await app.currentUser?.logOut();
      this.mongodb = null;
      this.db = null;
      this.users = null;
      this.files = null;
      this.isInitialized = false;
      this.useLocalStorage = false;
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  }

  // File management methods
  async uploadFile(fileData) {
    try {
      await this.ensureInitialized();

      const fileDocument = {
        _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId: app.currentUser.id,
        fileName: fileData.name,
        fileSize: fileData.size,
        fileType: fileData.type,
        fileContent: fileData.content, // Store base64 content
        lastModified: fileData.lastModified,
        uploadedAt: new Date(),
        tags: fileData.tags || [],
        description: fileData.description || ""
      };

      if (this.useLocalStorage) {
        // Use localStorage fallback
        const existingFiles = localStorageService.getUserFiles(app.currentUser.id);
        existingFiles.push(fileDocument);
        localStorageService.saveUserFiles(app.currentUser.id, existingFiles);
        
        return {
          success: true,
          fileId: fileDocument._id,
          file: fileDocument
        };
      } else {
        // Try MongoDB first
        let result;
        try {
          result = await this.files.insertOne(fileDocument);
        } catch (dbError) {
          console.error("Database insert error:", dbError);
          // Fallback to localStorage
          this.useLocalStorage = true;
          const existingFiles = localStorageService.getUserFiles(app.currentUser.id);
          existingFiles.push(fileDocument);
          localStorageService.saveUserFiles(app.currentUser.id, existingFiles);
          
          return {
            success: true,
            fileId: fileDocument._id,
            file: fileDocument
          };
        }
        
        // Update user's file count and storage
        try {
          await this.users.updateOne(
            { _id: app.currentUser.id },
            { 
              $inc: { 
                totalFiles: 1, 
                storageUsed: fileData.size 
              } 
            }
          );
        } catch (updateError) {
          console.warn("Could not update user stats:", updateError.message);
        }

        return {
          success: true,
          fileId: result.insertedId,
          file: fileDocument
        };
      }

    } catch (error) {
      console.error("File upload error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getFileContent(fileId) {
    try {
      await this.ensureInitialized();

      if (this.useLocalStorage) {
        const files = localStorageService.getUserFiles(app.currentUser.id);
        const file = files.find(f => f._id === fileId);
        return file ? { success: true, content: file.fileContent } : { success: false, error: "File not found" };
      } else {
        try {
          const file = await this.files.findOne({ _id: fileId, userId: app.currentUser.id });
          if (!file) {
            return { success: false, error: "File not found" };
          }
          return { success: true, content: file.fileContent, file: file };
        } catch (dbError) {
          console.warn("Could not fetch file content:", dbError.message);
          // Fallback to localStorage
          this.useLocalStorage = true;
          const files = localStorageService.getUserFiles(app.currentUser.id);
          const file = files.find(f => f._id === fileId);
          return file ? { success: true, content: file.fileContent } : { success: false, error: "File not found" };
        }
      }
    } catch (error) {
      console.error("Get file content error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  async getUserFiles() {
    try {
      await this.ensureInitialized();

      if (this.useLocalStorage) {
        const files = localStorageService.getUserFiles(app.currentUser.id);
        return {
          success: true,
          files: files
        };
      } else {
        let files = [];
        try {
          files = await this.files.find({ userId: app.currentUser.id });
        } catch (dbError) {
          console.warn("Could not fetch files from database:", dbError.message);
          // Fallback to localStorage
          this.useLocalStorage = true;
          files = localStorageService.getUserFiles(app.currentUser.id);
        }
        
        return {
          success: true,
          files: files
        };
      }
    } catch (error) {
      console.error("Get files error:", error);
      return {
        success: false,
        error: error.message,
        files: []
      };
    }
  }

  async deleteFile(fileId) {
    try {
      await this.ensureInitialized();

      if (this.useLocalStorage) {
        // Use localStorage fallback
        const files = localStorageService.getUserFiles(app.currentUser.id);
        const fileIndex = files.findIndex(f => f._id === fileId);
        
        if (fileIndex === -1) {
          return { success: false, error: "File not found" };
        }
        
        const deletedFile = files[fileIndex];
        files.splice(fileIndex, 1);
        localStorageService.saveUserFiles(app.currentUser.id, files);
        
        return { 
          success: true, 
          message: `File "${deletedFile.fileName}" deleted successfully` 
        };
      } else {
        // Get file info first to update user stats
        let file;
        try {
          file = await this.files.findOne({ _id: fileId, userId: app.currentUser.id });
        } catch (dbError) {
          console.warn("Could not find file:", dbError.message);
          // Fallback to localStorage
          this.useLocalStorage = true;
          const files = localStorageService.getUserFiles(app.currentUser.id);
          const fileIndex = files.findIndex(f => f._id === fileId);
          
          if (fileIndex === -1) {
            return { success: false, error: "File not found" };
          }
          
          const deletedFile = files[fileIndex];
          files.splice(fileIndex, 1);
          localStorageService.saveUserFiles(app.currentUser.id, files);
          
          return { 
            success: true, 
            message: `File "${deletedFile.fileName}" deleted successfully` 
          };
        }
        
        if (!file) {
          throw new Error("File not found");
        }

        // Delete the file
        try {
          await this.files.deleteOne({ _id: fileId, userId: app.currentUser.id });
        } catch (deleteError) {
          console.error("Could not delete file:", deleteError.message);
          return { success: false, error: "Could not delete file" };
        }
        
        // Update user's file count and storage
        try {
          await this.users.updateOne(
            { _id: app.currentUser.id },
            { 
              $inc: { 
                totalFiles: -1, 
                storageUsed: -file.fileSize 
              } 
            }
          );
        } catch (updateError) {
          console.warn("Could not update user stats:", updateError.message);
        }

        return { 
          success: true, 
          message: `File "${file.fileName}" deleted successfully` 
        };
      }

    } catch (error) {
      console.error("Delete file error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUserStats() {
    try {
      await this.ensureInitialized();

      if (this.useLocalStorage) {
        const stats = localStorageService.getUserStats(app.currentUser.id);
        return {
          success: true,
          stats: stats
        };
      } else {
        let user = null;
        let files = [];
        
        try {
          user = await this.users.findOne({ _id: app.currentUser.id });
          files = await this.files.find({ userId: app.currentUser.id });
        } catch (dbError) {
          console.warn("Could not fetch user data:", dbError.message);
          // Fallback to localStorage
          this.useLocalStorage = true;
          const stats = localStorageService.getUserStats(app.currentUser.id);
          return {
            success: true,
            stats: stats
          };
        }
        
        // Calculate today's uploads
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayUploads = files.filter(file => 
          new Date(file.uploadedAt) >= today
        ).length;

        return {
          success: true,
          stats: {
            totalFiles: user?.totalFiles || files.length,
            storageUsed: user?.storageUsed || files.reduce((acc, file) => acc + file.fileSize, 0),
            todayUploads: todayUploads
          }
        };
      }
    } catch (error) {
      console.error("Get stats error:", error);
      return {
        success: false,
        error: error.message,
        stats: {
          totalFiles: 0,
          storageUsed: 0,
          todayUploads: 0
        }
      };
    }
  }

  // Profile management methods
  async getUserProfile() {
    try {
      await this.ensureInitialized();
      
      if (this.useLocalStorage) {
        let user = localStorageService.getUserProfile(app.currentUser.id);
        if (!user) {
          user = {
            _id: app.currentUser.id,
            email: app.currentUser.profile.email,
            name: app.currentUser.profile.email.split('@')[0],
            createdAt: new Date(),
            totalFiles: 0,
            storageUsed: 0,
            isFirstLogin: true,
            profileUpdateCount: 0
          };
          localStorageService.saveUserProfile(app.currentUser.id, user);
        }
        
        return {
          success: true,
          profile: {
            email: user.email,
            name: user.name,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            isFirstLogin: user.isFirstLogin || false,
            profileUpdateCount: user.profileUpdateCount || 0
          }
        };
      } else {
        let user = null;
        try {
          user = await this.users.findOne({ _id: app.currentUser.id });
        } catch (dbError) {
          console.warn("Could not fetch user profile:", dbError.message);
          // Fallback to localStorage
          this.useLocalStorage = true;
          let localUser = localStorageService.getUserProfile(app.currentUser.id);
          if (!localUser) {
            localUser = {
              _id: app.currentUser.id,
              email: app.currentUser.profile.email,
              name: app.currentUser.profile.email.split('@')[0],
              createdAt: new Date(),
              totalFiles: 0,
              storageUsed: 0,
              isFirstLogin: true,
              profileUpdateCount: 0
            };
            localStorageService.saveUserProfile(app.currentUser.id, localUser);
          }
          
          return {
            success: true,
            profile: {
              email: localUser.email,
              name: localUser.name,
              firstName: localUser.firstName || '',
              lastName: localUser.lastName || '',
              isFirstLogin: localUser.isFirstLogin || false,
              profileUpdateCount: localUser.profileUpdateCount || 0
            }
          };
        }
        
        if (!user) {
          // Create user document if it doesn't exist
          const newUser = {
            _id: app.currentUser.id,
            email: app.currentUser.profile.email,
            name: app.currentUser.profile.email.split('@')[0],
            createdAt: new Date(),
            totalFiles: 0,
            storageUsed: 0,
            isFirstLogin: true,
            profileUpdateCount: 0
          };
          
          try {
            await this.users.insertOne(newUser);
            user = newUser;
          } catch (insertError) {
            console.warn("Could not create user document:", insertError.message);
            return {
              success: true,
              profile: {
                email: app.currentUser.profile.email,
                name: app.currentUser.profile.email.split('@')[0],
                isFirstLogin: true,
                profileUpdateCount: 0
              }
            };
          }
        }
        
        return {
          success: true,
          profile: {
            email: user.email,
            name: user.name,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            isFirstLogin: user.isFirstLogin || false,
            profileUpdateCount: user.profileUpdateCount || 0
          }
        };
      }
    } catch (error) {
      console.error("Get profile error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateUserProfile(profileData) {
    try {
      await this.ensureInitialized();
      
      const updateData = {
        ...profileData,
        updatedAt: new Date(),
        isFirstLogin: false,
        profileUpdateCount: (profileData.profileUpdateCount || 0) + 1
      };
      
      if (this.useLocalStorage) {
        const existingProfile = localStorageService.getUserProfile(app.currentUser.id);
        const updatedProfile = { ...existingProfile, ...updateData };
        localStorageService.saveUserProfile(app.currentUser.id, updatedProfile);
        
        return {
          success: true,
          profile: updateData
        };
      } else {
        try {
          await this.users.updateOne(
            { _id: app.currentUser.id },
            { $set: updateData, $inc: { profileUpdateCount: 1 } }
          );
        } catch (updateError) {
          console.warn("Could not update user profile:", updateError.message);
          // Fallback to localStorage
          this.useLocalStorage = true;
          const existingProfile = localStorageService.getUserProfile(app.currentUser.id);
          const updatedProfile = { ...existingProfile, ...updateData };
          localStorageService.saveUserProfile(app.currentUser.id, updatedProfile);
        }
        
        return {
          success: true,
          profile: updateData
        };
      }
    } catch (error) {
      console.error("Update profile error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!app.currentUser && app.currentUser.isLoggedIn;
  }

  // Get current user
  getCurrentUser() {
    return app.currentUser;
  }
}

// Create singleton instance
export const mongoService = new MongoDBService();