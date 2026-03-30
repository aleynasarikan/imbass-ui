import React, { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Lock, Mail } from 'lucide-react';

interface LoginPageProps {
    onSwitchToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const { login } = useAuth();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-peach/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-lilac/5 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative">
                <CardContent className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-extrabold tracking-tight mb-1">
                            <span className="text-gradient">IMBASS</span>
                        </h1>
                        <p className="text-sm text-muted">Enter your credentials to access the platform.</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-lighter">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-lighter">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Your password"
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-11 text-sm font-semibold">
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-white/[0.06]">
                        <p className="text-xs text-muted mb-2">Demo accounts (password: <code className="text-accent-peach bg-dark-100 px-1.5 py-0.5 rounded text-[11px]">password123</code>)</p>
                        <ul className="text-xs text-muted space-y-1">
                            <li>• ayse@imbass.com (Influencer)</li>
                            <li>• brand@agency.com (Agency)</li>
                        </ul>
                        <p className="mt-4 text-sm text-center text-muted">
                            Don't have an account?{' '}
                            <button onClick={onSwitchToRegister} className="text-accent-peach hover:text-accent-peach/80 font-medium transition-colors">
                                Register here
                            </button>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginPage;
