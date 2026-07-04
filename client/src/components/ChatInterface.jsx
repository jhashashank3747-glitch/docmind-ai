import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

function ChatInterface({ selectedDocuments, existingChat, onChatCreated }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});
  const messagesEndRef = useRef(null);

  // Load existing chat if provided
  useEffect(() => {
    if (existingChat) {
      setMessages(existingChat.messages || []);
      setChatId(existingChat._id);
    } else {
      setMessages([]);
      setChatId(null);
    }
  }, [existingChat]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    if (selectedDocuments.length === 0 && !chatId) {
      alert('Please select at least one document first');
      return;
    }

    const userMessage = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await api.post('/qa/ask', {
        question,
        documentIds: selectedDocuments.map((d) => d._id),
        chatId,
      });

      if (!chatId) {
        setChatId(res.data.chatId);
        onChatCreated && onChatCreated(res.data.chatId);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.answer,
          sources: res.data.sources,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSource = (msgIndex, srcIndex) => {
    const key = `${msgIndex}-${srcIndex}`;
    setExpandedSources((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <div className="text-5xl mb-4">🧠</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#1E293B' }}>
              Ask anything about your documents
            </h3>
            <p className="text-sm max-w-md" style={{ color: '#94A3B8' }}>
              Select documents from the sidebar and start asking questions.
            </p>
            <div className="mt-6 flex flex-col gap-2 w-full max-w-sm">
              {[
                'Summarize the key points',
                'What are the main conclusions?',
                'Explain the methodology used',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuestion(suggestion)}
                  className="text-sm px-4 py-2 rounded-lg text-left transition"
                  style={{
                    background: '#F5F3FF',
                    color: '#7C3AED',
                    border: '1px solid #DDD6FE',
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-2xl rounded-2xl px-4 py-3"
              style={{
                background: msg.role === 'user' ? '#7C3AED' : '#FFFFFF',
                color: msg.role === 'user' ? '#FFFFFF' : '#1E293B',
                border: msg.role === 'assistant' ? '1px solid #E2E8F0' : 'none',
                boxShadow: msg.role === 'assistant' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-xs font-medium" style={{ color: '#94A3B8' }}>
                    Sources
                  </p>
                  {msg.sources.map((src, j) => (
                    <div
                      key={j}
                      className="rounded-lg overflow-hidden"
                      style={{ border: '1px solid #E2E8F0' }}
                    >
                      <button
                        onClick={() => toggleSource(i, j)}
                        className="w-full text-left px-3 py-2 flex items-center justify-between text-xs"
                        style={{ background: '#F8FAFC', color: '#64748B' }}
                      >
                        <span className="font-medium truncate">
                          {src.documentName}
                        </span>
                        <span>{expandedSources[`${i}-${j}`] ? '▲' : '▼'}</span>
                      </button>
                      {expandedSources[`${i}-${j}`] && (
                        <div
                          className="px-3 py-2 text-xs"
                          style={{ background: '#FFFFFF', color: '#64748B' }}
                        >
                          {src.chunk}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-4 py-3"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex gap-1 items-center">
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: '#7C3AED', animationDelay: '0ms' }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: '#7C3AED', animationDelay: '150ms' }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: '#7C3AED', animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="p-4"
        style={{ borderTop: '1px solid #E2E8F0', background: '#FFFFFF' }}
      >
        {selectedDocuments.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {selectedDocuments.map((doc) => (
              <span
                key={doc._id}
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  background: '#F5F3FF',
                  color: '#7C3AED',
                  border: '1px solid #DDD6FE',
                }}
              >
                📄 {doc.originalName}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={
              selectedDocuments.length === 0 && !chatId
                ? 'Select documents first...'
                : 'Ask a question...'
            }
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) handleAsk();
            }}
            disabled={(selectedDocuments.length === 0 && !chatId) || loading}
            className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#1E293B',
            }}
          />
          <button
            onClick={handleAsk}
            disabled={
              loading ||
              (selectedDocuments.length === 0 && !chatId) ||
              !question.trim()
            }
            className="px-4 py-3 rounded-xl text-sm font-medium text-white transition"
            style={{
              background:
                loading || (selectedDocuments.length === 0 && !chatId)
                  ? '#A78BFA'
                  : '#7C3AED',
            }}
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;