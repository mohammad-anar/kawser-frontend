"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, User, LogOut, Menu, X, Phone, Shield } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { logout } from "@/lib/redux/slices/authSlice";

interface HeaderProps {
  onOrderClick: () => void;
}

export default function Header({ onOrderClick }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Top Announcement Bar - always visible on top */}
      <div className="announcement-bar text-black bg-gradient-to-br from-yellow-500 to-yellow-600 text-center py-1.5 px-3 text-[11px] sm:text-xs md:text-sm font-extrabold flex items-center justify-center gap-1.5 sm:gap-2 shadow-md">
        <span>🚀 সারাদেশে ফ্রি হোম ডেলিভারি</span>
        <span className="hidden xs:inline">•</span>
        <span className="hidden xs:inline">পণ্য দেখে পেমেন্ট</span>
        <span>•</span>
        <span>ক্যাশ অন ডেলিভারি ✅</span>
      </div>

      {/* Main Navbar */}
      <div
        className={`transition-all duration-300 ${scrolled
          ? "bg-[#080817]/95 backdrop-blur-md shadow-lg shadow-black/40 border-b border-yellow-500/15"
          : "bg-[#080817]/80 backdrop-blur-sm border-b border-white/5"
          }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between">
          {/* Logo */}
          <Link
            href={user?.role === "admin" ? "/admin" : "/"}
            className="flex items-center gap-2 group"
            title={user?.role === "admin" ? "এডমিন ড্যাশবোর্ডে যান" : "হোম পেজ"}
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30 group-hover:scale-105 transition-transform relative">
              <span className="text-black font-black text-sm">PC</span>
              {user?.role === "admin" && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-black rounded-full" title="Admin Active" />
              )}
            </div>
            <div className="leading-tight">
              <div className="font-black text-white text-base tracking-tight flex items-center gap-1">
                Personal Care
                {user?.role === "admin" && (
                  <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-1.5 py-0.2 rounded border border-yellow-500/30 font-bold">
                    Admin
                  </span>
                )}
              </div>
              <div className="text-yellow-400 text-[10px] font-semibold tracking-widest uppercase">BD</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 font-bold border border-yellow-500/30 transition-all text-xs"
              >
                <Shield size={13} className="text-yellow-400" /> এডমিন ড্যাশবোর্ড
              </Link>
            )}
            <a href="#product" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium">
              পণ্য
            </a>
            <a href="#features" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium">
              বৈশিষ্ট্য
            </a>
            <Link
              href="/track"
              className="text-gray-300 hover:text-yellow-400 transition-colors flex items-center gap-1 font-medium"
            >
              <Package size={15} className="text-yellow-400" /> ট্র্যাক অর্ডার
            </Link>
            <a
              href="https://wa.me/8801519601128?text=Hello%20Personal%20Care%20BD"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
            >
              <Phone size={14} /> হেল্পলাইন (WhatsApp)
            </a>
          </nav>


          {/* Auth + CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold"
                  >
                    <Shield size={12} /> এডমিন
                  </Link>
                )}
                <span className="hidden md:block text-gray-300 text-xs sm:text-sm font-medium">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="লগআউট"
                  className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center gap-1 text-gray-300 hover:text-yellow-400 transition-colors text-xs sm:text-sm font-medium px-2.5 py-1.5 rounded-lg hover:bg-white/5"
              >
                <User size={14} /> লগইন
              </Link>
            )}

            <button
              onClick={onOrderClick}
              className="btn-gold text-xs sm:text-sm px-3.5 sm:px-5 py-2 rounded-xl pulse-gold font-black"
            >
              অর্ডার করুন
            </button>

            <button
              className="md:hidden p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-white/5"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle Menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#0a0a1e] border-t border-yellow-500/15 px-4 py-4 flex flex-col gap-3.5 shadow-2xl animate-fadeIn">
            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="text-yellow-400 bg-yellow-500/15 border border-yellow-500/30 p-2.5 rounded-xl flex items-center gap-2 text-sm font-bold"
              >
                <Shield size={16} /> এডমিন ড্যাশবোর্ডে যান
              </Link>
            )}
            <a
              href="#product"
              onClick={() => setMenuOpen(false)}
              className="text-gray-300 hover:text-yellow-400 text-sm font-medium py-1"
            >
              পণ্য বিবরণ
            </a>
            <a
              href="#features"
              onClick={() => setMenuOpen(false)}
              className="text-gray-300 hover:text-yellow-400 text-sm font-medium py-1"
            >
              বিশেষ বৈশিষ্ট্য
            </a>
            <Link
              href="/track"
              onClick={() => setMenuOpen(false)}
              className="text-yellow-400 flex items-center gap-2 text-sm font-medium py-1"
            >
              <Package size={16} /> অর্ডার ট্র্যাক করুন
            </Link>
            <a
              href="https://wa.me/8801519601128?text=Hello%20Personal%20Care%20BD"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 flex items-center gap-2 text-sm font-semibold py-1"
            >
              <Phone size={16} /> হেল্পলাইন (WhatsApp)
            </a>


            <div className="pt-2 border-t border-white/10">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="text-red-400 flex items-center gap-2 text-sm text-left font-medium w-full py-1"
                >
                  <LogOut size={16} /> লগআউট ({user.name})
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-200 hover:text-white flex items-center gap-2 text-sm font-medium py-1"
                >
                  <User size={16} /> লগইন / রেজিস্ট্রেশন
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
