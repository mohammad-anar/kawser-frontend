"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import OrderModal from "@/components/OrderModal";
import FloatingBuyBar from "@/components/FloatingBuyBar";
import OfferPopup from "@/components/OfferPopup";
import {
  CheckCircle2,
  Star,
  ShieldCheck,
  Truck,
  RefreshCw,
  Award,
  ChevronLeft,
  ChevronRight,
  Zap,
  ShoppingBag,
  Sparkles,
  Lock,
  Clock,
  ThumbsUp,
  AlertTriangle,
  Gift,
  Check,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Package,
  ArrowRight,
} from "lucide-react";


const SLIDE_IMAGES = [
  {
    src: "/images/products/product-main.jpg",
    title: "টপ নচ প্রিমিয়াম ম্যাজিক কনডম",
    subtitle: "অরিজিনাল চায়না ইম্পোর্টেড প্যাকেজিং",
  },
  {
    src: "/images/products/product-1.webp",
    title: "৬ মিলিমিটার এক্সট্রা পুরুত্ব",
    subtitle: "ডটেড ও রিবড সারফেস — বাড়তি অনুভূতি ও স্থায়িত্ব",
  },
  {
    src: "/images/products/product-2.webp",
    title: "১০০% হাই-গ্রেড TPE সিলিকন",
    subtitle: "যত টানবেন তত লম্বা, ছিঁড়ে যাওয়ার কোনো ভয় নেই",
  },
  {
    src: "/images/products/product-3.webp",
    title: "৬.৭ ইঞ্চি সম্পূর্ণ দৈর্ঘ্য",
    subtitle: "সামনের অংশে ১–১.৫ ইঞ্চি সলিড ভরাট ডিজাইন",
  },
  {
    src: "/images/products/product-4.jpg",
    title: "ডাবল লক হোল ডিজাইন",
    subtitle: "মিলনের সময় কনডম খুলে পড়ার কোনো সম্ভাবনা নেই",
  },
  {
    src: "/images/products/product-5.jpeg",
    title: "৭০০–৮০০ বার ওয়াশেবল ও রিইউজেবল",
    subtitle: "সাবান-পানি দিয়ে ধুয়ে সহজে বারবার ব্যবহার করুন",
  },
];

const WHY_POINTS = [
  {
    text: "পুরুত্ব ৬ মিলিমিটার এবং দৈর্ঘ্য ৬.৭ ইঞ্চি — বাড়তি স্থায়িত্ব ও সুরক্ষা।",
    highlight: "৬ মিলিমিটার & ৬.৭ ইঞ্চি",
  },
  {
    text: "একটি কনডম ৭০০–৮০০ বার পর্যন্ত ব্যবহারযোগ্য — দীর্ঘস্থায়ী ও অর্থসাশ্রয়ী।",
    highlight: "৭০০–৮০০ বার ব্যবহারযোগ্য",
  },
  {
    text: "মিলনের স্থায়িত্ব ৩০–৪০ মিনিট পর্যন্ত বাড়িয়ে দিতে সক্ষম।",
    highlight: "৩০–৪০ মিনিট বৃদ্ধি",
  },
  {
    text: "সামনের অংশে ১–১.৫ ইঞ্চি ভরাট ডিজাইন — পুরুষাঙ্গকে বড় ও আকর্ষণীয় দেখায়।",
    highlight: "১–১.৫ ইঞ্চি ভরাট ডিজাইন",
  },
  {
    text: "সব সাইজের পুরুষাঙ্গের জন্য উপযোগী — ছোট বা বড়, সবার জন্য নিখুঁত ফিট।",
    highlight: "সব সাইজে নিখুঁত ফিট",
  },
  {
    text: "উচ্চমানের TPE সিলিকন রাবার — যত টানবেন তত লম্বা, ছিঁড়ে যাওয়ার ভয় নেই।",
    highlight: "হাই-গ্রেড TPE সিলিকন",
  },
];

