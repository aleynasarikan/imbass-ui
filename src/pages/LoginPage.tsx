import React, { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

const BrandWord: React.FC = () => (
  <div className="flex items-center gap-2 select-none">
    <svg viewBox="0 0 14 14" className="w-4 h-4 text-iris" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M2 2 L12 12 M12 2 L2 12" />
    </svg>
    <span className="font-display text-[18px] font-semibold tracking-[-0.03em] text-text leading-none">
      imbass
    </span>
  </div>
);

const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPw, setShowPw] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6">
      {/* Brand — top left */}
      <div className="absolute top-6 left-6">
        <BrandWord />
      </div>

      {/* Top-right pill */}
      <span className="hidden md:inline-flex absolute top-6 right-6 items-center h-9 px-4 bg-surface-sunk border border-line rounded-full text-[12.5px] font-medium text-text-soft">
        Sign in
      </span>

      {/* Auth card — dark surface */}
      <div className="w-full max-w-[420px] animate-rise-in">
        <div className="surface p-7">
          <div className="mb-6">
            <h1 className="font-display text-[26px] font-semibold text-text tracking-[-0.02em] leading-tight">
              Welcome back
            </h1>
            <p className="font-sans text-[13.5px] text-text-mute mt-1.5 leading-relaxed">
              Sign in to track, manage and grow every campaign.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-down/25 bg-down/10 px-3.5 py-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-down mt-1.5" />
              <p className="font-sans text-[13px] text-down leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="font-sans text-[12px] text-text-soft font-medium block mb-1.5">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-sans text-[12px] text-text-soft font-medium">
                  Password
                </label>
                <button type="button" className="font-sans text-[12px] text-iris font-medium hover:text-[#b5a9ff] transition">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-lg text-text-faint hover:text-text hover:bg-surface-soft transition"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 mt-1 select-none cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-line bg-surface-sunk text-iris focus:ring-iris/30" />
              <span className="font-sans text-[12.5px] text-text-soft">Keep me signed in</span>
            </label>

            <Button type="submit" variant="iris" size="lg" disabled={loading} className="w-full mt-2 h-11">
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && <ArrowRight size={14} strokeWidth={2.5} />}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-line flex items-center gap-3 justify-center">
            <span className="font-sans text-[13px] text-text-mute">
              New to Imbass?
            </span>
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-sans text-[13px] font-semibold text-iris hover:text-[#b5a9ff] transition"
            >
              Create an account →
            </button>
          </div>
        </div>

        <p className="mt-5 text-center font-sans text-[11.5px] text-text-faint">
          Dev mode — any credentials grant passage.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
