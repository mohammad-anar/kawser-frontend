"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import OrderModal from "@/components/OrderModal";
import { useLazyTrackOrderQuery, OrderData } from "@/lib/redux/api/orderApi";
import {
  Search,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  MapPin,
  Phone,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  Calendar,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

const STATUS_STEPS = [
  { key: "Pending", label: "অর্ডার গ্রহণ", desc: "আপনার অর্ডারটি সফলভাবে জমা হয়েছে", icon: Clock },
  { key: "Confirmed", label: "কনফার্মড", desc: "অর্ডার যাচাই ও নিশ্চিত করা হয়েছে", icon: ShieldCheck },
  { key: "Processing", label: "প্রক্রিয়াধীন", desc: "প্যাকেজিং সম্পন্ন করা হচ্ছে", icon: Package },
  { key: "Shipped", label: "কুরিয়ারে পাঠানো", desc: "ডেলিভারি ম্যানের কাছে হস্তান্তর করা হয়েছে", icon: Truck },
  { key: "Delivered", label: "ডেলিভার্ড", desc: "পণ্য সফলভাবে পৌঁছে দেওয়া হয়েছে", icon: CheckCircle2 },
];

function TrackContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";
  const [searchQuery, setSearchQuery] = useState(initialId);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const [triggerTrack, { isLoading }] = useLazyTrackOrderQuery();

  const handleSearch = async (queryToUse?: string) => {
    const q = (queryToUse || searchQuery).trim();
    if (!q) {
      setErrorMessage("দয়া করে অর্ডার আইডি বা ফোন নম্বর লিখুন।");
      return;
    }

    setErrorMessage("");
    setOrder(null);

    const isPhone = /^[0-9+ ]+$/.test(q);
    const params = isPhone ? { phone: q } : { orderId: q };

    try {
      const res = await triggerTrack(params).unwrap();
      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        setErrorMessage("কোনো অর্ডার পাওয়া যায়নি।");
      }
    } catch (err: any) {
      setErrorMessage(
        err?.data?.message ||
        "কোনো অর্ডার পাওয়া যায়নি। দয়া করে সঠিক অর্ডার আইডি বা ফোন নম্বর লিখুন।"
      );
    }
  };

  useEffect(() => {
    if (initialId) {
      handleSearch(initialId);
    }
  }, [initialId]);

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const orderHierarchy = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];
    if (currentStatus === "Cancelled") return "cancelled";
    const currentIndex = orderHierarchy.indexOf(currentStatus);
    const stepIndex = orderHierarchy.indexOf(stepKey);
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080817] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Header onOrderClick={() => setIsOrderModalOpen(true)} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 pt-28 pb-20">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold mb-3 shadow-sm">
            <Package size={14} /> অর্ডার ট্র্যাকিং সিস্টেম
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
            আপনার অর্ডারের <span className="text-gradient-blue">বর্তমান অবস্থা</span> জানুন
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-2 max-w-xl mx-auto font-medium">
            অর্ডারের সময় প্রাপ্ত অর্ডার আইডি (যেমন: PC-1234) অথবা আপনার ১১ ডিজিটের মোবাইল নম্বর লিখুন।
          </p>
        </div>

        {/* Search Input Card */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 mb-8 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl shadow-blue-500/5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="অর্ডার আইডি (যেমন: PC-1234) বা মোবাইল নম্বর..."
                className="w-full !pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-sm font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black px-7 py-3.5 rounded-2xl text-sm transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} /> ট্র্যাক হচ্ছে...
                </>
              ) : (
                <>
                  <Search size={16} /> ট্র্যাক করুন
                </>
              )}
            </button>
          </form>

          {errorMessage && (
            <div className="mt-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-medium animate-fadeIn">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Order Details & Timeline */}
        {order && (
          <div className="space-y-6 animate-fadeIn">
            {/* Status Alert if Cancelled */}
            {order.status === "Cancelled" && (
              <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400">
                <XCircle size={24} className="shrink-0 mt-0.5 text-red-500" />
                <div>
                  <h3 className="font-bold text-base text-red-700 dark:text-red-300">অর্ডারটি বাতিল করা হয়েছে</h3>
                  <p className="text-sm text-red-600 dark:text-red-400/90 mt-1 font-medium">
                    যেকোনো তথ্যের জন্য আমাদের কাস্টমার সার্ভিসে যোগাযোগ করুন।
                  </p>
                </div>
              </div>
            )}

            {/* Tracking Steps Bar */}
            {order.status !== "Cancelled" && (
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl shadow-blue-500/5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center justify-between">
                  <span>ডেলিভারি ট্র্যাকিং অগ্রগতি</span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {order.status.toUpperCase()}
                  </span>
                </h2>

                <div className="relative">
                  {/* Timeline connecting line */}
                  <div className="hidden sm:block absolute left-[30px] right-[30px] top-[24px] h-[3px] bg-slate-200 dark:bg-slate-800 -z-0">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
                      style={{
                        width:
                          order.status === "Pending"
                            ? "10%"
                            : order.status === "Confirmed"
                              ? "35%"
                              : order.status === "Processing"
                                ? "60%"
                                : order.status === "Shipped"
                                  ? "85%"
                                  : "100%",
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-2">
                    {STATUS_STEPS.map((step) => {
                      const state = getStepStatus(step.key, order.status);
                      const Icon = step.icon;

                      return (
                        <div
                          key={step.key}
                          className="flex sm:flex-col items-center gap-4 sm:gap-2 text-left sm:text-center relative z-10"
                        >
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md ${
                              state === "completed"
                                ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-500/30 scale-105"
                                : state === "current"
                                  ? "bg-blue-600 text-white shadow-blue-600/40 ring-4 ring-blue-500/20 animate-pulse scale-110"
                                  : "bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-400"
                            }`}
                          >
                            <Icon size={22} />
                          </div>
                          <div className="flex-1 sm:flex-initial">
                            <p
                              className={`text-sm font-bold ${
                                state === "completed" || state === "current"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-slate-400 dark:text-slate-500"
                              }`}
                            >
                              {step.label}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug font-medium">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Order Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Info Card */}
              <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                  <Package size={18} className="text-blue-600 dark:text-blue-400" /> অর্ডার বিবরণ
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">অর্ডার আইডি:</span>
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-base">{order.orderId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">অর্ডারের তারিখ:</span>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">
                      {new Date(order.createdAt).toLocaleString("bn-BD", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">পণ্য:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">
                      {order.productName || "টপ নচ ম্যাজিক কনডম"} (x{order.quantity})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">পেমেন্ট মেথড:</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/80 text-xs">
                      ক্যাশ অন ডেলিভারি (COD)
                    </span>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">সর্বমোট মূল্য:</span>
                    <span className="font-black text-blue-600 dark:text-blue-400 text-xl">৳{order.totalPrice}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Info Card */}
              <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-blue-600 dark:text-blue-400" /> ডেলিভারি তথ্য
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">গ্রাহকের নাম:</span>
                    <span className="text-slate-900 dark:text-white font-bold text-base">{order.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">মোবাইল নম্বর:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono font-semibold">{order.phoneNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">ঠিকানা:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{order.address}</span>
                  </div>
                  {order.gpsCoordinates && order.gpsCoordinates.lat && (
                    <div className="pt-2">
                      <a
                        href={`https://www.google.com/maps?q=${order.gpsCoordinates.lat},${order.gpsCoordinates.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                      >
                        <MapPin size={14} /> গুগল ম্যাপে জিপিএস অবস্থান দেখুন <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Need Help Box */}
            <div className="p-5 rounded-3xl bg-blue-50/70 dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">অর্ডার নিয়ে কোনো সমস্যা বা প্রশ্ন আছে?</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">আমাদের কাস্টমার কেয়ারে হোয়াটসঅ্যাপে মেসেজ দিন</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <a
                  href="https://wa.me/8801932787942?text=Hello%20Selfcare%20Solution%2C%20I%20have%20a%20query%20about%20my%20order"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Phone size={14} /> WhatsApp চ্যাট
                </a>
                <Link
                  href="/"
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-bold rounded-xl text-xs transition-colors text-center"
                >
                  হোম পেজে ফিরুন
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <OrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} />
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-[#080817] flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
          লোড হচ্ছে...
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
