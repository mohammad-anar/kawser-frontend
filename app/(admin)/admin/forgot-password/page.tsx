"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useForgotPasswordMutation,
  useVerifyForgotOtpMutation,
  useResetPasswordMutation,
} from "@/lib/redux/api/authApi";
import {
  KeyRound,
  Mail,
  ShieldCheck,
  Lock,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";

type Step = 1 | 2 | 3 | 4;

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [forgotPassword, { isLoading: isSending }] = useForgotPasswordMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyForgotOtpMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  const clearMessages = () => { setError(""); setSuccessMsg(""); };

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email.trim()) { setError("ইমেইল ঠিকানা আবশ্যক।"); return; }
    try {
      const res = await forgotPassword({ email: email.trim().toLowerCase() }).unwrap();
      setSuccessMsg(res.message);
      setStep(2);
    } catch (err: any) {
      setError(err?.data?.message || "OTP পাঠাতে ব্যর্থ হয়েছে।");
    }
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (otp.trim().length !== 6) { setError("৬ সংখ্যার OTP দিন।"); return; }
    try {
      const res = await verifyOtp({ email: email.trim().toLowerCase(), otp: otp.trim() }).unwrap();
      setResetToken(res.resetToken);
      setStep(3);
    } catch (err: any) {
      setError(err?.data?.message || "OTP সঠিক নয়।");
    }
  };

  // ── Step 3: Reset Password ──────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (newPassword.length < 6) { setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"); return; }
    if (newPassword !== confirmPassword) { setError("পাসওয়ার্ড দুটি মিলছে না।"); return; }
    try {
      await resetPassword({ newPassword, resetToken }).unwrap();
      setStep(4);
    } catch (err: any) {
      setError(err?.data?.message || "পাসওয়ার্ড রিসেট করতে ব্যর্থ হয়েছে।");
    }
  };

  const stepLabels = ["ইমেইল", "OTP যাচাই", "নতুন পাসওয়ার্ড"];

  return (
    <div className="min-h-screen bg-[#05050b] text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4">
            <KeyRound size={28} className="text-yellow-400" />
          </div>
          <h1 className="text-2xl font-black text-white">পাসওয়ার্ড ভুলে গেছেন?</h1>
          <p className="text-sm text-gray-400 mt-1">ইমেইল OTP দিয়ে পাসওয়ার্ড রিসেট করুন</p>
        </div>

        {/* Step Progress */}
        {step < 4 && (
          <div className="flex items-center gap-1.5 mb-8">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center gap-1.5 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    step > i + 1
                      ? "bg-emerald-500 text-white"
                      : step === i + 1
                      ? "bg-yellow-500 text-black"
                      : "bg-white/10 text-gray-500"
                  }`}
                >
                  {step > i + 1 ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span
                  className={`text-[11px] font-medium hidden sm:block ${
                    step === i + 1 ? "text-yellow-400" : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
                {i < 2 && <div className="h-px flex-1 bg-white/10" />}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div className="glass-card p-7 border border-white/10 shadow-2xl">

          {/* Error / Success */}
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">
              {error}
            </div>
          )}
          {successMsg && step === 2 && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-400">
              {successMsg}
            </div>
          )}

          {/* ── Step 1: Email ──────────────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center mx-auto mb-3">
                  <Mail size={22} className="text-yellow-400" />
                </div>
                <p className="text-sm text-gray-400">
                  রেজিস্টার্ড অ্যাডমিন ইমেইল ঠিকানা দিন
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">ইমেইল ঠিকানা</label>
                <input
                  id="forgot-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearMessages(); }}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  className="w-full py-3 px-4 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors text-sm"
                />
              </div>

              <button
                id="send-forgot-otp-btn"
                type="submit"
                disabled={isSending || !email.trim()}
                className="btn-gold w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <><Loader2 size={16} className="animate-spin" /> OTP পাঠানো হচ্ছে...</>
                ) : (
                  <><Mail size={16} /> OTP পাঠান</>
                )}
              </button>

              <Link
                href="/admin/login"
                className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={13} /> লগইন পেজে ফিরুন
              </Link>
            </form>
          )}

          {/* ── Step 2: OTP ────────────────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck size={22} className="text-blue-400" />
                </div>
                <p className="text-sm text-gray-300">OTP পাঠানো হয়েছে:</p>
                <p className="text-yellow-400 font-semibold text-sm mt-0.5">{email}</p>
                <p className="text-xs text-gray-500 mt-1">১০ মিনিটের মধ্যে ব্যবহার করুন</p>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">৬ সংখ্যার OTP কোড</label>
                <input
                  id="forgot-otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); clearMessages(); }}
                  placeholder="• • • • • •"
                  autoFocus
                  className="w-full text-center text-2xl font-black tracking-[0.5em] py-4 px-4 bg-black/50 border border-white/10 rounded-xl text-yellow-400 placeholder-gray-700 focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              <button
                id="verify-forgot-otp-btn"
                type="submit"
                disabled={isVerifying || otp.length < 6}
                className="btn-gold w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <><Loader2 size={16} className="animate-spin" /> যাচাই হচ্ছে...</>
                ) : (
                  <><ShieldCheck size={16} /> OTP যাচাই করুন</>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setOtp(""); clearMessages(); }}
                className="w-full text-xs text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={13} /> নতুন OTP অনুরোধ করুন
              </button>
            </form>
          )}

          {/* ── Step 3: New Password ──────────────────────────────────── */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                  <Lock size={22} className="text-emerald-400" />
                </div>
                <p className="text-sm text-gray-400">নতুন পাসওয়ার্ড সেট করুন</p>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">নতুন পাসওয়ার্ড</label>
                <div className="relative">
                  <input
                    id="reset-new-password"
                    type={showPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); clearMessages(); }}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    minLength={6}
                    className="w-full py-3 pl-4 pr-11 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors text-sm"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">পাসওয়ার্ড নিশ্চিত করুন</label>
                <div className="relative">
                  <input
                    id="reset-confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearMessages(); }}
                    placeholder="পাসওয়ার্ড আবার লিখুন"
                    className="w-full py-3 pl-4 pr-11 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors text-sm"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">পাসওয়ার্ড দুটি মিলছে না।</p>
                )}
              </div>

              <button
                id="reset-password-submit-btn"
                type="submit"
                disabled={isResetting || newPassword.length < 6 || newPassword !== confirmPassword}
                className="btn-gold w-full flex items-center justify-center gap-2 py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? (
                  <><Loader2 size={16} className="animate-spin" /> পাসওয়ার্ড রিসেট হচ্ছে...</>
                ) : (
                  <><Lock size={16} /> পাসওয়ার্ড রিসেট করুন</>
                )}
              </button>
            </form>
          )}

          {/* ── Step 4: Success ───────────────────────────────────────── */}
          {step === 4 && (
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">পাসওয়ার্ড রিসেট সফল! 🎉</h3>
                <p className="text-sm text-gray-400 mt-1">
                  আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।<br />
                  নতুন পাসওয়ার্ড দিয়ে লগইন করুন।
                </p>
              </div>
              <button
                id="goto-login-btn"
                onClick={() => router.push("/admin/login")}
                className="btn-gold w-full py-3"
              >
                লগইন পেজে যান
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