const QA_ITEMS = [
  {
    question: "কিভাবে ব্যাবহার করবো ?",
    answer:
      "কনডমের সোজা ফুটাতে আপনার পুরুষাঙ্গে টা ঢুকাবেন আর নিচের ফুটাতে আপনার পুরুষাঙ্গের থলিটা ঢুকিয়ে রাখতে পারবেন এর ফলে আপনার মিলন শেষ হয়ে গেলও আপনার পুরুষাঙ্গে থেকে কনডম টি খুলে জাবে না। এর ফলে যতক্ষণ ইচ্ছা আপনার পার্টনারের সাথে সাথে মিলন চালিয়ে যেতে পারবেন। কনডমটি ব্যবহারের পর ভালো ভাবে সাবান এবং পানি দিয়ে ধুয়ে রেখে দিতে হবে।",
    icon: "💡",
  },
  {
    question: "কি কি সুবিধা পাবো?",
    answer:
      "👉 Top Notch কোয়ালিটি পাবেন 👉 এক মাসের আগে ছিঁড়ে গেলে ৫০% ডিসকাউন্টে নতুন পাবেন। 👉 কথা কাজে মিল পাবেন।",
    icon: "🎁",
  },
  {
    question: "প্রোডাক্ট পছন্দ না হইলে কি করব?",
    answer:
      "প্রোডাক্ট যেমন দেখিয়েছি ঐরকম ১০০% হওয়ার পরও যদি কোন কারণে না নিতে চান, ডেলিভারি চার্জ দিয়ে রিটার্ন করে দিতে পারবেন।",
    icon: "🔄",
  },
  {
    question: "ডেলিভালি কতদিন লাগে?",
    answer:
      "ঢাকার মধ্যে আজকে অর্ডার করে কালকে পাবেন। ঢাকার পাশে ঠিকানা হলে ০২ দিন , ঢাকার বাহিরে হলে ০৩ দিন লাগবে।",
    icon: "🚚",
  },
  {
    question: "কত কত সাইজ আছে ?",
    answer:
      "আপনার বর্তমান সাইজ যদি ৩/৪/৫/৬ এর মধ্যে হয় আপনি অর্ডার করার সময় লিখে দিয়েন। আমরা আপনার সাইজ অনুযায়ী দিয়ে দিবো।",
    icon: "📏",
  },
  {
    question: "প্রতারণার শিকার হবো কি?",
    answer:
      "আপনি বিশ্বাস রাখতে পারেন – ইনশা-আল্লাহ আপনি নিরাশ হবেন না। যাই দেখেছেন তাই পাবেন। বিদ্রঃ আপনার গোপনীয়তা ১০০% রক্ষা করা হয়।",
    icon: "🛡️",
  },
];

const REVIEWS = [
  {
    name: "মোঃ রফিকুল ইসলাম",
    location: "মিরপুর, ঢাকা",
    rating: 5,
    date: "২ দিন আগে",
    text: "প্যাকেজিং খুবই গোপনীয় ছিল, ডেলিভারি ম্যান কিছুই বুঝতে পারেনি। প্রোডাক্টের কোয়ালিটি অসাধারণ, ঠিক যেমনটি ডেসক্রিপশনে বলা হয়েছে।",
  },
  {
    name: "তানভীর আহমেদ",
    location: "জিইসি, চট্টগ্রাম",
    rating: 5,
    date: "৪ দিন আগে",
    text: "প্রথমে বিশ্বাস হচ্ছিল না কিন্তু ব্যবহার করার পর পুরোই অবাক! আসলেই সময় অনেক বাড়ে এবং ম্যাটেরিয়াল অনেক সফট ও কম্ফোর্টেবল।",
  },
  {
    name: "শফিকুল হাসান",
    location: "উপশহর, সিলেট",
    rating: 5,
    date: "১ সপ্তাহ আগে",
    text: "খুবই ভালো সার্ভিস। দেখার পর ডেলিভারি ম্যানকে টাকা দিয়েছি। ১০০% জেনুইন মাল পেয়েছি। ধন্যবাদ Personal Care BD টিমকে।",
  },
  {
    name: "মাহমুদুল করিম",
    location: "বোয়ালিয়া, রাজশাহী",
    rating: 5,
    date: "১ সপ্তাহ আগে",
    text: "কোয়ালিটি এক কথায় ১০ এ ১০। ধুয়ে আবার আগের মতো নতুনের মতো হয়ে যায়। সবাই নিঃসন্দেহে নিতে পারেন।",
  },
];

