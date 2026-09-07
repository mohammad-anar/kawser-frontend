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
    <div className="min-h-screen bg-[#06060c] text-white flex flex-col">
      <Header onOrderClick={() => setIsOrderModalOpen(true)} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 pt-28 pb-20">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold mb-3">
            <Package size={14} /> অর্ডার ট্র্যাকিং সিস্টেম
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            আপনার অর্ডারের <span className="text-gradient-gold">বর্তমান অবস্থা</span> জানুন
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            অর্ডারের সময় প্রাপ্ত অর্ডার আইডি (যেমন: PC-1234) অথবা মোবাইল নম্বর প্রবেশ করান।
          </p>
        </div>

        {/* Search Input Card */}
        <div className="glass-card p-4 sm:p-6 mb-8 border border-white/10 shadow-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="অর্ডার আইডি (যেমন: PC-1234) বা মোবাইল নম্বর..."
                className="w-full !pl-11 pr-4 py-3.5 bg-black/50 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold px-7 py-3.5 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-yellow-500/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 whitespace-nowrap"
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
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Order Details & Timeline */}
        {order && (
          <div className="space-y-6">
            {/* Status Alert if Cancelled */}
            {order.status === "Cancelled" && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-400">
                <XCircle size={24} className="shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-base text-red-300">অর্ডারটি বাতিল করা হয়েছে</h3>
                  <p className="text-sm text-red-400/90 mt-1">
                    যেকোনো তথ্যের জন্য আমাদের কাস্টমার সার্ভিসে যোগাযোগ করুন।
                  </p>
                </div>
              </div>
            )}

            {/* Tracking Steps Bar */}
            {order.status !== "Cancelled" && (
              <div className="glass-card p-6 sm:p-8 border border-white/10 shadow-2xl">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
                  <span>ডেলিভারি ট্র্যাকিং অগ্রগতি</span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    {order.status.toUpperCase()}
                  </span>
                </h2>

                <div className="relative">
                  {/* Timeline connecting line */}
                  <div className="hidden sm:block absolute left-[30px] right-[30px] top-[24px] h-[3px] bg-white/10 -z-0">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
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
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                              state === "completed"
                                ? "bg-gradient-to-br from-yellow-500 to-yellow-600 text-black shadow-yellow-500/30 scale-105"
                                : state === "current"
                                ? "bg-yellow-400 text-black shadow-yellow-400/50 ring-4 ring-yellow-400/20 animate-pulse scale-110"
                                : "bg-white/5 border border-white/10 text-gray-500"
                            }`}
                          >
                            <Icon size={22} />
                          </div>
                          <div className="flex-1 sm:flex-initial">
                            <p
                              className={`text-sm font-bold ${
                                state === "completed" || state === "current"
                                  ? "text-yellow-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {step.label}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 leading-snug">{step.desc}</p>
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
              <div className="glass-card p-6 border border-white/10">
                <h3 className="text-base font-bold text-white border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
                  <Package size={18} className="text-yellow-400" /> অর্ডার বিবরণ
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">অর্ডার আইডি:</span>
                    <span className="font-mono font-bold text-yellow-400">{order.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">অর্ডারের তারিখ:</span>
                    <span className="text-gray-200">
                      {new Date(order.createdAt).toLocaleString("bn-BD", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">পণ্য:</span>
                    <span className="text-gray-200 font-semibold">
                      {order.productName || "টপ নচ ম্যাজিক কনডম"} (x{order.quantity})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">পেমেন্ট মেথড:</span>
                    <span className="text-yellow-400 font-semibold bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20 text-xs">
                      ক্যাশ অন ডেলিভারি (COD)
                    </span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between text-base">
                    <span className="font-bold text-white">সর্বমোট মূল্য:</span>
                    <span className="font-black text-yellow-400 text-lg">৳{order.totalPrice}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Info Card */}
              <div className="glass-card p-6 border border-white/10">
                <h3 className="text-base font-bold text-white border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-yellow-400" /> ডেলিভারি তথ্য
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-400 block text-xs">গ্রাহকের নাম:</span>
                    <span className="text-white font-semibold text-base">{order.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">মোবাইল নম্বর:</span>
                    <span className="text-gray-200 font-mono">{order.phoneNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">ঠিকানা:</span>
                    <span className="text-gray-200">{order.address}</span>
                  </div>
                  {order.gpsCoordinates && order.gpsCoordinates.lat && (
                    <div className="pt-2">
                      <a
                        href={`https://www.google.com/maps?q=${order.gpsCoordinates.lat},${order.gpsCoordinates.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 hover:underline"
                      >
                        <MapPin size={14} /> গুগল ম্যাপে জিপিএস অবস্থান দেখুন <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Need Help Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">অর্ডার নিয়ে কোনো সমস্যা বা প্রশ্ন আছে?</h4>
                  <p className="text-xs text-gray-400">আমাদের কাস্টমার কেয়ারে হোয়াটসঅ্যাপে মেসেজ দিন</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href="https://wa.me/8801519601128?text=Hello%20Personal%20Care%20BD%2C%20I%20have%20a%20query%20about%20my%20order"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Phone size={14} /> WhatsApp চ্যাট
                </a>
                <Link
                  href="/"
                  className="px-4 py-2 bg-white/10 text-white font-semibold rounded-xl text-xs hover:bg-white/15 transition-colors"
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
        <div className="min-h-screen bg-[#06060c] flex items-center justify-center text-yellow-400 font-bold">
          লোড হচ্ছে...
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
