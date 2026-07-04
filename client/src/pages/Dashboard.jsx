import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UploadZone from '../components/UploadZone';
import ChatInterface from '../components/ChatInterface';

function Dashboard() {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pollingIds, setPollingIds] = useState([]);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Poll for processing documents
  useEffect(() => {
    const processingDocs = documents.filter((d) => d.status === 'processing');
    if (processingDocs.length === 0) return;

    const interval = setInterval(() => {
      fetchDocuments();
    }, 3000);

    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  const handleUploadSuccess = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
    setPollingIds((prev) => [...prev, newDoc._id]);
  };

  const toggleDocument = (doc) => {
    if (doc.status !== 'ready') return;
    setSelectedDocuments((prev) =>
      prev.find((d) => d._id === doc._id)
        ? prev.filter((d) => d._id !== doc._id)
        : [...prev, doc]
    );
  };

  const handleDelete = async (docId) => {
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d._id !== docId));
      setSelectedDocuments((prev) => prev.filter((d) => d._id !== docId));
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'ready') return { text: 'Ready', bg: '#DCFCE7', color: '#16A34A' };
    if (status === 'processing') return { text: 'Processing...', bg: '#FEF9C3', color: '#CA8A04' };
    return { text: 'Failed', bg: '#FEE2E2', color: '#DC2626' };
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#F8FAFC' }}>
      {/* Sidebar */}
      <div
        className="w-72 flex-shrink-0 flex flex-col"
        style={{
          background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          height: '100vh',
          position: 'sticky',
          top: 0,
        }}
      >
        {/* Logo */}
        <div className="p-5" style={{ borderBottom: '1px solid #E2E8F0' }}>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: '#7C3AED' }}
            >
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span className="font-semibold" style={{ color: '#1E293B' }}>DocMind AI</span>
          </div>
        </div>

        {/* Upload zone */}
        <div className="p-4" style={{ borderBottom: '1px solid #E2E8F0' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>
            Upload PDF
          </p>
          <UploadZone onUploadSuccess={handleUploadSuccess} />
        </div>

        {/* Documents list */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>
            Documents ({documents.length})
          </p>

          {loading ? (
            <p className="text-sm" style={{ color: '#94A3B8' }}>Loading...</p>
          ) : documents.length === 0 ? (
            <p className="text-sm" style={{ color: '#94A3B8' }}>No documents yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {documents.map((doc) => {
                const badge = getStatusBadge(doc.status);
                const isSelected = selectedDocuments.find((d) => d._id === doc._id);
                return (
                  <div
                    key={doc._id}
                    onClick={() => toggleDocument(doc)}
                    className="rounded-xl p-3 cursor-pointer transition group relative"
                    style={{
                      background: isSelected ? '#F5F3FF' : '#F8FAFC',
                      border: `1px solid ${isSelected ? '#DDD6FE' : '#E2E8F0'}`,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">📄</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-medium truncate"
                          style={{ color: '#1E293B' }}
                        >
                          {doc.originalName}
                        </p>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {badge.text}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-xs px-1.5 py-0.5 rounded transition"
                        style={{ color: '#DC2626' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User info */}
        <div className="p-4" style={{ borderTop: '1px solid #E2E8F0' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: '#7C3AED' }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#1E293B' }}>
                {user?.name}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-xs transition"
              style={{ color: '#94A3B8' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}
        >
          <div>
            <h1 className="font-semibold" style={{ color: '#1E293B' }}>
              {selectedDocuments.length === 0
                ? 'Select documents to start'
                : `Chatting with ${selectedDocuments.length} document${selectedDocuments.length > 1 ? 's' : ''}`}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
              {selectedDocuments.length === 0
                ? 'Upload and select PDFs from the sidebar'
                : 'Ask anything — answers are grounded in your documents'}
            </p>
          </div>
          {selectedDocuments.length > 0 && (
            <button
              onClick={() => setSelectedDocuments([])}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: '#FEF2F2', color: '#DC2626' }}
            >
              Clear selection
            </button>
          )}
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface selectedDocuments={selectedDocuments} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;