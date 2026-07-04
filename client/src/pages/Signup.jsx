import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ background: '#F8FAFC' }}
    >
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#7C3AED' }}
          >
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="font-semibold text-lg" style={{ color: '#1E293B' }}>
            DocMind AI
          </span>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
        >
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#1E293B' }}>
            Create account
          </h2>
          <p className="mb-8 text-sm" style={{ color: '#64748B' }}>
            Start chatting with your documents
          </p>

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
                Full name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B' }}
              />
            </div>
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
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B' }}
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
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white mt-2"
              style={{ background: loading ? '#A78BFA' : '#7C3AED' }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-center" style={{ color: '#64748B' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#7C3AED' }} className="font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;