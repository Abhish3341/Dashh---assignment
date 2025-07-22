import React, { useState } from 'react';
import { Upload, File } from 'lucide-react';

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
    }, 1000);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Upload Files</h3>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="mb-4"
        />
        <p className="text-gray-600">Select files to upload</p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Selected Files:</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <File className="w-4 h-4" />
                <span>{file.name}</span>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;