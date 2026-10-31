"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Zap } from "lucide-react";

interface FloatingBuyBarProps {
  onOrderClick: () => void;
}

export default function FloatingBuyBar({ onOrderClick }: FloatingBuyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    const handleScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="floating-bar md:hidden">
      <div className="flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-slate-900 dark:text-white font-bold text-xs leading-tight">Top Notch Magic Condom</p>
          <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
            ফ্রি ডেলিভারি & জেল
          </span>
        </div>
        <p className="text-blue-600 dark:text-blue-400 font-black text-lg leading-tight mt-0.5">৳৯৫০</p>
      </div>
      <button
        onClick={onOrderClick}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-500 text-white font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all active:scale-95 hover:shadow-lg hover:shadow-blue-500/30 whitespace-nowrap pulse-blue cursor-pointer"
      >
        <ShoppingBag size={15} />
        এখনই অর্ডার করুন
        <Zap size={13} />
      </button>
    </div>
  );
}
