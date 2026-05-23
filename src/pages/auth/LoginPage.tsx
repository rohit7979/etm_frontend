import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Eye, EyeOff, LogIn, BookOpen, Loader2 } from 'lucide-react';
import axios from 'axios';
import { loginUser } from '../../services/auth.api';
import { useAuth } from '../../contexts/AuthContext';

// ─── Validation Schema ────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ─── Component ────────────────────────────────────────────────────────────────
const LoginPage = () => {
  const navigate = useNavigate();

  // ── ALL hooks must be called unconditionally before any early return ──
  const { login, user, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // ── Early returns AFTER every hook ──

  // While AuthContext is restoring the session from localStorage / API,
  // show a minimal full-screen loader so the user doesn't see the login form.
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="loading-text">Please wait…</p>
      </div>
    );
  }

  // Already authenticated → redirect to the correct dashboard immediately.
  if (user) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'}
        replace
      />
    );
  }

  // ── Form submit handler ───────────────────────────────────────────────────
  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const response = await loginUser(data);
      login(response.token, response.user);
      toast.success(`Welcome back, ${response.user.name}!`);
      navigate(
        response.user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard',
        { replace: true }
      );
    } catch (err: unknown) {
      let message = 'Login failed. Please try again.';
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message ?? err.message ?? message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <Toaster position="top-right" />

      {/* Animated Background */}
      <div className="auth-bg">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-bg-orb auth-bg-orb-3" />
        <div className="auth-grid-overlay" />
      </div>

      <div className="auth-container">
        {/* Left Panel – Branding */}
        <div className="auth-branding">
          <div className="auth-branding-content">
            <div className="auth-logo">
              <BookOpen size={36} strokeWidth={1.5} />
            </div>
            <h1 className="auth-brand-title">
              Employee Training<br />Management System
            </h1>
            <p className="auth-brand-subtitle">
              Empower your workforce with structured learning paths, progress tracking, and skill development tools.
            </p>
            <div className="auth-features">
              {[
                { icon: '🎯', text: 'Assign targeted training programs' },
                { icon: '📊', text: 'Track progress in real-time' },
                { icon: '🏆', text: 'Certify skills & achievements' },
              ].map((f) => (
                <div key={f.text} className="auth-feature-item">
                  <span className="auth-feature-icon">{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel – Form */}
        <div className="auth-form-panel">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2 className="auth-card-title">Welcome back</h2>
              <p className="auth-card-subtitle">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
              {/* Email Field */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="login-email">
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@company.com"
                  className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
                  autoComplete="email"
                  {...register('email')}
                />
                {errors.email && <p className="auth-error">{errors.email.message}</p>}
              </div>

              {/* Password Field */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="login-password">
                  Password
                </label>
                <div className="auth-input-wrapper">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`auth-input auth-input-with-icon ${errors.password ? 'auth-input-error' : ''}`}
                    autoComplete="current-password"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="auth-error">{errors.password.message}</p>}
              </div>

              {/* Submit Button */}
              <button
                id="login-submit-btn"
                type="submit"
                className="auth-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 size={18} className="auth-spinner-icon" /> Signing in…</>
                ) : (
                  <><LogIn size={18} /> Sign In</>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">New to ETM?</span>
              <span className="auth-divider-line" />
            </div>

            <p className="auth-switch">
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Create an account →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
