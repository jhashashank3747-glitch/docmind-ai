import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';

function UploadZone({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onUploadSuccess(res.data.document);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className="rounded-xl p-6 text-center cursor-pointer transition"
        style={{
          border: `2px dashed ${isDragActive ? '#7C3AED' : '#CBD5E1'}`,
          background: isDragActive ? '#F5F3FF' : '#F8FAFC',
        }}
      >
        <input {...getInputProps()} />
        <div className="text-3xl mb-2">📄</div>
        {uploading ? (
          <p className="text-sm font-medium" style={{ color: '#7C3AED' }}>
            Uploading...
          </p>
        ) : isDragActive ? (
          <p className="text-sm font-medium" style={{ color: '#7C3AED' }}>
            Drop your PDF here
          </p>
        ) : (
          <>
            <p className="text-sm font-medium" style={{ color: '#1E293B' }}>
              Drag & drop a PDF
            </p>
            <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
              or click to browse
            </p>
          </>
        )}
      </div>
      {error && (
        <p className="text-xs mt-2" style={{ color: '#DC2626' }}>{error}</p>
      )}
    </div>
  );
}

export default UploadZone;