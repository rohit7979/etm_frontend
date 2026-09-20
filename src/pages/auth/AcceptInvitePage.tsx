import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast, { Toaster } from 'react-hot-toast';
import {
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ArrowLeft,
} from 'lucide-react';
import axios from 'axios';
import { verifyInviteToken, acceptInvite } from '../../services/auth.api';
import { useAuth } from '../../contexts/AuthContext';

const acceptInviteSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

export const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [invitedUser, setInvitedUser] = useState<{ email: string; name: string; companyName?: string | null } | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
  });

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setIsTokenValid(false);
      setErrorMessage('No invitation token found in the link. Please check the URL.');
      return;
    }

    const verify = async () => {
      try {
        const data = await verifyInviteToken(token);
        setInvitedUser(data);
        setIsTokenValid(true);
      } catch (err: unknown) {
        setIsTokenValid(false);
        let msg = 'This invitation token is invalid or has expired.';
        if (axios.isAxiosError(err)) {
          msg = err.response?.data?.message || msg;
        }
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    };

    verify();
  }, [token]);

  const onSubmit = async (data: AcceptInviteFormData) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      const res = await acceptInvite(token, data.password);
      const authData = (res as any)?.data || res;

      if (authData?.user) {
        // Direct login to newly provisioned company admin session (cookie set automatically by backend)
        login(authData.user);
        toast.success(`Welcome, ${authData.user.name}! Your account is now active.`);
        navigate('/admin/dashboard', { replace: true });
      } else {
        toast.success('Password set successfully! Please log in with your credentials.');
        navigate('/login', { replace: true });
      }
    } catch (err: unknown) {
      let msg = 'Failed to activate account. Please try again.';
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || msg;
      }
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7fb] flex flex-col items-center justify-center py-8 px-4 sm:px-6 font-sans overflow-x-hidden">
      <Toaster position="top-right" />

      {/* Brand Header */}
      <Link to="/login" className="flex items-center gap-3 mb-6 group transition-transform hover:scale-[1.01]">
        <div className="w-10 h-10 rounded-xl bg-red-50 text-[#c52031] flex items-center justify-center shadow-xs">
          <GraduationCap size={24} strokeWidth={2.2} />
        </div>
        <span className="text-gray-900 font-bold text-lg tracking-tight">
          Employee Training Management
        </span>
      </Link>

      {/* Floating Card */}
      <div className="w-full max-w-[450px] bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-gray-100/80 p-7 sm:p-9 transition-all">
        {isLoading ? (
          <div className="py-14 text-center space-y-4">
            <Loader2 size={36} className="animate-spin text-[#c52031] mx-auto" />
            <p className="text-sm text-gray-500 font-medium">Verifying invitation link…</p>
          </div>
        ) : !isTokenValid ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Invitation Invalid or Expired</h2>
              <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#c52031] hover:underline"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Card Header */}
            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#c52031] flex items-center justify-center mb-3">
                <Lock size={20} />
              </div>
              <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
                Activate Your Account
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {invitedUser?.companyName
                  ? `Complete setup for ${invitedUser.companyName}`
                  : 'Create your administrator password to activate your account'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Read-Only Email Display */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">Administrator Email</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400 pointer-events-none">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    readOnly
                    disabled
                    value={invitedUser?.email || ''}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-600 cursor-not-allowed select-none outline-none"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 pt-0.5">
                <label className="block text-xs font-semibold text-gray-700" htmlFor="new-password">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400 pointer-events-none">
                    <Lock size={18} />
                  </span>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className={`w-full bg-white border ${
                      errors.password ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-200'
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

              {/* Confirm Password Field */}
              <div className="space-y-1.5 pt-0.5">
                <label className="block text-xs font-semibold text-gray-700" htmlFor="confirm-password">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400 pointer-events-none">
                    <Lock size={18} />
                  </span>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className={`w-full bg-white border ${
                      errors.confirmPassword ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-200'
                    } rounded-xl py-3 pl-10 pr-11 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#c52031] focus:ring-2 focus:ring-red-100 transition-all`}
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 text-gray-400 hover:text-gray-600 p-1 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 font-medium pt-0.5">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                id="accept-invite-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#c52031] hover:bg-[#a81a28] text-white font-semibold py-3.5 rounded-xl shadow-md shadow-red-900/15 hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Activating Account…
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} /> Activate &amp; Continue
                  </>
                )}
              </button>
            </form>

            <div className="pt-5 mt-5 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">
                Already have an active account?{' '}
                <Link to="/login" className="text-[#c52031] font-semibold hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer Copyright */}
      <p className="text-[11px] text-gray-400 text-center mt-6">
        &copy; {new Date().getFullYear()} Employee Training Management. All rights reserved.
      </p>
    </div>
  );
};

export default AcceptInvitePage;
