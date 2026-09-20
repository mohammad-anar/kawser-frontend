"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  User,
  LogOut,
  Menu,
  X,
  Shield,
  UserPlus,
  HelpCircle,
  Sparkles,
  ShoppingBag,
  Star,
  CheckCircle2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { logout } from "@/lib/redux/slices/authSlice";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  onOrderClick: () => void;
}

export default function Header({ onOrderClick }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [localUser, setLocalUser] = useState<{ name?: string; role?: string; phone?: string } | null>(null);
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    try {
      const u = localStorage.getItem("pc_user");
      if (u) {
        setLocalUser(JSON.parse(u));
      }
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  const handleLogout = () => {
    dispatch(logout());
    setLocalUser(null);
    setMenuOpen(false);
  };

  const currentUser = user || localUser;
  const isAdmin = currentUser?.role === "admin";
  const isAuth = isAuthenticated || Boolean(currentUser);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Top Announcement Bar */}
      <div className="announcement-bar text-white bg-gradient-to-r from-blue-700 to-blue-600 dark:from-blue-800 dark:to-blue-900 text-center py-2 px-3 text-xs sm:text-sm md:text-[15px] font-black flex items-center justify-center gap-2 sm:gap-3 shadow-md">
        <span>🚀 সারাদেশে ফ্রি হোম ডেলিভারি</span>
        <span className="hidden xs:inline">•</span>
        <span className="hidden xs:inline">পণ্য দেখে পেমেন্ট</span>
        <span>•</span>
        <span>ক্যাশ অন ডেলিভারি ✅</span>
      </div>

      {/* Main Navbar */}
      <div
        className={`transition-all duration-300 ${scrolled
          ? "bg-white/98 dark:bg-[#080817]/98 backdrop-blur-md shadow-md shadow-blue-100/60 dark:shadow-none border-b border-blue-100 dark:border-slate-800"
          : "bg-white/90 dark:bg-[#080817]/90 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800"
          }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group transition-transform duration-200 hover:scale-105"
            title="হোম পেজ"
          >
            <div className="w-16 sm:w-16 overflow-hidden rounded-xl">
              <Image
                src="/logo.jpeg"
                width={60}
                height={60}
                alt="Care Zone BD - টপ নচ ম্যাজিক কনডম বাংলাদেশ"
                priority
                className="h-auto w-full object-contain"
              />
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Shield size={16} />
                <span>এডমিন ড্যাশবোর্ড</span>
              </Link>
            )}

            <Link
              href="/#product"
              className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              পণ্য বিবরণ
            </Link>

            <Link
              href="/#why"
              className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              কেন নিবেন?
            </Link>

            <Link
              href="/#reviews"
              className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              রিভিউ
            </Link>

            <Link
              href="/#faq"
              className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              জিজ্ঞাসা (FAQ)
            </Link>

            <Link
              href="/track"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1 font-bold"
            >
              <Package size={16} /> ট্র্যাক অর্ডার
            </Link>
          </nav>

          {/* Right Action Icons & Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Desktop Auth Controls */}
            <div className="hidden md:flex items-center gap-2">
              {isAuth && currentUser ? (
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                      title="এডমিন ড্যাশবোর্ডে যান"
                    >
                      <Shield size={14} className="text-blue-600 dark:text-blue-400" />
                      <span>{currentUser.name || "এডমিন"}</span>
                    </Link>
                  ) : (
                    <span className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold max-w-[120px] truncate">
                      {currentUser.name}
                    </span>
                  )}
                  <button
                    onClick={handleLogout}
                    title="লগআউট"
                    className="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/login"
                    className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs sm:text-sm font-bold px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800"
                  >
                    <User size={15} /> লগইন
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-xs sm:text-sm font-bold px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800"
                  >
                    <UserPlus size={15} /> রেজিস্টার
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Admin Quick Badge (If logged in as admin) */}
            {isAdmin && (
              <Link
                href="/admin"
                className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                title="এডমিন ড্যাশবোর্ডে প্রবেশ করুন"
              >
                <Shield size={13} />
                <span>এডমিন</span>
              </Link>
            )}

            {/* Order CTA Button */}
            <button
              onClick={onOrderClick}
              className="btn-gold text-xs sm:text-sm px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl pulse-gold font-black cursor-pointer whitespace-nowrap shadow-md"
            >
              অর্ডার করুন
            </button>

            {/* Mobile Menu Hamburger Button */}
            <button
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle Menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Sheet Menu */}
        {menuOpen && (
          <div className="md:hidden fixed inset-x-0 top-[calc(100%)] bg-white/98 dark:bg-[#0a0a1e]/98 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-2xl animate-fadeIn max-h-[85vh] overflow-y-auto z-50">
            <div className="p-5 space-y-4">
              {/* Admin Highlight Banner if Admin */}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Shield size={20} className="text-yellow-300" />
                    <span>এডমিন কন্ট্রোল প্যানেল</span>
                  </div>
                  <span className="text-xs bg-white/20 px-2.5 py-1 rounded-lg">ড্যাশবোর্ড →</span>
                </Link>
              )}

              {/* User Account / Auth Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                {isAuth && currentUser ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base">
                        {currentUser.name?.charAt(0).toUpperCase() || "A"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.phone || "Admin"}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-red-100 transition-colors"
                    >
                      <LogOut size={14} /> লগআউট
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">অ্যাকাউন্ট অ্যাক্সেস</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/login"
                        onClick={() => setMenuOpen(false)}
                        className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all hover:border-blue-400"
                      >
                        <User size={15} className="text-blue-600 dark:text-blue-400" />
                        লগইন করুন
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMenuOpen(false)}
                        className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
                      >
                        <UserPlus size={15} />
                        রেজিস্ট্রেশন
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Links List */}
              <div className="space-y-1 pt-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">পেজ নেভিগেশন</p>

                <Link
                  href="/#product"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm transition-all"
                >
                  <Sparkles size={18} className="text-blue-500" />
                  <span>পণ্য ও ভিডিও বিবরণ</span>
                </Link>

                <Link
                  href="/#why"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm transition-all"
                >
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span>কেন এটি ব্যবহার করবেন?</span>
                </Link>

                <Link
                  href="/#reviews"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm transition-all"
                >
                  <Star size={18} className="text-yellow-400" />
                  <span>গ্রাহক রিভিউ ও অভিজ্ঞতা</span>
                </Link>

                <Link
                  href="/#faq"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm transition-all"
                >
                  <HelpCircle size={18} className="text-blue-500" />
                  <span>সাধারণ জিজ্ঞাসা (FAQ)</span>
                </Link>

                <Link
                  href="/track"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 font-bold text-sm transition-all"
                >
                  <Package size={18} />
                  <span>অর্ডার ট্র্যাকিং</span>
                </Link>
              </div>

              {/* Order Quick Action */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOrderClick();
                  }}
                  className="w-full btn-gold py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer"
                >
                  <ShoppingBag size={18} />
                  এখনই অর্ডার করুন (৳৮৯৯)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
