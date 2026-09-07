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
        <p className="text-white font-bold text-sm leading-tight">Top Notch Magic Condom</p>
        <p className="text-yellow-400 font-black text-lg leading-tight">৳৮৯৯</p>
      </div>
      <button
        onClick={onOrderClick}
        className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-black px-5 py-3 rounded-xl text-sm transition-all active:scale-95 hover:shadow-lg hover:shadow-yellow-500/30 whitespace-nowrap pulse-gold"
      >
        <ShoppingBag size={16} />
        এখনই অর্ডার করুন
        <Zap size={14} />
      </button>
    </div>
  );
}
