import React, { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowRight, Video, Building2, Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

interface FieldErrors { email?: string; password?: string; role?: string; }

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

const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPw, setShowPw] = useState<boolean>(false);
  const [role, setRole] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const { register } = useAuth();

  const validate = () => {
    const errs: FieldErrors = {};
    if (!email) errs.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid address';
    if (!password) errs.password = 'Required';
    else if (password.length < 6) errs.password = 'At least 6 characters';
    if (!role) errs.role = 'Select your workspace';
    setFieldErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ email, password, role });
    } catch (err: any) {
      setError(err?.message || 'Unable to create an account.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'INFLUENCER', label: 'Creator',   desc: 'Hosts, creators, voices',       icon: Video },
    { id: 'AGENCY',     label: 'Agency',    desc: 'Brands, agencies, operators',   icon: Building2 },
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6">
      <div className="absolute top-6 left-6">
        <BrandWord />
      </div>

      <span className="hidden md:inline-flex absolute top-6 right-6 items-center h-9 px-4 bg-surface-sunk border border-line rounded-full text-[12.5px] font-medium text-text-soft">
        Create account
      </span>

      <div className="w-full max-w-[480px] animate-rise-in">
        <div className="surface p-7">
          <div className="mb-6">
            <h1 className="font-display text-[26px] font-semibold text-text tracking-[-0.02em] leading-tight">
              Create your workspace
            </h1>
            <p className="font-sans text-[13.5px] text-text-mute mt-1.5 leading-relaxed">
              A few details and you're ready to orchestrate campaigns.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-down/25 bg-down/10 px-3.5 py-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-down mt-1.5" />
              <p className="font-sans text-[13px] text-down leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="font-sans text-[12px] text-text-soft font-medium block mb-2">
                I'm joining as
              </label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map(r => {
                  const Icon = r.icon;
                  const active = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => { setRole(r.id); setFieldErrors(p => ({ ...p, role: undefined })); }}
                      className={cn(
                        "relative p-3.5 rounded-2xl border text-left transition-all",
                        active
                          ? "border-iris bg-iris-soft shadow-[0_0_0_3px_rgba(155,140,255,0.15)]"
                          : "border-line bg-surface-sunk hover:border-line-strong"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl grid place-items-center mb-2",
                        active ? "bg-iris text-white" : "bg-surface-soft text-text-soft"
                      )}>
                        <Icon size={15} strokeWidth={1.75} />
                      </div>
                      <div className="font-sans text-[13.5px] font-semibold text-text">{r.label}</div>
                      <div className="font-sans text-[11.5px] text-text-mute mt-0.5">{r.desc}</div>
                      {active && (
                        <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-iris text-white grid place-items-center">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {fieldErrors.role && (
                <p className="mt-1.5 font-sans text-[11.5px] text-down">{fieldErrors.role}</p>
              )}
            </div>

            <div>
              <label className="font-sans text-[12px] text-text-soft font-medium block mb-1.5">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: undefined })); }}
                placeholder="you@company.com"
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p className="mt-1 font-sans text-[11.5px] text-down">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="font-sans text-[12px] text-text-soft font-medium block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: undefined })); }}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
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
              {fieldErrors.password && (
                <p className="mt-1 font-sans text-[11.5px] text-down">{fieldErrors.password}</p>
              )}
            </div>

            <Button type="submit" variant="iris" size="lg" disabled={loading} className="w-full mt-1 h-11">
              {loading ? 'Creating…' : 'Create account'}
              {!loading && <ArrowRight size={14} strokeWidth={2.5} />}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-line flex items-center gap-3 justify-center">
            <span className="font-sans text-[13px] text-text-mute">
              Already a member?
            </span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-sans text-[13px] font-semibold text-iris hover:text-[#b5a9ff] transition"
            >
              Sign in →
            </button>
          </div>
        </div>

        <p className="mt-5 text-center font-sans text-[11.5px] text-text-faint">
          By creating an account you agree to our Terms &amp; Privacy.
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
