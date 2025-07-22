import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, FileText } from 'lucide-react';
import FileUpload from '../components/FileUpload';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [uploadedFiles, setUploadedFiles] = React.useState([]);

  const handleLogout = () => {
    logout();
  };

  const handleFilesUploaded = (files) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Dashh</h1>
              <span className="ml-2 text-sm text-gray-500">File Storage</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">{user?.name || user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h2>
          <p className="text-gray-600">Upload and manage your files securely</p>
        </div>

        {/* File Upload Component */}
        <div className="mb-8">
          <FileUpload onFilesUploaded={handleFilesUploaded} />
        </div>

        {/* Files Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Your Files</h3>
            <p className="text-gray-600">
              {uploadedFiles.length > 0 
                ? `${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''} uploaded`
                : 'No files uploaded yet'
              }
            </p>
          </div>
          
          <div className="p-6">
            {uploadedFiles.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
               
                <p className="text-sm text-gray-400">Upload your first file to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {uploadedFiles.map((fileObj) => (
                  <div key={fileObj.id} className="flex items-center space-x-3 p-3 border rounded">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileObj.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(fileObj.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;