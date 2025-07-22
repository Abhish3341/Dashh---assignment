import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Upload, File, User, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
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
          <p className="text-gray-600">Upload and manage your files with ease</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <div className="text-center">
            <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Files</h3>
            <p className="text-gray-600 mb-6">Drag and drop files here or click to browse</p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-400 transition-colors cursor-pointer">
              <div className="text-center">
                <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Click here to select files</p>
                <p className="text-sm text-gray-400 mt-2">Supports all file types</p>
              </div>
            </div>
          </div>
        </div>

        {/* Files Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Your Files</h3>
            <p className="text-gray-600">Manage your uploaded files</p>
          </div>
          
          <div className="p-6">
            <div className="text-center py-12">
              <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No files uploaded yet</p>
              <p className="text-sm text-gray-400">Upload your first file to get started</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;