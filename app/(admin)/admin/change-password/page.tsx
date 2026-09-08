"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { useAppSelector } from "@/lib/redux/hooks";
import {
  useSendChangeOtpMutation,
  useVerifyChangeOtpMutation,
  useChangePasswordMutation,
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
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  const [step, setStep] = useState<Step>(1);
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const [sendOtp, { isLoading: isSending }] = useSendChangeOtpMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyChangeOtpMutation();
  const [changePwd, { isLoading: isChanging }] = useChangePasswordMutation();

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    try {
      const res = await sendOtp().unwrap();
      setSentEmail(res.email);
      toast.success("OTP পাঠানো হয়েছে!");
      setStep(2);
    } catch (err: any) {
      toast.error(err?.data?.message || "OTP পাঠাতে ব্যর্থ হয়েছে।");
    }
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      toast.error("৬ সংখ্যার OTP দিন।");
      return;
    }
    try {
      const res = await verifyOtp({ otp: otp.trim() }).unwrap();
      setResetToken(res.resetToken);
      toast.success("OTP যাচাই সফল!");
      setStep(3);
    } catch (err: any) {
      toast.error(err?.data?.message || "OTP সঠিক নয়।");
    }
  };

  // ── Step 3: Change Password ─────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("পাসওয়ার্ড দুটি মিলছে না।");
      return;
    }
    try {
      await changePwd({ newPassword, resetToken }).unwrap();
      setStep(4);
    } catch (err: any) {
      toast.error(err?.data?.message || "পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে।");
    }
  };

  const stepLabels = ["ইমেইল যাচাই", "OTP কোড", "নতুন পাসওয়ার্ড", "সম্পন্ন"];

  return (
    <div className="min-h-screen bg-[#05050b] text-white flex flex-col">
      <AdminNav />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4">
              <KeyRound size={28} className="text-yellow-400" />
            </div>
            <h1 className="text-2xl font-black text-white">পাসওয়ার্ড পরিবর্তন</h1>
            <p className="text-sm text-gray-400 mt-1">
              ইমেইল OTP দিয়ে আপনার পাসওয়ার্ড পরিবর্তন করুন
            </p>
          </div>

          {/* Step Progress */}
          {step < 4 && (
            <div className="flex items-center gap-1.5 mb-8">
              {stepLabels.slice(0, 3).map((label, i) => (
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

            {/* ── Step 1: Confirm Email ─────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="bg-white/5 rounded-xl p-4 flex items-start gap-3">
                  <Mail size={18} className="text-yellow-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">OTP পাঠানো হবে এই ইমেইলে</p>
                    <p className="text-white font-semibold text-sm">
                      {user?.email || "ইমেইল সেট নেই"}
                    </p>
                  </div>
                </div>

                {!user?.email && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">
                    আপনার অ্যাকাউন্টে কোনো ইমেইল সেট করা নেই। অনুগ্রহ করে প্রথমে ইমেইল যুক্ত করুন।
                  </div>
                )}

                <button
                  id="send-change-otp-btn"
                  onClick={handleSendOtp}
                  disabled={isSending || !user?.email}
                  className="btn-gold w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <><Loader2 size={16} className="animate-spin" /> OTP পাঠানো হচ্ছে...</>
                  ) : (
                    <><Mail size={16} /> OTP পাঠান</>
                  )}
                </button>

                <Link
                  href="/admin"
                  className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} /> ড্যাশবোর্ডে ফিরুন
                </Link>
              </div>
            )}

            {/* ── Step 2: Enter OTP ─────────────────────────────────────── */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck size={22} className="text-blue-400" />
                  </div>
                  <p className="text-sm text-gray-300">
                    OTP কোড পাঠানো হয়েছে:
                  </p>
                  <p className="text-yellow-400 font-semibold text-sm mt-0.5">{sentEmail}</p>
                  <p className="text-xs text-gray-500 mt-1">১০ মিনিটের মধ্যে ব্যবহার করুন</p>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">৬ সংখ্যার OTP কোড</label>
                  <input
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    className="w-full text-center text-2xl font-black tracking-[0.5em] py-4 px-4 bg-black/50 border border-white/10 rounded-xl text-yellow-400 placeholder-gray-700 focus:outline-none focus:border-yellow-500 transition-colors"
                    autoFocus
                  />
                </div>

                <button
                  id="verify-change-otp-btn"
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
                  onClick={() => { setStep(1); setOtp(""); }}
                  className="w-full text-xs text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={13} /> নতুন OTP অনুরোধ করুন
                </button>
              </form>
            )}

            {/* ── Step 3: New Password ──────────────────────────────────── */}
            {step === 3 && (
              <form onSubmit={handleChangePassword} className="space-y-4">
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
                      id="new-password-input"
                      type={showPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      minLength={6}
                      className="w-full py-3 pl-4 pr-11 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">পাসওয়ার্ড নিশ্চিত করুন</label>
                  <div className="relative">
                    <input
                      id="confirm-password-input"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="পাসওয়ার্ড আবার লিখুন"
                      className="w-full py-3 pl-4 pr-11 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">পাসওয়ার্ড দুটি মিলছে না।</p>
                  )}
                </div>

                <button
                  id="change-password-submit-btn"
                  type="submit"
                  disabled={isChanging || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="btn-gold w-full flex items-center justify-center gap-2 py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChanging ? (
                    <><Loader2 size={16} className="animate-spin" /> পরিবর্তন হচ্ছে...</>
                  ) : (
                    <><Lock size={16} /> পাসওয়ার্ড পরিবর্তন করুন</>
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
                  <h3 className="text-lg font-bold text-white">পাসওয়ার্ড পরিবর্তন সফল! 🎉</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।
                  </p>
                </div>
                <button
                  id="go-to-dashboard-btn"
                  onClick={() => router.push("/admin")}
                  className="btn-gold w-full py-3"
                >
                  ড্যাশবোর্ডে যান
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
