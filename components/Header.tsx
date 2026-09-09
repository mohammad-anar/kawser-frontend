"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, User, LogOut, Menu, X, Shield } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { logout } from "@/lib/redux/slices/authSlice";
import Image from "next/image";

function WhatsAppIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.476-.15-.676.15-.2.301-.776.978-.951 1.178-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.784-1.675-2.085-.175-.301-.019-.464.132-.614.136-.135.301-.351.451-.527.15-.175.2-.301.301-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.927-2.235-.244-.589-.493-.509-.676-.519-.175-.01-.376-.01-.576-.01-.2 0-.526.075-.802.376-.276.301-1.052 1.028-1.052 2.508 0 1.48 1.077 2.909 1.228 3.109.15.2 2.12 3.238 5.136 4.542.717.31 1.277.496 1.713.634.72.229 1.375.197 1.893.12.577-.087 1.78-.727 2.03-1.429.25-.702.25-1.304.175-1.43-.075-.125-.276-.201-.577-.351z" />
      <path d="M12.004 2c-5.523 0-10 4.477-10 10 0 1.768.46 3.488 1.336 5.006L2 22l5.12-1.314A9.957 9.957 0 0 0 12.004 22c5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 18.273a8.23 8.23 0 0 1-4.204-1.152l-.302-.18-3.123.802.833-3.044-.197-.314A8.257 8.257 0 1 1 12.004 20.273z" />
    </svg>
  );
}

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
      <div className="announcement-bar text-black bg-gradient-to-br from-yellow-500 to-yellow-600 text-center py-2 px-3 text-xs sm:text-sm md:text-[15px] font-black flex items-center justify-center gap-2 sm:gap-3 shadow-md">
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
            <div className="w-36 sm:w-40">
              <Image src={"/images/selfcaresolution2.PNG"} width={200} height={100} alt="Logo" priority />
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7 text-base font-semibold">
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 font-bold border border-yellow-500/30 transition-all text-xs"
              >
                <Shield size={14} className="text-yellow-400" /> এডমিন ড্যাশবোর্ড
              </Link>
            )}
            <Link href="/#product" className="text-gray-300 hover:text-yellow-400 transition-colors">
              পণ্য
            </Link>

            <Link
              href="/track"
              className="text-gray-300 hover:text-yellow-400 transition-colors flex items-center gap-1.5"
            >
              <Package size={18} className="text-yellow-400" /> ট্র্যাক অর্ডার
            </Link>
            <a
              href="https://wa.me/8801932787942?text=Hello%20Selfcare%20Solution"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-bold"
            >
              <WhatsAppIcon size={19} /> WhatsApp
            </a>
          </nav>

          {/* Auth + CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold"
                  >
                    <Shield size={13} /> এডমিন
                  </Link>
                )}
                <span className="hidden md:block text-gray-300 text-sm sm:text-base font-medium">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="লগআউট"
                  className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center gap-1.5 text-gray-300 hover:text-yellow-400 transition-colors text-sm sm:text-base font-semibold px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                <User size={17} /> লগইন
              </Link>
            )}

            <button
              onClick={onOrderClick}
              className="btn-gold text-sm sm:text-base px-4 sm:px-6 py-2.5 rounded-xl pulse-gold font-black cursor-pointer"
            >
              অর্ডার করুন
            </button>

            <button
              className="md:hidden p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle Menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#0a0a1e] border-t border-yellow-500/15 px-5 py-5 flex flex-col gap-4 shadow-2xl animate-fadeIn text-base font-medium">
            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="text-yellow-400 bg-yellow-500/15 border border-yellow-500/30 p-2.5 rounded-xl flex items-center gap-2 text-base font-bold"
              >
                <Shield size={18} /> এডমিন ড্যাশবোর্ডে যান
              </Link>
            )}
            <a
              href="/#product"
              onClick={() => setMenuOpen(false)}
              className="text-gray-200 hover:text-yellow-400 text-base py-1 transition-colors"
            >
              পণ্য বিবরণ
            </a>
            <a
              href="#features"
              onClick={() => setMenuOpen(false)}
              className="text-gray-200 hover:text-yellow-400 text-base py-1 transition-colors"
            >
              বিশেষ বৈশিষ্ট্য
            </a>
            <Link
              href="/track"
              onClick={() => setMenuOpen(false)}
              className="text-yellow-400 flex items-center gap-2 text-base font-semibold py-1"
            >
              <Package size={18} /> অর্ডার ট্র্যাক করুন
            </Link>
            <a
              href="https://wa.me/8801932787942?text=Hello%20Selfcare%20Solution"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2 text-base font-bold py-1"
            >
              <WhatsAppIcon size={20} /> WhatsApp
            </a>

            <div className="pt-3 border-t border-white/10">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="text-red-400 flex items-center gap-2 text-base text-left font-medium w-full py-1 cursor-pointer"
                >
                  <LogOut size={18} /> লগআউট ({user.name})
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-200 hover:text-white flex items-center gap-2 text-base font-semibold py-1"
                >
                  <User size={18} /> লগইন / রেজিস্ট্রেশন
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
