import React, { useState } from 'react';
import { X, Download, ExternalLink, FileText, Image, Video, Music, Archive } from 'lucide-react';

const FilePreview = ({ file, isOpen, onClose, onDownload }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !file) return null;

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />;
    if (type?.startsWith('video/')) return <Video className="w-8 h-8 text-purple-500" />;
    if (type?.startsWith('audio/')) return <Music className="w-8 h-8 text-green-500" />;
    if (type?.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (type?.includes('zip') || type?.includes('rar')) return <Archive className="w-8 h-8 text-orange-500" />;
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      if (onDownload) {
        await onDownload(file);
      }
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setLoading(false);
    }
  };

  const canPreview = (type) => {
    return type?.startsWith('image/') || type?.startsWith('video/') || type?.includes('pdf');
  };

  const renderPreview = () => {
    const fileType = file.type || file.fileType;
    const fileContent = file.fileContent;
    
    if (fileType?.startsWith('image/')) {
      if (fileContent) {
        return (
          <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4">
            <img 
              src={fileContent} 
              alt={file.fileName || file.file?.name || file.name}
              className="max-w-full max-h-96 object-contain rounded-lg shadow-sm"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="text-center hidden">
              <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Image could not be loaded</p>
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8">
          <div className="text-center">
            <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Image preview not available</p>
            <p className="text-sm text-gray-500">Click download to view the image</p>
          </div>
        </div>
      );
    }
    
    if (fileType?.startsWith('video/')) {
      if (fileContent) {
        return (
          <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4">
            <video 
              controls 
              className="max-w-full max-h-96 rounded-lg shadow-sm"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            >
              <source src={fileContent} type={fileType} />
              Your browser does not support the video tag.
            </video>
            <div className="text-center hidden">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Video could not be loaded</p>
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8">
          <div className="text-center">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Video preview not available</p>
            <p className="text-sm text-gray-500">Click download to view the video</p>
          </div>
        </div>
      );
    }
    
    if (fileType?.includes('pdf')) {
      if (fileContent) {
        return (
          <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4">
            <iframe 
              src={fileContent}
              className="w-full h-96 rounded-lg shadow-sm"
              title="PDF Preview"
            />
          </div>
        );
      }
    }
    
    if (fileType?.startsWith('audio/')) {
      if (fileContent) {
        return (
          <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8">
            <div className="text-center w-full">
              <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <audio controls className="w-full max-w-md">
                <source src={fileContent} type={fileType} />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        );
      }
    }
    
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8">
        <div className="text-center">
          {getFileIcon(fileType)}
          <p className="text-gray-600 mt-4">Preview not available for this file type</p>
          <p className="text-sm text-gray-500">Click download to open the file</p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {getFileIcon(file.type || file.fileType)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                {file.fileName || file.file?.name || file.name}
              </h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.fileSize || file.size)} • {file.fileType || file.type}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{loading ? 'Downloading...' : 'Download'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            {renderPreview()}
          </div>

          {/* File Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">File Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">File Name:</span>
                <p className="font-medium text-gray-900 truncate">
                  {file.fileName || file.file?.name || file.name}
                </p>
              </div>
              <div>
                <span className="text-gray-500">File Size:</span>
                <p className="font-medium text-gray-900">
                  {formatFileSize(file.fileSize || file.size)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">File Type:</span>
                <p className="font-medium text-gray-900">{file.fileType || file.type}</p>
              </div>
              <div>
                <span className="text-gray-500">Upload Date:</span>
                <p className="font-medium text-gray-900">
                  {new Date(file.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;