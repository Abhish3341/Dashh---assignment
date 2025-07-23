import React, { useState } from 'react';
import { Upload, File, X } from 'lucide-react';

const FileUpload = ({ onFilesUploaded }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    
    // Simulate upload - replace with actual API call later
    setTimeout(() => {
      if (onFilesUploaded) {
        onFilesUploaded(selectedFiles);
      }
      setSelectedFiles([]);
      setUploading(false);
      // Reset the file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    }, 1000);
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(files => files.filter((_, index) => index !== indexToRemove));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="relative">
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={uploading}
        />
        <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-8 text-center transition-all duration-200 bg-slate-50/50 hover:bg-blue-50/50">
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium mb-1">Click to browse files</p>
          <p className="text-sm text-slate-500">or drag and drop files here</p>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900">Selected Files ({selectedFiles.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-3">
                  <File className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors duration-200"
                  disabled={uploading}
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {uploading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </div>
            ) : (
              `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;