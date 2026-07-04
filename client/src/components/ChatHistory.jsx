import { useState, useEffect } from 'react';
import api from '../services/api';

function ChatHistory({ onSelectChat, currentChatId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const res = await api.get('/qa/history');
      setChats(res.data);
    } catch (err) {
      console.error('Failed to fetch chat history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [currentChatId]);

  const handleDelete = async (e, chatId) => {
    e.stopPropagation();
    try {
      await api.delete(`/qa/history/${chatId}`);
      setChats((prev) => prev.filter((c) => c._id !== chatId));
    } catch (err) {
      alert('Failed to delete chat');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-xs" style={{ color: '#94A3B8' }}>Loading history...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {chats.length === 0 ? (
        <p className="text-xs px-2" style={{ color: '#94A3B8' }}>No previous chats</p>
      ) : (
        chats.map((chat) => (
          <div
            key={chat._id}
            onClick={() => onSelectChat(chat)}
            className="rounded-lg px-3 py-2 cursor-pointer group flex items-start justify-between gap-2 transition"
            style={{
              background: currentChatId === chat._id ? '#F5F3FF' : 'transparent',
              border: `1px solid ${currentChatId === chat._id ? '#DDD6FE' : 'transparent'}`,
            }}
            onMouseEnter={(e) => {
              if (currentChatId !== chat._id) {
                e.currentTarget.style.background = '#F8FAFC';
              }
            }}
            onMouseLeave={(e) => {
              if (currentChatId !== chat._id) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium truncate"
                style={{ color: '#1E293B' }}
              >
                {chat.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                {formatDate(chat.createdAt)}
              </p>
            </div>
            <button
              onClick={(e) => handleDelete(e, chat._id)}
              className="opacity-0 group-hover:opacity-100 text-xs transition flex-shrink-0"
              style={{ color: '#DC2626' }}
            >
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default ChatHistory;