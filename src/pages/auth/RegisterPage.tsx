import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Eye, EyeOff, UserPlus, BookOpen, Loader2 } from 'lucide-react';
import { registerUser } from '../../services/auth.api';
import { useAuth } from '../../contexts/AuthContext';

// ─── Validation Schema ────────────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name too long'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['admin', 'employee'], { message: 'Select a valid role' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Component ────────────────────────────────────────────────────────────────
const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'employee' },
  });

  const password = watch('password', '');

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score, label: 'Weak', color: '#ef4444' };
    if (score <= 3) return { score, label: 'Fair', color: '#f59e0b' };
    return { score, label: 'Strong', color: '#22c55e' };
  };

  const strength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      const { confirmPassword: _cp, ...payload } = data;
      void _cp; // suppress unused var warning
      const response = await registerUser(payload);
      login(response.token, response.user);
      toast.success('Account created successfully! Welcome aboard 🎉');
      if (response.user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/employee/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error?.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              Join thousands of employees growing their skills with structured training programs and measurable outcomes.
            </p>
            <div className="auth-features">
              {[
                { icon: '🚀', text: 'Kickstart your learning journey' },
                { icon: '📋', text: 'Access personalized training plans' },
                { icon: '✅', text: 'Complete and track certifications' },
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
          <div className="auth-card auth-card-wide">
            <div className="auth-card-header">
              <h2 className="auth-card-title">Create your account</h2>
              <p className="auth-card-subtitle">Get started in less than a minute</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
              {/* Name Field */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="reg-name">
                  Full name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="John Doe"
                  className={`auth-input ${errors.name ? 'auth-input-error' : ''}`}
                  autoComplete="name"
                  {...register('name')}
                />
                {errors.name && <p className="auth-error">{errors.name.message}</p>}
              </div>

              {/* Email Field */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="reg-email">
                  Email address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="you@company.com"
                  className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
                  autoComplete="email"
                  {...register('email')}
                />
                {errors.email && <p className="auth-error">{errors.email.message}</p>}
              </div>

              {/* Role Selection */}
              <div className="auth-field">
                <label className="auth-label">Account type</label>
                <div className="auth-role-grid">
                  <label className={`auth-role-card ${watch('role') === 'employee' ? 'auth-role-card-active' : ''}`}>
                    <input
                      type="radio"
                      value="employee"
                      className="auth-radio-hidden"
                      {...register('role')}
                    />
                    <span className="auth-role-icon">👤</span>
                    <span className="auth-role-name">Employee</span>
                    <span className="auth-role-desc">Access assigned trainings</span>
                  </label>
                  <label className={`auth-role-card ${watch('role') === 'admin' ? 'auth-role-card-active' : ''}`}>
                    <input
                      type="radio"
                      value="admin"
                      className="auth-radio-hidden"
                      {...register('role')}
                    />
                    <span className="auth-role-icon">🛡️</span>
                    <span className="auth-role-name">Admin</span>
                    <span className="auth-role-desc">Manage trainings & teams</span>
                  </label>
                </div>
                {errors.role && <p className="auth-error">{errors.role.message}</p>}
              </div>

              {/* Password Field */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="reg-password">
                  Password
                </label>
                <div className="auth-input-wrapper">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    className={`auth-input auth-input-with-icon ${errors.password ? 'auth-input-error' : ''}`}
                    autoComplete="new-password"
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
                {/* Password Strength Bar */}
                {password && (
                  <div className="auth-strength">
                    <div className="auth-strength-bar">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="auth-strength-segment"
                          style={{
                            backgroundColor: i <= strength.score ? strength.color : undefined,
                          }}
                        />
                      ))}
                    </div>
                    <span className="auth-strength-label" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
                {errors.password && <p className="auth-error">{errors.password.message}</p>}
              </div>

              {/* Confirm Password Field */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="reg-confirm-password">
                  Confirm password
                </label>
                <div className="auth-input-wrapper">
                  <input
                    id="reg-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm password"
                    className={`auth-input auth-input-with-icon ${errors.confirmPassword ? 'auth-input-error' : ''}`}
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="auth-error">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                id="register-submit-btn"
                type="submit"
                className="auth-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="auth-spinner-icon" />
                    Creating account…
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Create Account
                  </>
                )}
              </button>
            </form>

            <p className="auth-switch" style={{ marginTop: '1.25rem' }}>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;