function CountdownTimer() {
  const [time, setTime] = useState({ h: 2, m: 47, s: 33 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => {
        let { h, m, s } = t;
        s--;
        if (s < 0) {
          s = 59;
          m--;
        }
        if (m < 0) {
          m = 59;
          h--;
        }
        if (h < 0) {
          h = 23;
          m = 59;
          s = 59;
        }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-2">
      {[
        { v: time.h, l: "ঘণ্টা" },
        { v: time.m, l: "মিনিট" },
        { v: time.s, l: "সেকেন্ড" },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="countdown-box">
            <div className="text-yellow-400 font-black text-lg leading-none">{pad(item.v)}</div>
            <div className="text-gray-400 text-[9px] mt-0.5">{item.l}</div>
          </div>
          {i < 2 && <span className="text-yellow-500 font-bold text-lg">:</span>}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [openQA, setOpenQA] = useState<number | null>(0); // First FAQ open by default
  const [lastOrder, setLastOrder] = useState<string | null>(null);

  // Auto slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDE_IMAGES.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  // Check for existing last order in localStorage & listen for new orders
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pc_last_order");
      if (stored) setLastOrder(stored);

      const handleOrderPlaced = (e: any) => {
        const orderId = e.detail?.orderId || localStorage.getItem("pc_last_order");
        if (orderId) setLastOrder(orderId);
      };

      window.addEventListener("orderPlaced", handleOrderPlaced);
      return () => window.removeEventListener("orderPlaced", handleOrderPlaced);
    }
  }, []);

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + SLIDE_IMAGES.length) % SLIDE_IMAGES.length);
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % SLIDE_IMAGES.length);
  };

  const toggleQA = (index: number) => {
    setOpenQA((prev) => (prev === index ? null : index));
  };

  return (
    <div className="min-h-screen bg-[#06060e] text-white selection:bg-yellow-500 selection:text-black">
      <Header onOrderClick={() => setModalOpen(true)} />

      {/* Welcome / First-Visit Offer Popup (Triggered based on isNew in localStorage) */}
      <OfferPopup onClaimOffer={() => setModalOpen(true)} />

      {/* =========================================================================
          1. HERO SECTION (With Unique Custom Generated Hero Image)
      ========================================================================= */}
      <section className="relative min-h-[92vh] flex items-center pt-24 sm:pt-28 pb-12 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-banner.jpg"
            alt="Personal Care BD Hero Banner"
            fill
            className="object-cover opacity-50"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06060e] via-[#06060e]/85 to-[#06060e]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06060e] via-transparent to-[#06060e]/40" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20">
          <div className="max-w-2xl space-y-5">
            {/* Recent Order Alert Banner (If order placed in localStorage) */}
            {lastOrder && (
              <div className="bg-gradient-to-r from-emerald-500/20 via-emerald-500/30 to-emerald-500/10 border-2 border-emerald-500/50 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl shadow-emerald-500/15 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-black flex items-center justify-center shrink-0 shadow-md">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">
                      আপনার সাম্প্রতিক অর্ডার সক্রিয় রয়েছে
                    </p>
                    <p className="text-sm font-black text-white">
                      অর্ডার নম্বর: <span className="font-mono text-yellow-400 text-base">{lastOrder}</span>
                    </p>
                  </div>
                </div>
                <Link
                  href={`/track?id=${lastOrder}`}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-md whitespace-nowrap"
                >
                  <Package size={14} /> অর্ডার ট্র্যাক করুন <ArrowRight size={13} />
                </Link>
              </div>
            )}

            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 bg-yellow-500/15 border border-yellow-500/30 rounded-full px-4 py-1.5 shadow-sm">
              <Award size={15} className="text-yellow-400" />
              <span className="text-yellow-400 text-xs font-bold tracking-wide">
                🔥 অরিজিনাল লাভ লক কনডম — “২৫,০০০+ “পুরুষের রাত বদলে গেছে…
              </span>
            </div>


            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
              আপনার রাতকে করুন{" "}
              <span className="text-gradient-gold">অবিস্মরণীয় ও দীর্ঘস্থায়ী</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-200 font-medium leading-relaxed">
              যাদের গোপনাঙ্গ ছোট ও চিকন। ইনস্ট্যান্ট মোটা ও লম্বা করতে চান, ভালো কার্যকরী তাৎক্ষণিক সমাধান। সময় বাড়বে ৪৮ মিনিট।
            </p>

            {/* Pricing & Guarantee Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-5 py-3">
                <span className="text-gray-400 text-xs block font-medium">বর্তমান অফার মূল্য:</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-yellow-400">৳৮৯৯</span>
                  <span className="text-sm text-gray-500 line-through">৳১,৮৫০</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    ৫০% ছাড়
                  </span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <span className="text-gray-400 text-xs block">অফার শেষ হতে বাকি:</span>
                <div className="mt-1">
                  <CountdownTimer />
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => setModalOpen(true)}
                className="btn-gold text-base sm:text-lg py-4 px-8 rounded-2xl shadow-xl shadow-yellow-500/20 font-black pulse-gold flex items-center justify-center gap-2 group"
              >
                <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                অর্ডার করতে চাই — ৳৮৯৯
                <Zap size={18} />
              </button>
            </div>

            {/* Quick Guarantees */}
            <div className="pt-3 flex flex-wrap gap-4 text-xs text-gray-300">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 size={15} /> সারাদেশে ফ্রি হোম ডেলিভারি
              </span>
              <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                <ShieldCheck size={15} /> একমাত্র আমরাই দেখার পরে পেমেন্ট করার নিশ্চয়তা দিচ্ছি
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Lock size={15} /> ১০০% গোপনীয় প্যাকেজিং
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. কেন নিবেন এই ম্যাজিক কনডম? (EXACT COMPETITOR BENEFIT SECTION)
      ========================================================================= */}
      <section id="why" className="py-16 sm:py-20 bg-gradient-to-b from-[#06060e] via-[#09091b] to-[#06060e] border-y border-yellow-500/15">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold mb-3">
              🔥 এই বছরের সেরা অফার
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
              কেন নিবেন এই <span className="text-gradient-gold">ম্যাজিক কনডম?</span>
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              ১০০% খাঁটি ও কার্যকর বৈশিষ্ট্যসমূহ এক নজরে দেখে নিন
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {WHY_POINTS.map((item, idx) => (
              <div
                key={idx}
                className="glass-card p-4 sm:p-5 border border-white/10 hover:border-yellow-500/40 rounded-2xl flex items-start gap-3.5 transition-all hover:bg-white/5 duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0 mt-0.5 border border-yellow-500/30 font-black text-sm">
                  ✔
                </div>
                <div>
                  <p className="text-sm sm:text-base text-gray-200 leading-relaxed font-medium">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-8">
            <button
              onClick={() => setModalOpen(true)}
              className="btn-gold py-3.5 px-8 rounded-xl text-sm sm:text-base font-black inline-flex items-center gap-2 shadow-lg shadow-yellow-500/20 pulse-gold"
            >
              <ShoppingBag size={18} /> অর্ডার করতে চাই (৳৮৯৯)
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. বাস্তবে দেখতে কেমন? এটা দেখুন। (COMPETITOR SLIDER SHOWCASE)
      ========================================================================= */}
      <section id="product" className="py-16 sm:py-24 bg-[#06060e]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold mb-3">
              <Sparkles size={14} /> লাইভ প্রোডাক্ট ভিউ
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
              বাস্তবে দেখতে কেমন? <span className="text-gradient-gold">এটা দেখুন।</span>
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              সরাসরি পণ্যটির প্রতিটি অ্যাঙ্গেল এবং ডাবল লক রিং সিস্টেম স্লাইড করে দেখুন
            </p>
          </div>

          {/* Interactive Slide Carousel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Main Slide Viewer */}
            <div className="lg:col-span-7">
              <div className="glass-card p-3 sm:p-5 border border-yellow-500/20 shadow-2xl relative group overflow-hidden">
                {/* Main Slide Display */}
                <div className="relative aspect-square sm:aspect-[4/3] w-full rounded-2xl overflow-hidden bg-black/60 border border-white/10">
                  <Image
                    src={SLIDE_IMAGES[activeSlide].src}
                    alt={SLIDE_IMAGES[activeSlide].title}
                    fill
                    className="object-contain transition-all duration-700 hover:scale-105"
                    priority
                  />

                  {/* Gradient Overlay for Title */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 sm:p-6 flex flex-col justify-end">
                    <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">
                      স্লাইড {activeSlide + 1} / {SLIDE_IMAGES.length}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                      {SLIDE_IMAGES[activeSlide].title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
                      {SLIDE_IMAGES[activeSlide].subtitle}
                    </p>
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={prevSlide}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-yellow-500 hover:text-black text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all shadow-lg active:scale-95"
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-yellow-500 hover:text-black text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all shadow-lg active:scale-95"
                    aria-label="Next Slide"
                  >
                    <ChevronRight size={22} />
                  </button>
                </div>

                {/* Thumbnails Row */}
                <div className="grid grid-cols-6 gap-2 sm:gap-3 mt-4">
                  {SLIDE_IMAGES.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        activeSlide === idx
                          ? "border-yellow-400 scale-105 shadow-md shadow-yellow-500/30"
                          : "border-white/10 opacity-60 hover:opacity-100 hover:border-white/30"
                      }`}
                    >
                      <Image src={img.src} alt={img.title} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Side Highlights */}
            <div className="lg:col-span-5 space-y-4">
              <div className="glass-card p-6 border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">ইনস্ট্যান্ট রেজাল্ট ও স্থায়িত্ব</h3>
                    <p className="text-xs text-gray-400">প্রথমবার ব্যবহারের পর থেকেই লক্ষণীয় পরিবর্তন</p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 text-xs sm:text-sm text-gray-300">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <Check className="text-emerald-400 shrink-0" size={16} />
                    <span><strong>পুরুত্ব:</strong> ৬ মিমি হাই ডেনসিটি মেডিকেল সিলিকন</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <Check className="text-emerald-400 shrink-0" size={16} />
                    <span><strong>ব্যবহার:</strong> ৭০০–৮০০ বার পর্যন্ত ধুয়ে রিইউজেবল</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <Check className="text-emerald-400 shrink-0" size={16} />
                    <span><strong>সময় বৃদ্ধি:</strong> মিলনের সময় ৩০–৪০ মিনিট বৃদ্ধি</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <Check className="text-emerald-400 shrink-0" size={16} />
                    <span><strong>সাইজ:</strong> ৩, ৪, ৫, ৬ ইঞ্চি সব সাইজে মানানসই</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={() => setModalOpen(true)}
                    className="btn-gold w-full py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                  >
                    <ShoppingBag size={17} /> অর্ডার কনফার্ম করুন (৳৮৯৯)
                  </button>
                  <p className="text-center text-[11px] text-gray-400 mt-2">
                    🔒 পণ্য দেখে পেমেন্ট • ১০০% তথ্য গোপনীয়
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. সাবধান!! নকল বের হইসে মার্কেটে 👇 (AUTHENTICITY GUARANTEE)
      ========================================================================= */}
      <section className="py-16 bg-gradient-to-b from-[#06060e] via-[#090918] to-[#06060e]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="glass-card p-6 sm:p-10 border-2 border-red-500/30 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-black animate-pulse">
                  <AlertTriangle size={15} /> সাবধান!! নকল বের হইসে মার্কেটে 👇
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  অরিজিনাল <span className="text-gradient-gold">Top Notch কোয়ালিটি</span> চেনার উপায়
                </h2>

                <div className="space-y-3 text-sm sm:text-base text-gray-200">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                    <span className="text-yellow-400 text-lg">👉</span>
                    <span><strong>Top Notch কোয়ালিটি পাবেন:</strong> উচ্চমানের সফট মেডিকেল-গ্রেড সিলিকন।</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                    <span className="text-yellow-400 text-lg">👉</span>
                    <span><strong>১ মাসের রিপ্লেসমেন্ট সুবিধা:</strong> এক মাসের আগে ছিঁড়ে গেলে ৫০% ডিসকাউন্টে নতুন পাবেন।</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                    <span className="text-yellow-400 text-lg">👉</span>
                    <span><strong>কথা কাজে মিল পাবেন:</strong> প্রোডাক্ট যেমন দেখিয়েছি ১০০% ঐরকমই পাবেন।</span>
                  </div>
                  <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3 text-yellow-300 font-semibold">
                    <span className="text-yellow-400 text-lg">👉</span>
                    <span>প্রোডাক্ট যেমন দেখিয়েছি ঐরকম ১০০% হওয়ার পরও যদি কোনো কারণে না নিতে চান, ডেলিভারি চার্জ দিয়ে রিটার্ন করে দিতে পারবেন।</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => setModalOpen(true)}
                    className="btn-gold py-3.5 px-7 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-yellow-500/20"
                  >
                    <ShoppingBag size={18} /> অর্ডার করতে চাই
                  </button>
                </div>
              </div>

              {/* Side slide image */}
              <div className="w-full md:w-80 shrink-0">
                <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-yellow-500/30 shadow-2xl bg-black">
                  <Image
                    src="/images/products/product-4.jpg"
                    alt="Original Top Notch Lock Ring"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                    <p className="text-xs text-yellow-400 font-bold text-center w-full">
                      🔒 অরিজিনাল ডাবল হোল লক সিস্টেম
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. জিজ্ঞাসা! (EXACT COMPETITOR Q&A / FAQ SECTION)
      ========================================================================= */}
      <section id="faq" className="py-16 sm:py-24 bg-[#080816] border-y border-white/5">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold mb-3">
              <HelpCircle size={15} /> সচরাচর জিজ্ঞাসিত প্রশ্ন ও উত্তর
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
              জিজ্ঞাসা! <span className="text-gradient-gold">(Q & A)</span>
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              আপনার মনের সকল সাধারণ প্রশ্নের সরাসরি উত্তর জেনে নিন
            </p>
          </div>

          {/* Accordion List */}
          <div className="space-y-4">
            {QA_ITEMS.map((item, idx) => {
              const isOpen = openQA === idx;
              return (
                <div
                  key={idx}
                  className={`glass-card border rounded-2xl transition-all overflow-hidden ${
                    isOpen ? "border-yellow-500/40 bg-white/5 shadow-lg shadow-yellow-500/10" : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <button
                    onClick={() => toggleQA(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-bold text-white text-base sm:text-lg">
                        {item.question}
                      </span>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isOpen ? "bg-yellow-500 text-black rotate-180" : "bg-white/10 text-gray-400"
                    }`}>
                      <ChevronDown size={18} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm sm:text-base text-gray-300 border-t border-white/5 leading-relaxed animate-fadeIn">
                      <p className="whitespace-pre-line">{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-center text-xs sm:text-sm text-yellow-300 font-semibold">
            বিদ্রঃ আপনার সকল তথ্য ও গোপনীয়তা ১০০% রক্ষা করা হয়।
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. কেনার আগে রিভিউ দেখে নিন (CUSTOMER REVIEWS)
      ========================================================================= */}
      <section id="reviews" className="py-16 sm:py-24 bg-[#06060e]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold mb-3">
              💬 কেনার আগে রিভিউ দেখে নিন
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
              গ্রাহকদের <span className="text-gradient-gold">বাস্তব অভিজ্ঞতা</span>
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              হাজারো সন্তুষ্ট গ্রাহকের ইতিবাচক রিভিউ ও রেটিংস
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {REVIEWS.map((rev, idx) => (
              <div
                key={idx}
                className="glass-card p-6 border border-white/10 rounded-2xl space-y-3 relative shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm sm:text-base">{rev.name}</h3>
                    <p className="text-xs text-gray-400">{rev.location} • {rev.date}</p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    {[...Array(rev.rating)].map((_, r) => (
                      <Star key={r} size={15} fill="#facc15" />
                    ))}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed italic">
                  "{rev.text}"
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold pt-1">
                  <CheckCircle2 size={13} /> ভেরিফাইড পারচেজার
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. অভিনন্দন! 🎉 অফার অ্যাক্টিভেশন ও ফাইনাল ব্যানার
      ========================================================================= */}
      <section className="py-16 bg-gradient-to-r from-yellow-500/10 via-yellow-500/20 to-yellow-500/10 border-t border-yellow-500/30">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500 text-black font-black text-xs uppercase tracking-wider shadow-lg animate-bounce">
            <Gift size={16} /> অভিনন্দন! 🎉 অফার এক্টিভেটেড
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white">
            আপনার জন্য <span className="text-gradient-gold">ফ্রি ডেলিভারি অফারটি</span> এক্টিভেট করা হয়েছে!
          </h2>

          <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto">
            বর্তমান স্পেশাল অফারে মাত্র ৳৮৯৯ টাকায় টপ নচ ম্যাজিক কনডম অর্ডার করুন। কোনো অগ্রিম টাকা দিতে হবে না, পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ করুন।
          </p>

          <div className="pt-2">
            <button
              onClick={() => setModalOpen(true)}
              className="btn-gold py-4 px-10 rounded-2xl text-base sm:text-lg font-black shadow-2xl shadow-yellow-500/40 pulse-gold inline-flex items-center gap-2"
            >
              <ShoppingBag size={20} /> অফারটি নিন — মাত্র ৳৮৯৯
            </button>
          </div>

          <div className="pt-4 text-xs text-gray-400">
            🔒 আপনার সকল তথ্য সম্পূর্ণ গোপন রাখা হবে। ইনশা-আল্লাহ
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FOOTER
      ========================================================================= */}
      <footer className="bg-[#030308] border-t border-white/10 py-10 text-center text-xs text-gray-500 space-y-4">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-black font-black text-xs">
              PC
            </div>
            <span className="font-bold text-white text-sm">Personal Care BD</span>
          </div>
          <p>© {new Date().getFullYear()} Personal Care BD. সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex gap-4 text-gray-400 text-xs">
            <a href="#product" className="hover:text-yellow-400">পণ্য</a>
            <a href="#why" className="hover:text-yellow-400">কেন নিবেন?</a>
            <a href="#faq" className="hover:text-yellow-400">জিজ্ঞাসা (FAQ)</a>
            <a
              href="https://wa.me/8801519601128?text=Hello%20Personal%20Care%20BD"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 text-emerald-500 font-semibold"
            >
              হেল্পলাইন (WhatsApp)
            </a>
          </div>
        </div>
      </footer>

      {/* Modals & Bars */}
      <OrderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <FloatingBuyBar onOrderClick={() => setModalOpen(true)} />
    </div>
  );
}
