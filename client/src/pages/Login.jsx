import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#F8FAFC' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-purple-600 font-bold text-sm">D</span>
          </div>
          <span className="text-white font-semibold text-lg">DocMind AI</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Ask anything about<br />
            <span style={{ color: '#DDD6FE' }}>your documents.</span>
          </h1>
          <p className="text-purple-200 text-lg">
            Upload PDFs and get instant AI-powered answers with source citations.
          </p>
        </div>

        <div className="flex gap-6">
          {['Multi-PDF support', 'Source citations', 'RAG powered'].map((f) => (
            <div key={f} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-300" />
              <span className="text-purple-200 text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#1E293B' }}>
              Welcome back
            </h2>
            <p style={{ color: '#64748B' }}>Sign in to your account</p>
          </div>

          {error && (
            <div
              className="rounded-lg px-4 py-3 mb-6 text-sm"
              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#374151' }}>
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#1E293B',
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: '#374151' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#1E293B',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white mt-2"
              style={{ background: loading ? '#A78BFA' : '#7C3AED' }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-center" style={{ color: '#64748B' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#7C3AED' }} className="font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;