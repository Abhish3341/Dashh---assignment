import * as Realm from "realm-web";

// MongoDB Realm App configuration
const REALM_APP_ID = import.meta.env.VITE_MONGODB_APP_ID;

if (!REALM_APP_ID) {
  throw new Error("MongoDB App ID is not configured. Please set VITE_MONGODB_APP_ID in your .env file");
}

// Initialize Realm App
export const app = new Realm.App({ id: REALM_APP_ID });

// MongoDB service functions
export class MongoDBService {
  constructor() {
    this.mongodb = null;
    this.db = null;
    this.users = null;
    this.files = null;
  }

  async initialize() {
    try {
      // Get the MongoDB service
      this.mongodb = app.currentUser?.mongoClient("mongodb-atlas");
      this.db = this.mongodb?.db(import.meta.env.VITE_MONGODB_DATABASE_NAME || "dashh_db");
      
      // Collections
      this.users = this.db?.collection("users");
      this.files = this.db?.collection("files");
      
      return true;
    } catch (error) {
      console.error("MongoDB initialization error:", error);
      return false;
    }
  }

  // User authentication methods
  async loginUser(email, password) {
    try {
      const credentials = Realm.Credentials.emailPassword(email, password);
      const user = await app.logIn(credentials);
      await this.initialize();
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
      
      if (loginResult.success) {
        // Create user document in database
        await this.users.insertOne({
          _id: app.currentUser.id,
          email: email,
          name: name,
          createdAt: new Date(),
          totalFiles: 0,
          storageUsed: 0
        });
      }
      
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
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  }

  // File management methods
  async uploadFile(fileData) {
    try {
      if (!app.currentUser) {
        throw new Error("User not authenticated");
      }

      const fileDocument = {
        userId: app.currentUser.id,
        fileName: fileData.name,
        fileSize: fileData.size,
        fileType: fileData.type,
        uploadedAt: new Date(),
        fileUrl: fileData.url || null, // For now, we'll store file metadata
        tags: fileData.tags || [],
        description: fileData.description || ""
      };

      const result = await this.files.insertOne(fileDocument);
      
      // Update user's file count and storage
      await this.users.updateOne(
        { _id: app.currentUser.id },
        { 
          $inc: { 
            totalFiles: 1, 
            storageUsed: fileData.size 
          } 
        }
      );

      return {
        success: true,
        fileId: result.insertedId,
        file: fileDocument
      };
    } catch (error) {
      console.error("File upload error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUserFiles() {
    try {
      if (!app.currentUser) {
        throw new Error("User not authenticated");
      }

      const files = await this.files.find({ userId: app.currentUser.id });
      return {
        success: true,
        files: files
      };
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
      if (!app.currentUser) {
        throw new Error("User not authenticated");
      }

      // Get file info first to update user stats
      const file = await this.files.findOne({ _id: fileId, userId: app.currentUser.id });
      
      if (!file) {
        throw new Error("File not found");
      }

      // Delete the file
      await this.files.deleteOne({ _id: fileId, userId: app.currentUser.id });
      
      // Update user's file count and storage
      await this.users.updateOne(
        { _id: app.currentUser.id },
        { 
          $inc: { 
            totalFiles: -1, 
            storageUsed: -file.fileSize 
          } 
        }
      );

      return { success: true };
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
      if (!app.currentUser) {
        throw new Error("User not authenticated");
      }

      const user = await this.users.findOne({ _id: app.currentUser.id });
      const files = await this.files.find({ userId: app.currentUser.id });
      
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