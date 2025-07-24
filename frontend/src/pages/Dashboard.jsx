import React from 'react';
import { useAuth } from '../context/AuthContext';
import { mongoService } from '../config/mongodb';
import { User, LogOut, FileText, Upload, Search, Grid, List, Filter, MoreVertical, Download, Trash2, Eye, FolderOpen, Plus } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import FilePreview from '../components/FilePreview';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [uploadedFiles, setUploadedFiles] = React.useState([]);
  const [userStats, setUserStats] = React.useState({
    totalFiles: 0,
    storageUsed: 0,
    todayUploads: 0
  });
  const [viewMode, setViewMode] = React.useState('grid');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [previewFile, setPreviewFile] = React.useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  // Load user files and stats on component mount
  React.useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Load user files
      const filesResult = await mongoService.getUserFiles();
      if (filesResult.success) {
        const formattedFiles = filesResult.files.map(file => ({
          id: file._id,
          fileName: file.fileName,
          fileSize: file.fileSize,
          fileType: file.fileType,
          fileContent: file.fileContent,
          file: {
            name: file.fileName,
            size: file.fileSize,
            type: file.fileType
          },
          uploadedAt: file.uploadedAt,
          size: file.fileSize,
          type: file.fileType,
          tags: file.tags || [],
          description: file.description || ''
        }));
        setUploadedFiles(formattedFiles);
      }

      // Load user stats
      const statsResult = await mongoService.getUserStats();
      if (statsResult.success) {
        setUserStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    logout();
  };

  const handleFilesUploaded = async (files) => {
    try {
      const uploadPromises = files.map(async (fileData) => {
        
        const result = await mongoService.uploadFile(fileData);
        if (result.success) {
          return {
            id: result.fileId,
            file: {
              name: fileData.name,
              size: fileData.size,
              type: fileData.type
            },
            fileName: fileData.name,
            fileSize: fileData.size,
            fileType: fileData.type,
            fileContent: fileData.content,
            uploadedAt: result.file.uploadedAt,
            size: fileData.size,
            type: fileData.type,
            tags: result.file.tags,
            description: result.file.description
          };
        }
        return null;
      });

      const uploadedFileResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadedFileResults.filter(file => file !== null);
      
      setUploadedFiles(prev => [...prev, ...successfulUploads]);
      
      // Refresh stats
      const statsResult = await mongoService.getUserStats();
      if (statsResult.success) {
        setUserStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      // Show confirmation dialog
      const fileToDelete = uploadedFiles.find(file => file.id === fileId);
      const fileName = fileToDelete?.fileName || fileToDelete?.file?.name || 'this file';
      
      if (!window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
        return;
      }

      const result = await mongoService.deleteFile(fileId);
      if (result.success) {
        setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
        
        // Show success message
        if (result.message) {
          // You could replace this with a toast notification
          console.log(result.message);
        }
        
        // Refresh stats
        const statsResult = await mongoService.getUserStats();
        if (statsResult.success) {
          setUserStats(statsResult.stats);
        }
      } else {
        alert(`Error deleting file: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file. Please try again.');
    }
  };

  const handlePreviewFile = (fileObj) => {
    setPreviewFile(fileObj);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
    setIsPreviewOpen(false);
  };

  const handleDownloadFile = async (fileObj) => {
    try {
      const fileName = fileObj.fileName || fileObj.file?.name || fileObj.name;
      
      // Get the actual file content
      let fileContent = fileObj.fileContent;
      
      if (!fileContent) {
        // Try to fetch from database if not available
        const result = await mongoService.getFileContent(fileObj.id);
        if (result.success) {
          fileContent = result.content;
        } else {
          throw new Error('File content not available');
        }
      }
      
      // Convert base64 to blob
      const base64Data = fileContent.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: fileObj.fileType || fileObj.type });
      
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('File downloaded:', fileName);
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type?.startsWith('video/')) return '🎥';
    if (type?.startsWith('audio/')) return '🎵';
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('document') || type?.includes('word')) return '📝';
    if (type?.includes('spreadsheet') || type?.includes('excel')) return '📊';
    return '📁';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <span className="text-lg font-bold text-white">D</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Dashh</h1>
                <span className="text-xs text-slate-500 font-medium">File Management</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 px-4 py-2 bg-slate-100/50 rounded-full">
                <User className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">{user?.name || user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-full transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, {user?.name || 'User'}!</h2>
          <p className="text-slate-600 text-lg">Manage your files with ease and precision</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Files</p>
                <p className="text-2xl font-bold text-slate-900">{userStats.totalFiles}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Storage Used</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatFileSize(userStats.storageUsed)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <FolderOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Recent Uploads</p>
                <p className="text-2xl font-bold text-slate-900">{userStats.todayUploads}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Upload className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Upload Files</h3>
                  <p className="text-slate-600">Add new files to your storage</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="p-6">
              <FileUpload onFilesUploaded={handleFilesUploaded} />
            </div>
          </div>
        </div>

        {/* Files Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
          {/* Files Header */}
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Your Files</h3>
                <p className="text-slate-600">
                  {uploadedFiles.length > 0 
                    ? `${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''} • ${formatFileSize(uploadedFiles.reduce((acc, file) => acc + file.size, 0))}`
                    : 'No files uploaded yet'
                  }
                </p>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="flex items-center space-x-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search files..."
                      className="pl-10 pr-4 py-2 bg-slate-100/50 border border-slate-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* View Toggle */}
                  <div className="flex items-center bg-slate-100/50 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        viewMode === 'grid' 
                          ? 'bg-white shadow-sm text-slate-900' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        viewMode === 'list' 
                          ? 'bg-white shadow-sm text-slate-900' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Files Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-4"></div>
                <p className="text-slate-500">Loading your files...</p>
              </div>
            ) : uploadedFiles.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="text-lg font-medium text-slate-900 mb-2">No files uploaded yet</h4>
                <p className="text-slate-500 mb-6">Upload your first file to get started with file management</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
                : "space-y-3"
              }>
                {uploadedFiles
                  .filter(fileObj => 
                    fileObj.file.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((fileObj) => (
                    viewMode === 'grid' ? (
                      <div key={fileObj.id} className="group bg-white/80 rounded-xl p-4 border border-slate-200/50 hover:shadow-md transition-all duration-200 hover:border-slate-300/50">
                        <div className="flex flex-col items-center text-center">
                          <div className="text-3xl mb-3">
                            {getFileIcon(fileObj.type)}
                          </div>
                          <h4 className="font-medium text-slate-900 text-sm mb-1 truncate w-full">
                            {fileObj.file.name}
                          </h4>
                          <p className="text-xs text-slate-500 mb-3">
                            {formatFileSize(fileObj.size)}
                          </p>
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button 
                              onClick={() => handlePreviewFile(fileObj)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200"
                              title="Preview file"
                            >
                              <Eye className="w-3 h-3 text-slate-600" />
                            </button>
                            <button 
                              onClick={() => handleDownloadFile(fileObj)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200"
                              title="Download file"
                            >
                              <Download className="w-3 h-3 text-slate-600" />
                            </button>
                            <button 
                              onClick={() => handleDeleteFile(fileObj.id)} 
                              className="p-1.5 bg-slate-100 hover:bg-red-100 rounded-lg transition-colors duration-200"
                              title="Delete file"
                            >
                              <Trash2 className="w-3 h-3 text-slate-600 hover:text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={fileObj.id} className="group flex items-center justify-between p-4 bg-white/80 rounded-xl border border-slate-200/50 hover:shadow-md transition-all duration-200 hover:border-slate-300/50">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">
                            {getFileIcon(fileObj.type)}
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900 text-sm">
                              {fileObj.file.name}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {formatFileSize(fileObj.size)} • {new Date(fileObj.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button 
                            onClick={() => handlePreviewFile(fileObj)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200"
                            title="Preview file"
                          >
                            <Eye className="w-4 h-4 text-slate-600" />
                          </button>
                          <button 
                            onClick={() => handleDownloadFile(fileObj)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200"
                            title="Download file"
                          >
                            <Download className="w-4 h-4 text-slate-600" />
                          </button>
                          <button 
                            onClick={() => handleDeleteFile(fileObj.id)} 
                            className="p-2 bg-slate-100 hover:bg-red-100 rounded-lg transition-colors duration-200"
                            title="Delete file"
                          >
                            <Trash2 className="w-4 h-4 text-slate-600 hover:text-red-600" />
                          </button>
                          <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200">
                            <MoreVertical className="w-4 h-4 text-slate-600" />
                          </button>
                        </div>
                      </div>
                    )
                  ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* File Preview Modal */}
      <FilePreview
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        onDownload={handleDownloadFile}
      />
    </div>
  );
};

export default Dashboard;