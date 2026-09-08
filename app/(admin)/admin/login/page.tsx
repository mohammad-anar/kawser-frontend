"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminLoginMutation } from "@/lib/redux/api/authApi";
import { ShieldCheck, Mail, Lock, LogIn, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@personalcarebd.com");
  const [password, setPassword] = useState("admin123456");
  const [error, setError] = useState("");

  const [adminLogin, { isLoading }] = useAdminLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("অ্যাডমিন ইমেইল ও পাসওয়ার্ড দিন।");
      return;
    }
    setError("");

    try {
      const res = await adminLogin({ email: email.trim(), password }).unwrap();
      if (res.success) {
        router.push("/admin");
      }
    } catch (err: any) {
      setError(
        err?.data?.message ||
          err?.message ||
          "লগইন ব্যর্থ হয়েছে। সঠিক অ্যাডমিন ক্রেডেনশিয়াল দিন।"
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#040409] text-white flex flex-col items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-card p-8 border border-yellow-500/20 shadow-2xl relative">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-yellow-500/30">
            <ShieldCheck className="text-black" size={30} />
          </div>
          <h1 className="text-2xl font-black text-white">অ্যাডমিন কন্ট্রোল প্যানেল</h1>
          <p className="text-xs text-yellow-400 font-medium mt-1">
            Personal Care BD — Management Portal
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              অ্যাডমিন ইমেইল
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@personalcarebd.com"
                required
                className="form-input form-input-has-icon !pl-11 pr-4 py-3 bg-black/60 border-white/20 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              অ্যাডমিন পাসওয়ার্ড
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="form-input form-input-has-icon !pl-11 pr-4 py-3 bg-black/60 border-white/20 text-white"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400">
            💡 <span className="text-yellow-400 font-semibold">ডিফল্ট অ্যাডমিন:</span> admin@personalcarebd.com / admin123456
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-gold w-full py-3.5 flex items-center justify-center gap-2 text-sm mt-2 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> লগইন হচ্ছে...
              </>
            ) : (
              <>
                <LogIn size={16} /> অ্যাডমিন প্যানেলে প্রবেশ করুন
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <Link
            href="/admin/forgot-password"
            className="text-yellow-400 hover:text-yellow-300 text-xs font-semibold transition-colors"
          >
            পাসওয়ার্ড ভুলে গেছেন?
          </Link>
          <Link
            href="/"
            className="text-gray-400 hover:text-white text-xs inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={12} /> প্রধান ওয়েবসাইটে ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
