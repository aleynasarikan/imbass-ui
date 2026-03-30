import React, { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Lock, Mail, Video, Building2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface RegisterPageProps {
    onSwitchToLogin: () => void;
}

interface FieldErrors {
    email?: string;
    password?: string;
    role?: string;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [role, setRole] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [loading, setLoading] = useState<boolean>(false);
    const { register } = useAuth();

    const validate = () => {
        const errors: FieldErrors = {};
        if (!email) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email';
        if (!password) errors.password = 'Password is required';
        else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
        if (!role) errors.role = 'Please select a user type';
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (!validate()) return;
        setLoading(true);
        try {
            await register({ email, password, role });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = !email || !password || !role || loading;

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-accent-salmon/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-accent-peach/5 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative">
                <CardContent className="p-8">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-extrabold tracking-tight mb-1">
                            <span className="text-gradient">Create Account</span>
                        </h1>
                        <p className="text-sm text-muted">Join the IMBASS creator network</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                            {error}
                        </div>
                    )}

                    {/* Role Selector */}
                    <div className="mb-5">
                        <label className="text-sm font-medium text-muted-lighter block mb-2">I am a...</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => { setRole('INFLUENCER'); setFieldErrors(prev => ({ ...prev, role: undefined })); }}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
                                    role === 'INFLUENCER'
                                        ? "border-accent-peach bg-accent-peach/10 text-accent-peach"
                                        : "border-white/[0.06] bg-dark-100 text-muted hover:border-white/10 hover:text-muted-lighter"
                                )}
                            >
                                <Video size={24} />
                                <span className="text-sm font-medium">Influencer</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setRole('AGENCY'); setFieldErrors(prev => ({ ...prev, role: undefined })); }}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
                                    role === 'AGENCY'
                                        ? "border-accent-lilac bg-accent-lilac/10 text-accent-lilac"
                                        : "border-white/[0.06] bg-dark-100 text-muted hover:border-white/10 hover:text-muted-lighter"
                                )}
                            >
                                <Building2 size={24} />
                                <span className="text-sm font-medium">Agency</span>
                            </button>
                        </div>
                        {fieldErrors.role && <p className="text-xs text-danger mt-1.5">{fieldErrors.role}</p>}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-lighter">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: undefined })); }}
                                    className={cn("pl-10", fieldErrors.email && "border-danger/50")}
                                    placeholder="you@example.com"
                                />
                            </div>
                            {fieldErrors.email && <p className="text-xs text-danger">{fieldErrors.email}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-lighter">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: undefined })); }}
                                    className={cn("pl-10", fieldErrors.password && "border-danger/50")}
                                    placeholder="Minimum 6 characters"
                                />
                            </div>
                            {fieldErrors.password && <p className="text-xs text-danger">{fieldErrors.password}</p>}
                        </div>

                        <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={isDisabled}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </Button>
                    </form>

                    <p className="mt-6 text-sm text-center text-muted">
                        Already have an account?{' '}
                        <button onClick={onSwitchToLogin} className="text-accent-peach hover:text-accent-peach/80 font-medium transition-colors">
                            Sign in
                        </button>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default RegisterPage;
