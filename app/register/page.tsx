"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import OrderModal from "@/components/OrderModal";
import { useRegisterMutation } from "@/lib/redux/api/authApi";
import { User, Phone, Mail, Lock, UserPlus, AlertCircle, Loader2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const [register, { isLoading }] = useRegisterMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.password) {
      setError("নাম, মোবাইল নম্বর এবং পাসওয়ার্ড আবশ্যক।");
      return;
    }
    setError("");

    try {
      const res = await register({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
      }).unwrap();

      if (res.success) {
        router.push("/");
      }
    } catch (err: any) {
      setError(
        err?.data?.message ||
          err?.message ||
          "রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।"
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#06060c] text-white flex flex-col">
      <Header onOrderClick={() => setIsOrderModalOpen(true)} />

      <main className="flex-1 flex items-center justify-center px-4 pt-28 pb-16">
        <div className="max-w-md w-full glass-card p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-yellow-500/30">
              <UserPlus className="text-black" size={24} />
            </div>
            <h1 className="text-2xl font-black text-white">নতুন অ্যাকাউন্ট তৈরি</h1>
            <p className="text-xs text-gray-400 mt-1">
              একবার অ্যাকাউন্ট খুলুন, সহজেই যেকোনো সময় অর্ডার ট্র্যাক করুন
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
                আপনার পুরো নাম *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="যেমন: মোঃ করিম হাসান"
                  required
                  className="form-input form-input-has-icon !pl-11 pr-4 py-3"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                মোবাইল নম্বর *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="01XXXXXXXXX"
                  required
                  className="form-input form-input-has-icon !pl-11 pr-4 py-3"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                ইমেইল ঠিকানা (ঐচ্ছিক)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                  className="form-input form-input-has-icon !pl-11 pr-4 py-3"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                পাসওয়ার্ড তৈরি করুন *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="কমপক্ষে ৬ ডিজিটের পাসওয়ার্ড"
                  required
                  minLength={6}
                  className="form-input form-input-has-icon !pl-11 pr-4 py-3"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold w-full py-3.5 flex items-center justify-center gap-2 text-sm mt-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> অ্যাকাউন্ট তৈরি হচ্ছে...
                </>
              ) : (
                <>
                  <UserPlus size={16} /> সাইন আপ সম্পন্ন করুন
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-gray-400">
            আগেই একাউন্ট করা আছে?{" "}
            <Link
              href="/login"
              className="text-yellow-400 hover:text-yellow-300 font-semibold inline-flex items-center gap-1 ml-1 hover:underline"
            >
              লগইন করুন <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </main>

      <OrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} />
    </div>
  );
}
