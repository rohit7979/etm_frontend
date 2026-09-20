import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
  GraduationCap,
  BookOpen,
  BarChart3,
  Users,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
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

  // ── ALL hooks called unconditionally ──
  const { login, user, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Early loader return while AuthContext checks cached session
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="loading-text">Please wait…</p>
      </div>
    );
  }

  const getRedirectPath = (role?: string) => {
    if (role === 'SUPER_ADMIN') return '/super-admin/dashboard';
    if (role === 'COMPANY_ADMIN' || role === 'admin') return '/admin/dashboard';
    return '/employee/dashboard';
  };

  // Already authenticated → redirect to dashboard
  if (user) {
    return <Navigate to={getRedirectPath(user.role)} replace />;
  }

  // Form submit handler
  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const response = await loginUser(data);
      login(response.user);
      toast.success(`Welcome back, ${response.user.name}!`);
      navigate(getRedirectPath(response.user.role), { replace: true });
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

  return (
    <div className="min-h-screen w-full bg-[#f4f7fb] flex items-center justify-center py-4 lg:py-10 px-4 sm:px-8 lg:px-12 overflow-x-hidden">
      <Toaster position="top-right" />

      {/* Main Container */}
      <div className="w-full max-w-384 mx-auto flex flex-col lg:flex-row gap-4 lg:gap-6 items-center">

        {/* ── LEFT COLUMN: Branding, Value Props & Illustration ── */}
        <div className="lg:w-[60%] flex flex-col justify-between py-2 space-y-6 lg:space-y-7 relative">

          {/* Background Dot Pattern (4 columns x 6 rows) positioned top right of left area */}
          {/* <div className="absolute top-2 right-12 hidden lg:grid grid-cols-4 gap-2 opacity-30 pointer-events-none">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
            ))}
          </div> */}

          {/* Logo */}
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#c52031] flex items-center justify-center shadow-xs">
              <GraduationCap size={22} strokeWidth={2.2} />
            </div>
            <span className="text-gray-900 font-bold text-base sm:text-lg tracking-tight">
              Employee Training Management
            </span>
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-2.5 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-semibold text-gray-900 tracking-tight leading-[1.18]">
              Train your teams. Track progress. Drive better performance.
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm leading-relaxed max-w-md mx-auto lg:mx-0">
              The simplest way to organize training, monitor progress, and build a skilled, confident team.
            </p>
          </div>

          {/* Features (Left) + Illustration (Right) Row */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-4 sm:gap-6 items-center pt-1">

            {/* Left Sub-column: Feature Badges & Quote */}
            <div className="flex flex-col justify-between space-y-5">
              <div className="space-y-3.5">
                {/* Feature 1 */}
                <div className="flex items-start gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">Organize Trainings</h2>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                      Create and manage training programs effortlessly.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-start gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">Track Progress</h2>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                      Monitor completion and performance across your team.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-start gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    <Users size={18} />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">Build Skilled Teams</h2>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                      Empower your employees to grow and succeed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Quote Aligned Under Feature List */}
              <div className="pt-2">
                <div className="w-6 h-0.5 bg-[#c52031] rounded-full mb-2" />
                <p className="text-[11px] sm:text-xs italic text-gray-500 font-medium leading-relaxed">
                  &ldquo;Invest in your people.<br />
                  A stronger team builds a brighter tomorrow.&rdquo;
                </p>
              </div>
            </div>

            {/* Right Sub-column: Illustration Graphic */}
            <div className="flex justify-center items-start">
              <img
                src="/loginTheme.webp"
                alt="Employee Training Illustration"
                className="w-full max-w-150 object-contain drop-shadow-sm transition-transform hover:scale-[1.02] duration-300"
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Clean Floating Login Card ── */}
        <div className="w-full max-w-150 lg:w-[40%] flex justify-center lg:justify-center">
          <div className="w-full max-w-150 bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-gray-100/80 p-7 sm:p-9 transition-all">

            {/* Card Header */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Sign in to continue to your dashboard
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700" htmlFor="login-email">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400 pointer-events-none">
                    <Mail size={18} />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    className={`w-full bg-white border ${errors.email ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-200'
                      } rounded-xl py-3 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#c52031] focus:ring-2 focus:ring-red-100 transition-all`}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 font-medium pt-0.5">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 pt-0.5">
                <label className="block text-xs font-semibold text-gray-700" htmlFor="login-password">
                  Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400 pointer-events-none">
                    <Lock size={18} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`w-full bg-white border ${errors.password ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-200'
                      } rounded-xl py-3 pl-10 pr-11 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#c52031] focus:ring-2 focus:ring-red-100 transition-all`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 text-gray-400 hover:text-gray-600 p-1 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 font-medium pt-0.5">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between pt-0.5 pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#c52031] border-gray-300 focus:ring-[#c52031] accent-[#c52031] cursor-pointer"
                  />
                  <span className="text-xs text-gray-600 font-medium">Remember me</span>
                </label>

                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#c52031] hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#c52031] hover:bg-[#a81a28] text-white font-semibold py-3.5 rounded-xl shadow-md shadow-red-900/15 hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Signing In…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer Copyright (Dynamic Year) */}
            <p className="text-[11px] text-gray-400 text-center mt-8">
              &copy; {new Date().getFullYear()} Employee Training Management. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
