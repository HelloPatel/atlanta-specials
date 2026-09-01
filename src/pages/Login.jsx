import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import { AuroraBackground, TiltCard, BorderBeam, GradientText, Reveal } from '../components/ui/reactbits';
import { APP_NAME } from '../config/constants';

export default function Login() {
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
      setError(err.code === 'auth/invalid-credential' ? 'Invalid email or password' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
      {/* Warm radial background */}
      <div className="absolute inset-0 bg-gradient-to-br from-wine-50 via-ivory-100 to-phera-50/30"></div>
      <AuroraBackground className="absolute inset-0 -z-0" opacity={0.55} />
      <Reveal className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-wine-700 text-white font-display font-bold text-xl mb-4 shadow-glow">
            P
          </div>
          <GradientText as="h1" className="text-2xl font-display font-bold" colors={['#ab204d', '#ed7824', '#ab204d']} speed={9}>
            {APP_NAME}
          </GradientText>
          <p className="text-sm text-gray-500 mt-1">Indian wedding planning, simplified</p>
        </div>

        <TiltCard max={4} scale={1.006} className="rounded-2xl">
          <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm p-8 shadow-lifted border border-white/60">
            <BorderBeam speed={10} />
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Welcome back</h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <div className="flex items-center justify-between">
                <Link to="/forgot-password" className="text-sm text-wine-700 hover:text-wine-800">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" className="w-full rb-shimmer" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-wine-700 hover:text-wine-800">
                Sign up free
              </Link>
            </p>
          </div>
        </TiltCard>
      </Reveal>
    </div>
  );
}
