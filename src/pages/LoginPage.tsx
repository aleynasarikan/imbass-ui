import React, { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

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
            // AuthContext updates user state → App.js handles routing
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="text-gradient">Imbass Login</h2>
                <p>Enter your credentials to access the platform.</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Your password"
                        />
                    </div>
                    <button type="submit" className="primary-btn login-btn">Sign In</button>
                </form>
                <div className="auth-footer">
                    <p>Demo accounts (password: <code>password123</code>):</p>
                    <ul style={{ textAlign: 'left', marginTop: '10px', fontSize: '0.9rem', color: '#adb5bd' }}>
                        <li>ayse@imbass.com (Influencer)</li>
                        <li>brand@agency.com (Agency)</li>
                    </ul>
                    {onSwitchToRegister && (
                        <p style={{ marginTop: '1.2rem' }}>
                            Don't have an account?{' '}
                            <span
                                onClick={onSwitchToRegister}
                                style={{ color: '#9D4EDD', cursor: 'pointer', fontWeight: 500 }}
                            >
                                Register here
                            </span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
