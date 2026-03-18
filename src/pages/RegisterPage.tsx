import React, { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import './RegisterPage.css';

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
        if (!email) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Please enter a valid email';
        }
        if (!password) {
            errors.password = 'Password is required';
        } else if (password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        if (!role) {
            errors.role = 'Please select a user type';
        }
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
            // AuthContext will handle state update and App.js will redirect to onboarding
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = !email || !password || !role || loading;

    return (
        <div className="register-container">
            <div className="register-card">
                <h2 className="text-gradient">Create Account</h2>
                <p>Join the IMBASS creator network</p>

                {error && <div className="register-error">{error}</div>}

                {/* Role Selector */}
                <label style={{ display: 'block', textAlign: 'left', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 500 }}>
                    I am a...
                </label>
                <div className="role-selector">
                    <div
                        className={`role-option ${role === 'INFLUENCER' ? 'selected' : ''}`}
                        onClick={() => { setRole('INFLUENCER'); setFieldErrors(prev => ({ ...prev, role: undefined })); }}
                    >
                        <span className="role-icon">🎬</span>
                        <span>Influencer</span>
                    </div>
                    <div
                        className={`role-option ${role === 'AGENCY' ? 'selected' : ''}`}
                        onClick={() => { setRole('AGENCY'); setFieldErrors(prev => ({ ...prev, role: undefined })); }}
                    >
                        <span className="role-icon">🏢</span>
                        <span>Agency</span>
                    </div>
                </div>
                {fieldErrors.role && <div className="field-error">{fieldErrors.role}</div>}

                <form onSubmit={handleSubmit} className="register-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: undefined })); }}
                            className={fieldErrors.email ? 'invalid' : ''}
                            placeholder="you@example.com"
                        />
                        {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: undefined })); }}
                            className={fieldErrors.password ? 'invalid' : ''}
                            placeholder="Minimum 6 characters"
                        />
                        {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
                    </div>

                    <button type="submit" className="register-btn" disabled={isDisabled}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className="register-footer">
                    <p>
                        Already have an account?{' '}
                        <span className="link" onClick={onSwitchToLogin}>Sign in</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
