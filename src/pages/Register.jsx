import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import { APP_NAME } from '../config/constants';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!acceptedLegal) {
      return setError('Please accept the Terms of Service and acknowledge the Privacy Policy.');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-wine-50 via-ivory-100 to-phera-50/30"></div>
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-wine-100/50 blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-phera-100/40 blur-3xl"></div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-wine-700 text-white font-bold text-xl mb-4">
            P
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="text-sm text-gray-500 mt-1">Plan your entire wedding in one place</p>
        </div>

        <div className="rounded-2xl bg-white/90 backdrop-blur-sm p-8 shadow-lifted border border-white/60">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Create your account</h2>
          <p className="text-sm text-gray-500 mb-6">Free forever. No credit card needed.</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="mb-4 flex items-start gap-3 rounded-xl bg-gray-50 px-3 py-3 text-xs leading-5 text-gray-600">
            <input
              type="checkbox"
              checked={acceptedLegal}
              onChange={(event) => setAcceptedLegal(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border-gray-300 text-wine-700 focus:ring-wine-600"
            />
            <span>
              I agree to the <Link className="font-semibold text-wine-700 hover:text-wine-900" to="/terms">Terms of Service</Link>
              {' '}and acknowledge the <Link className="font-semibold text-wine-700 hover:text-wine-900" to="/privacy">Privacy Policy</Link>.
            </span>
          </label>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Free Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-wine-700 hover:text-wine-800">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center text-xs text-gray-400 space-y-1">
          <p>Unlimited guests, events, tables, and RSVPs included</p>
          <p>
            <Link className="hover:text-wine-700" to="/copyright">Copyright</Link>
            {' · '}
            <Link className="hover:text-wine-700" to="/accessibility">Accessibility</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
