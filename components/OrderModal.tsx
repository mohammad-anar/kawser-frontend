"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, Loader2, CheckCircle, AlertCircle, ShoppingBag } from "lucide-react";
import { useCreateOrderMutation, useRecordIncompleteOrderMutation } from "@/lib/redux/api/orderApi";
import { useAppSelector } from "@/lib/redux/hooks";
import { getDeviceId } from "@/lib/deviceId";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  customerName: string;
  phoneNumber: string;
  address: string;
  quantity: number;
}

interface FormErrors {
  customerName?: string;
  phoneNumber?: string;
  address?: string;
}

export default function OrderModal({ isOpen, onClose }: OrderModalProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();
  const [recordIncompleteOrder] = useRecordIncompleteOrderMutation();

  const [selectedVariant, setSelectedVariant] = useState<"6.9 inch" | "6.7 inch" | "5.7 inch">("6.9 inch");
  const [form, setForm] = useState<FormData>({
    customerName: "",
    phoneNumber: "",
    address: "",
    quantity: 1,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState<{ orderId: string; total: number } | null>(null);
  const [serverError, setServerError] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);
  const isSubmittedRef = useRef<boolean>(false);

  const unitPrice = selectedVariant === "5.7 inch" ? 1199 : 950;
  const total = unitPrice * form.quantity;

  // Pre-fill from logged-in user
  useEffect(() => {
    if (isOpen && user) {
      setForm((f) => ({
        ...f,
        customerName: user.name || f.customerName,
        phoneNumber: user.phone || f.phoneNumber,
      }));
    }
  }, [isOpen, user]);

  // Converts Bengali/Devanagari digits to ASCII digits
  const normalizeBanglaPhone = (value: string): string =>
    value.replace(/[০-৯]/g, (d) => String(d.codePointAt(0)! - 0x09e6));

  const sendIncompleteOrder = () => {
    if (isSubmittedRef.current || success) return;

    const trimmedName = form.customerName.trim();
    const cleanPhone = normalizeBanglaPhone(form.phoneNumber).replace(/\s/g, "");

    // Must have at least a name and a phone number (>= 10 digits)
    if (trimmedName.length > 0 && cleanPhone.length >= 10) {
      const deviceId = getDeviceId();
      recordIncompleteOrder({
        customerName: trimmedName,
        phoneNumber: cleanPhone,
        address: form.address.trim(),
        quantity: form.quantity,
        size: selectedVariant,
        unitPrice,
        totalPrice: total,
        productName: `Top Notch Magic Condom (${selectedVariant})`,
        deviceId,
      }).catch(() => {
        // Non-critical background call
      });
    }
  };

  // Browser exit / tab close handler
  useEffect(() => {
    if (!isOpen) {
      isSubmittedRef.current = false;
      return;
    }

    const handleBeforeUnload = () => {
      if (isSubmittedRef.current || success) return;
      const trimmedName = form.customerName.trim();
      const cleanPhone = normalizeBanglaPhone(form.phoneNumber).replace(/\s/g, "");
      if (trimmedName.length > 0 && cleanPhone.length >= 10) {
        const deviceId = getDeviceId();
        const payload = JSON.stringify({
          customerName: trimmedName,
          phoneNumber: cleanPhone,
          address: form.address.trim(),
          quantity: form.quantity,
          size: selectedVariant,
          unitPrice,
          totalPrice: total,
          productName: `Top Notch Magic Condom (${selectedVariant})`,
          deviceId,
        });
        const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/orders/incomplete`;
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon(url, blob);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
    };
  }, [isOpen, form, success, selectedVariant, total, unitPrice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name as keyof FormErrors]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.customerName.trim()) {
      newErrors.customerName = "আপনার নাম আবশ্যক।";
    }
    const normalizedPhone = normalizeBanglaPhone(form.phoneNumber).replace(/\s/g, "");
    if (!normalizedPhone) {
      newErrors.phoneNumber = "ফোন নম্বর আবশ্যক।";
    } else if (!/^(?:\+88)?01[3-9]\d{8}$/.test(normalizedPhone)) {
      newErrors.phoneNumber = "সঠিক ১১ ডিজিটের বাংলাদেশি নম্বর দিন (01XXXXXXXXX)।";
    }
    if (!form.address.trim()) {
      newErrors.address = "সম্পূর্ণ ডেলিভারি ঠিকানা আবশ্যক।";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setServerError("");
    try {
      isSubmittedRef.current = true;
      const deviceId = getDeviceId();
      const res = await createOrder({
        customerName: form.customerName,
        phoneNumber: normalizeBanglaPhone(form.phoneNumber).replace(/\s/g, ""),
        address: form.address,
        quantity: form.quantity,
        size: selectedVariant,
        unitPrice,
        userId: user?.id || undefined,
        productName: `Top Notch Magic Condom (${selectedVariant})`,
        deviceId,
      }).unwrap();

      // Save latest order ID to localStorage and trigger global notification
      if (typeof window !== "undefined" && res.orderId) {
        localStorage.setItem("cz_last_order", res.orderId);
        localStorage.setItem("pc_last_order", res.orderId);
        window.dispatchEvent(new CustomEvent("orderPlaced", { detail: { orderId: res.orderId } }));
      }

      // ===== Meta Pixel: Purchase Event =====
      if (typeof window !== "undefined" && typeof window.fbq === "function") {
        const rawTotal = res?.totalPrice;
        const orderTotal = typeof rawTotal === "number" ? rawTotal : Number(rawTotal);

        if (isNaN(orderTotal) || orderTotal <= 0) {
          console.warn("[Meta Pixel] Purchase event skipped: Missing or invalid res.totalPrice", rawTotal);
        } else {
          const orderId = res.orderId;
          const purchaseDedupeKey = orderId ? `fb_purchase_${orderId}` : null;
          let alreadyTracked = false;

          if (purchaseDedupeKey) {
            try {
              alreadyTracked = Boolean(sessionStorage.getItem(purchaseDedupeKey));
              if (!alreadyTracked) {
                sessionStorage.setItem(purchaseDedupeKey, "true");
              }
            } catch {
              // Ignore storage access errors in private/restricted browsing mode
            }
          }

          if (!alreadyTracked) {
            const dynamicProductName = res.productName || `Top Notch Magic Condom (${selectedVariant})`;
            const dynamicContentId =
              dynamicProductName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "") || "love-lock-magic-condom";

            window.fbq(
              "track",
              "Purchase",
              {
                value: orderTotal,
                currency: "BDT",
                content_name: dynamicProductName,
                content_ids: [dynamicContentId],
                content_type: "product",
                num_items: form.quantity,
              },
              orderId ? { eventID: orderId } : undefined
            );
          }
        }
      }
      // ===== End Meta Pixel =====

      setSuccess({ orderId: res.orderId, total: res.totalPrice });
    } catch (err: any) {
      isSubmittedRef.current = false;
      const message =
        err?.data?.message ||
        err?.message ||
        "অর্ডার দিতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।";
      setServerError(message);
    }
  };

  const handleClose = () => {
    if (isCreating) return;
    sendIncompleteOrder();
    setSuccess(null);
    setServerError("");
    setForm({
      customerName: user?.name || "",
      phoneNumber: user?.phone || "",
      address: "",
      quantity: 1,
    });
    setSelectedVariant("6.9 inch");
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
    >
      <div className="modal-content !p-0 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden">

        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-blue-600 dark:text-blue-400" size={22} />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">অর্ডার কনফার্ম করুন</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          /* Success Screen */
          <div className="overflow-y-auto p-5 sm:p-6 text-center space-y-4">
            <CheckCircle className="mx-auto text-emerald-500" size={64} />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">অর্ডার সফল হয়েছে! 🎉</h3>
            <p className="text-slate-600 dark:text-slate-300">আপনার অর্ডার আইডি:</p>
            <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl py-3 px-6">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{success.orderId}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              মোট পরিশোধ (ডেলিভারিতে): <span className="text-emerald-600 dark:text-emerald-400 font-bold">৳{success.total.toLocaleString()}</span>
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/60 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 text-left">
              <p>✅ শীঘ্রই আমাদের টিম আপনার সাথে যোগাযোগ করবে।</p>
              <p className="mt-1">🎁 ১০০ মিলি বোতল জেল সাথে ফ্রি পেয়ে যাবেন।</p>
              <p className="mt-1">📦 ঢাকায় ১ দিন, ঢাকার বাইরে ২-৩ দিন।</p>
              <p className="mt-1">🔒 ১০০% গোপনীয় প্যাকেজিংয়ে ডেলিভারি করা হবে।</p>
            </div>
            <button onClick={handleClose} className="btn-gold w-full mt-2 cursor-pointer py-3.5">
              ঠিক আছে
            </button>
          </div>
        ) : (
          /* Order Form */
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Scrollable Form Body */}
            <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1">
              {/* Free Offer Highlight Banner in Modal */}
              <div className="p-3 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/60 dark:to-blue-950/60 border-2 border-emerald-400/80 dark:border-emerald-600/80 rounded-2xl shadow-sm space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    🚚 সারাদেশে হোম ডেলিভারি:
                  </span>
                  <span className="bg-emerald-500 text-white font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-full shadow-sm animate-pulse tracking-wide">
                    সম্পূর্ণ ফ্রি
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-emerald-200/60 dark:border-emerald-800/60 pt-1.5">
                  <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    🎁 ১০০ মিলি লুব্রিকেন্ট জেল বোতল:
                  </span>
                  <span className="bg-emerald-500 text-white font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-full shadow-sm tracking-wide">
                    একদম ফ্রি
                  </span>
                </div>
              </div>

              {/* 2 Selectable Product Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>পণ্য ও সাইজ নির্বাচন করুন</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    কার্ডে চাপ দিয়ে সাইজ বাছাই করুন
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Card 1: 6.9 inch (950 BDT) - Shown First */}
                  <div
                    onClick={() => setSelectedVariant("6.9 inch")}
                    className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      selectedVariant === "6.9 inch" || selectedVariant === "6.7 inch"
                        ? "border-blue-600 dark:border-blue-500 bg-gradient-to-br from-blue-50/90 to-indigo-50/50 dark:from-blue-950/70 dark:to-indigo-950/40 shadow-md ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {(selectedVariant === "6.9 inch" || selectedVariant === "6.7 inch") && (
                      <span className="absolute -top-2 right-2 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                        ✓ সিলেক্টেড
                      </span>
                    )}
                    <div className="flex items-start gap-2.5">
                      <div className="w-13 h-13 rounded-xl overflow-hidden relative bg-slate-100 dark:bg-slate-800 border border-blue-200 dark:border-blue-700 shrink-0">
                        <Image
                          src="/images/products/IMG_7395.jpg"
                          alt="6.9 inch Magic Condom"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                          ৬.৯ ইঞ্চি (6.9 inch)
                        </p>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5 leading-tight">
                          ৪.৫ - ৬ ইঞ্চি লিঙ্গের জন্য ৬.৯ ইঞ্চি
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 line-through mr-1">৳১,৬০০</span>
                        <span className="text-base font-black text-blue-600 dark:text-blue-400">৳৯৫০</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        🎁 ১০০ml জেল ফ্রি
                      </span>
                    </div>
                  </div>

                  {/* Card 2: 5.7 inch (1199 BDT) */}
                  <div
                    onClick={() => setSelectedVariant("5.7 inch")}
                    className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      selectedVariant === "5.7 inch"
                        ? "border-blue-600 dark:border-blue-500 bg-gradient-to-br from-blue-50/90 to-indigo-50/50 dark:from-blue-950/70 dark:to-indigo-950/40 shadow-md ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {selectedVariant === "5.7 inch" && (
                      <span className="absolute -top-2 right-2 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                        ✓ সিলেক্টেড
                      </span>
                    )}
                    <div className="flex items-start gap-2.5">
                      <div className="w-13 h-13 rounded-xl overflow-hidden relative bg-slate-100 dark:bg-slate-800 border border-blue-200 dark:border-blue-700 shrink-0">
                        <Image
                          src="/images/products/IMG_7393.jpg"
                          alt="5.7 inch Magic Condom"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                          ৫.৭ ইঞ্চি (5.7 inch)
                        </p>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5 leading-tight">
                          ২.৫ ইঞ্চি থেকে ৪ ইঞ্চি লিঙ্গের জন্য ৫.৭ ইঞ্চি
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 line-through mr-1">৳১,৮০০</span>
                        <span className="text-base font-black text-blue-600 dark:text-blue-400">৳১,১৯৯</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        🎁 ১০০ml জেল ফ্রি
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Name */}
              <div>
                <label className="text-sm text-slate-700 dark:text-slate-300 mb-1.5 block font-medium">
                  আপনার নাম <span className="text-red-500">*</span>
                </label>
                <input
                  className={`form-input ${errors.customerName ? "error" : ""}`}
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  placeholder="আপনার সম্পূর্ণ নাম লিখুন"
                  autoComplete="name"
                />
                {errors.customerName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.customerName}</p>}
              </div>

              {/* 2. Phone */}
              <div>
                <label className="text-sm text-slate-700 dark:text-slate-300 mb-1.5 block font-medium">
                  মোবাইল নম্বর <span className="text-red-500">*</span>
                </label>
                <input
                  className={`form-input ${errors.phoneNumber ? "error" : ""}`}
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="01XXXXXXXXX"
                  type="tel"
                  autoComplete="tel"
                />
                {errors.phoneNumber && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phoneNumber}</p>}
              </div>

              {/* 3. Address */}
              <div>
                <label className="text-sm text-slate-700 dark:text-slate-300 mb-1.5 block font-medium">
                  সম্পূর্ণ ঠিকানা <span className="text-red-500">*</span>
                </label>
                <textarea
                  className={`form-input resize-none ${errors.address ? "error" : ""}`}
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="গ্রাম/মহল্লা, রোড নম্বর, থানা ও জেলা লিখুন"
                  rows={3}
                  autoComplete="street-address"
                />
                {errors.address && <p className="text-red-500 text-xs mt-1 font-medium">{errors.address}</p>}
              </div>

              {/* COD badge */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center flex-shrink-0 text-base">
                  💵
                </div>
                <div>
                  <p className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">ক্যাশ অন ডেলিভারি</p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">পণ্য হাতে পেয়ে টাকা দিন। ১০০% গোপনীয় প্যাকেজিং।</p>
                </div>
              </div>
            </div>

            {/* Fixed Sticky Bottom Action Bar with Order Now Button */}
            <div className="p-3.5 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] shrink-0 z-20 space-y-2">
              {serverError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-red-500 text-xs font-medium">{serverError}</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    মোট বিল: <span className="font-black text-blue-600 dark:text-blue-400 text-sm">৳{total.toLocaleString()}</span>
                    <span className="text-slate-400 ml-1">({selectedVariant === "5.7 inch" ? "৫.৭ ইঞ্চি" : "৬.৯ ইঞ্চি"})</span>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    🚚 ফ্রি ডেলিভারি + 🎁 জেল
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn-gold w-full py-3.5 text-base sm:text-lg font-black flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xl shadow-amber-500/25 active:scale-[0.99] transition-transform"
                >
                  {isCreating ? (
                    <><Loader2 size={18} className="animate-spin" /> অর্ডার পাঠানো হচ্ছে...</>
                  ) : (
                    <>এখনই অর্ডার কনফার্ম করুন — ৳{total.toLocaleString()}</>
                  )}
                </button>
              </div>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
