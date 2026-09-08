"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, Loader2, CheckCircle, AlertCircle, ShoppingBag, Minus, Plus } from "lucide-react";
import { useCreateOrderMutation } from "@/lib/redux/api/orderApi";
import { useAppSelector } from "@/lib/redux/hooks";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name as keyof FormErrors]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleQty = (delta: number) => {
    setForm((f) => ({ ...f, quantity: Math.max(1, Math.min(10, f.quantity + delta)) }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.customerName.trim()) {
      newErrors.customerName = "আপনার নাম আবশ্যক।";
    }
    if (!form.phoneNumber.trim()) {
      newErrors.phoneNumber = "ফোন নম্বর আবশ্যক।";
    } else if (!/^(?:\+88)?01[3-9]\d{8}$/.test(form.phoneNumber.replace(/\s/g, ""))) {
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
      const res = await createOrder({
        customerName: form.customerName,
        phoneNumber: form.phoneNumber,
        address: form.address,
        quantity: form.quantity,
        userId: user?.id || undefined,
      }).unwrap();

      // Save latest order ID to localStorage and trigger global notification
      if (typeof window !== "undefined" && res.orderId) {
        localStorage.setItem("pc_last_order", res.orderId);
        window.dispatchEvent(new CustomEvent("orderPlaced", { detail: { orderId: res.orderId } }));
      }

      setSuccess({ orderId: res.orderId, total: res.totalPrice });
    } catch (err: any) {
      const message =
        err?.data?.message ||
        err?.message ||
        "অর্ডার দিতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।";
      setServerError(message);
    }
  };

  const handleClose = () => {
    if (isCreating) return;
    setSuccess(null);
    setServerError("");
    setForm({
      customerName: user?.name || "",
      phoneNumber: user?.phone || "",
      address: "",
      quantity: 1,
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const total = 899 * form.quantity;

  return (
    <div className="modal-overlay" ref={overlayRef}>
      <div className="modal-content">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-yellow-400" size={22} />
            <h2 className="text-lg font-bold text-white">অর্ডার করুন</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            aria-label="বন্ধ করুন"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          /* Success Screen */
          <div className="text-center py-6 space-y-4">
            <CheckCircle className="mx-auto text-green-400" size={64} />
            <h3 className="text-xl font-bold text-white">অর্ডার সফল হয়েছে! 🎉</h3>
            <p className="text-gray-300">আপনার অর্ডার আইডি:</p>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl py-3 px-6">
              <span className="text-2xl font-black text-yellow-400">{success.orderId}</span>
            </div>
            <p className="text-gray-300 text-sm">
              মোট পরিশোধ (ডেলিভারিতে): <span className="text-green-400 font-bold">৳{success.total.toLocaleString()}</span>
            </p>
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 text-sm text-gray-300">
              <p>✅ শীঘ্রই আমাদের টিম আপনার সাথে যোগাযোগ করবে।</p>
              <p className="mt-1">📦 ঢাকায় ১ দিন, ঢাকার বাইরে ২-৩ দিন।</p>
              <p className="mt-1">🔒 তথ্য সম্পূর্ণ গোপন রাখা হবে।</p>
            </div>
            <button onClick={handleClose} className="btn-gold w-full mt-2">
              ঠিক আছে
            </button>
          </div>
        ) : (
          /* Order Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product summary */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden relative bg-black/40 border border-yellow-500/20 shrink-0">
                  <Image
                    src="/images/products/product-main.jpg"
                    alt="Top Notch Magic Condom"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Top Notch Magic Condom</p>
                  <p className="text-yellow-400 text-xs mt-0.5">রিইউজেবল TPE সিলিকন • ফ্রি ডেলিভারি</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleQty(-1)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="কমান"
                >
                  <Minus size={14} />
                </button>
                <span className="text-white font-bold w-5 text-center">{form.quantity}</span>
                <button
                  type="button"
                  onClick={() => handleQty(1)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="বাড়ান"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="text-right text-sm">
              <span className="text-gray-400">মোট: </span>
              <span className="text-yellow-400 font-black text-lg">৳{total.toLocaleString()}</span>
              <span className="text-gray-500 text-xs ml-1">(ডেলিভারিতে পরিশোধ)</span>
            </div>

            {/* 1. Name */}
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block font-medium">
                আপনার নাম <span className="text-red-400">*</span>
              </label>
              <input
                className={`form-input ${errors.customerName ? "error" : ""}`}
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder="আপনার সম্পূর্ণ নাম লিখুন"
                autoComplete="name"
              />
              {errors.customerName && <p className="text-red-400 text-xs mt-1">{errors.customerName}</p>}
            </div>

            {/* 2. Phone */}
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block font-medium">
                মোবাইল নম্বর <span className="text-red-400">*</span>
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
              {errors.phoneNumber && <p className="text-red-400 text-xs mt-1">{errors.phoneNumber}</p>}
            </div>

            {/* 3. Address */}
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block font-medium">
                সম্পূর্ণ ঠিকানা <span className="text-red-400">*</span>
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
              {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
            </div>

            {/* COD badge */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 text-base">
                💵
              </div>
              <div>
                <p className="text-green-400 font-semibold text-sm">ক্যাশ অন ডেলিভারি</p>
                <p className="text-gray-400 text-xs">পণ্য হাতে পেয়ে টাকা দিন। ১০০% গোপনীয় প্যাকেজিং।</p>
              </div>
            </div>

            {serverError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isCreating}
              className="btn-gold w-full flex items-center justify-center gap-2 py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isCreating ? (
                <><Loader2 size={18} className="animate-spin" /> অর্ডার পাঠানো হচ্ছে...</>
              ) : (
                <>অর্ডার কনফার্ম করুন — ৳{total.toLocaleString()}</>
              )}
            </button>

          </form>
        )}
      </div>
    </div>
  );
}
