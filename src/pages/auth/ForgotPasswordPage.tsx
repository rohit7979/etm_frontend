import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { GraduationCap, Mail, ArrowLeft, Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { requestPasswordReset } from '../../services/auth.api';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    try {
      await requestPasswordReset(data.email);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } catch {
      toast.error('Unable to send reset email. Please try again later.');
    } finally {
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
      <div className="w-full max-w-[430px] bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-gray-100/80 p-7 sm:p-9 transition-all">
        {isSubmitted ? (
          <div className="text-center py-2 space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 size={30} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-900">Check Your Email</h2>
              <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                If an account exists with <strong className="text-gray-800">{submittedEmail}</strong>, we have sent a secure password reset link. Please check your inbox and spam folder.
              </p>
            </div>

            <div className="pt-3">
              <Link
                to="/login"
                className="w-full bg-[#c52031] hover:bg-[#a81a28] text-white font-semibold py-3.5 rounded-xl shadow-md shadow-red-900/15 hover:shadow-lg transition-all text-sm inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} /> Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Card Header */}
            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#c52031] flex items-center justify-center mb-3">
                <KeyRound size={20} />
              </div>
              <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
                Forgot Password?
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Enter your registered email and we&apos;ll send you a password reset link.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700" htmlFor="forgot-email">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400 pointer-events-none">
                    <Mail size={18} />
                  </span>
                  <input
                    id="forgot-email"
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

              <button
                id="forgot-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#c52031] hover:bg-[#a81a28] text-white font-semibold py-3.5 rounded-xl shadow-md shadow-red-900/15 hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Sending Reset Link…
                  </>
                ) : (
                  <>
                    <Mail size={18} /> Send Reset Link
                  </>
                )}
              </button>
            </form>

            <div className="pt-5 mt-5 border-t border-gray-100 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#c52031] transition-colors"
              >
                <ArrowLeft size={14} /> Return to Sign In
              </Link>
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

export default ForgotPasswordPage;
