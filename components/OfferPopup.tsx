"use client";

import { useEffect, useState } from "react";
import { X, Truck, Zap, ShoppingBag } from "lucide-react";

interface OfferPopupProps {
  onClaimOffer: () => void;
}

export default function OfferPopup({ onClaimOffer }: OfferPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen the popup in localStorage
    const isNewUser = localStorage.getItem("isNew");
    if (isNewUser === null || isNewUser === "true") {
      // Delay popup slightly for smooth entrance animation
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("isNew", "false");
    setIsOpen(false);
  };

  const handleClaim = () => {
    localStorage.setItem("isNew", "false");
    setIsOpen(false);
    onClaimOffer();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative max-w-sm w-full bg-gradient-to-b from-[#111129] to-[#0a0a1a] border-2 border-yellow-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-yellow-500/20 text-center animate-scaleIn">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Top Floating Badge with Truck Icon (matching screenshot) */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30 border border-emerald-400/40 transform -translate-y-2">
          <Truck className="text-white" size={32} />
        </div>

        {/* Headline */}
        <h2 className="text-2xl font-black text-white flex items-center justify-center gap-1.5">
          অভিনন্দন! <span className="text-2xl">🎉</span>
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-gray-300 mt-2.5 leading-relaxed font-medium">
          আপনার জন্য <span className="text-yellow-400 font-extrabold underline decoration-yellow-400/50 underline-offset-2">ফ্রি ডেলিভারি</span> অফারটি এক্টিভেট করা হয়েছে!
        </p>

        {/* Pricing Highlight */}
        <div className="my-4 py-2 px-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <p className="text-xs text-yellow-300 font-bold">
            🔥 স্পেশাল ডিসকাউন্ট মূল্য: <span className="text-yellow-400 font-black text-base">৳৮৯৯</span> (ডেলিভারি একদম ফ্রি)
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleClaim}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-base shadow-xl shadow-emerald-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <ShoppingBag size={18} />
          অফারটি নিন
          <Zap size={16} />
        </button>

        <p className="text-[11px] text-gray-500 mt-3">
          🔒 ক্যাশ অন ডেলিভারি • পণ্য দেখে পেমেন্ট
        </p>
      </div>
    </div>
  );
}
