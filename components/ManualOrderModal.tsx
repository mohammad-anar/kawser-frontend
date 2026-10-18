"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Minus,
  Loader2,
  ShoppingBag,
  MapPin,
  User,
  CreditCard,
  FileText,
  DollarSign,
  PackageCheck,
} from "lucide-react";
import { useCreateManualOrderMutation, OrderData } from "@/lib/redux/api/orderApi";
import { toast } from "sonner";

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (order: OrderData) => void;
}

interface FormState {
  customerName: string;
  phoneNumber: string;
  email: string;
  address: string;
  district: string;
  thana: string;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  deliveryCharge: number;
  totalPrice: number;
  paymentMethod: string;
  status: string;
  orderNotes: string;
}

const DEFAULT_FORM: FormState = {
  customerName: "",
  phoneNumber: "",
  email: "",
  address: "",
  district: "",
  thana: "",
  productName: "Top Notch Magic Condom",
  size: "6.7 inch",
  quantity: 1,
  unitPrice: 950,
  deliveryCharge: 0,
  totalPrice: 950,
  paymentMethod: "Cash on Delivery",
  status: "Pending",
  orderNotes: "",
};

// Convert Bengali / Devanagari numerals to ASCII digits
const normalizePhone = (value: string): string => {
  return value.replace(/[০-৯]/g, (d) => String(d.codePointAt(0)! - 0x09e6)).replace(/\s/g, "");
};

export default function ManualOrderModal({ isOpen, onClose, onSuccess }: ManualOrderModalProps) {
  const [formData, setFormData] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createManualOrder, { isLoading }] = useCreateManualOrderMutation();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(DEFAULT_FORM);
      setErrors({});
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleFieldChange = (field: keyof FormState, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto recalculate total price when qty, unitPrice, size or deliveryCharge changes
      if (field === "size") {
        if (String(value).includes("5.7") || String(value).includes("৫.৭")) {
          updated.unitPrice = 1199;
        } else if (String(value).includes("6.7") || String(value).includes("৬.৭")) {
          updated.unitPrice = 950;
        }
        updated.totalPrice = updated.unitPrice * updated.quantity + updated.deliveryCharge;
      } else if (field === "quantity" || field === "unitPrice" || field === "deliveryCharge") {
        const qty = field === "quantity" ? Number(value) || 1 : prev.quantity;
        const uPrice = field === "unitPrice" ? Number(value) || 0 : prev.unitPrice;
        const dCharge = field === "deliveryCharge" ? Number(value) || 0 : prev.deliveryCharge;
        updated.totalPrice = uPrice * qty + dCharge;
      }

      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleDeliveryPreset = (charge: number) => {
    setFormData((prev) => ({
      ...prev,
      deliveryCharge: charge,
      totalPrice: prev.unitPrice * prev.quantity + charge,
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "গ্রাহকের নাম আবশ্যক।";
    }

    const cleanPhone = normalizePhone(formData.phoneNumber);
    if (!cleanPhone) {
      newErrors.phoneNumber = "মোবাইল নম্বর আবশ্যক।";
    } else if (!/^(?:\+88)?01[3-9]\d{8}$/.test(cleanPhone)) {
      newErrors.phoneNumber = "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)।";
    }

    if (!formData.address.trim()) {
      newErrors.address = "সম্পূর্ণ ডেলিভারি ঠিকানা আবশ্যক।";
    }

    if (formData.quantity < 1) {
      newErrors.quantity = "পরিমাণ কমপক্ষে ১ হতে হবে।";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("অনুগ্রহ করে সব তথ্য সঠিকভাবে পূরণ করুন।");
      return;
    }

    try {
      const cleanPhone = normalizePhone(formData.phoneNumber);
      const res = await createManualOrder({
        customerName: formData.customerName.trim(),
        phoneNumber: cleanPhone,
        email: formData.email.trim(),
        address: formData.address.trim(),
        district: formData.district.trim(),
        thana: formData.thana.trim(),
        productName: formData.productName.trim(),
        size: formData.size,
        quantity: Number(formData.quantity),
        unitPrice: Number(formData.unitPrice),
        deliveryCharge: Number(formData.deliveryCharge),
        totalPrice: Number(formData.totalPrice),
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        orderNotes: formData.orderNotes.trim(),
      }).unwrap();

      toast.success(res.message || "ম্যানুয়াল অর্ডার সফলভাবে তৈরি হয়েছে!");
      if (onSuccess && res.order) {
        onSuccess(res.order);
      }
      onClose();
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "অর্ডার তৈরি করতে সমস্যা হয়েছে।";
      toast.error(errMsg);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current && !isLoading) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div className="bg-white dark:bg-[#0f172a] max-w-2xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-700/80 shadow-2xl relative rounded-3xl max-h-[92vh] flex flex-col animate-scaleIn my-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                নতুন ম্যানুয়াল অর্ডার তৈরি
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Manual Order
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ফোনে বা অন্যান্য মাধ্যমে আসা অর্ডার অ্যাডমিন প্যানেলে সরাসরি যুক্ত করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 transition-colors cursor-pointer disabled:opacity-50"
            title="বন্ধ করুন"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 py-4 space-y-4 text-xs sm:text-sm">
          {/* Section 1: Customer Information */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <User size={14} />
              <span>গ্রাহকের তথ্য</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  গ্রাহকের নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => handleFieldChange("customerName", e.target.value)}
                  placeholder="যেমন: তানভীর হাসান"
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 transition-colors ${
                    errors.customerName ? "border-red-500" : "border-slate-200 dark:border-slate-700"
                  }`}
                />
                {errors.customerName && (
                  <p className="text-[10px] text-red-500 mt-1">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  মোবাইল নম্বর <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition-colors ${
                      errors.phoneNumber ? "border-red-500" : "border-slate-200 dark:border-slate-700"
                    }`}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-[10px] text-red-500 mt-1">{errors.phoneNumber}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ইমেইল ঠিকানা (ঐচ্ছিক)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Address */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <MapPin size={14} />
              <span>ডেলিভারি ঠিকানা</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                সম্পূর্ণ ঠিকানা <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={formData.address}
                onChange={(e) => handleFieldChange("address", e.target.value)}
                placeholder="বাসা/হোল্ডিং নম্বর, রোড, এলাকা/গ্রাম..."
                className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 resize-none transition-colors ${
                  errors.address ? "border-red-500" : "border-slate-200 dark:border-slate-700"
                }`}
              />
              {errors.address && (
                <p className="text-[10px] text-red-500 mt-1">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  জেলা
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleFieldChange("district", e.target.value)}
                  placeholder="যেমন: ঢাকা, চট্টগ্রাম, রাজশাহী..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  থানা / উপজেলা
                </label>
                <input
                  type="text"
                  value={formData.thana}
                  onChange={(e) => handleFieldChange("thana", e.target.value)}
                  placeholder="যেমন: উত্তরা, মিরপুর, সদর..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Product, Size & Quantity */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <ShoppingBag size={14} />
              <span>পণ্য ও পরিমাণ</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                পণ্যের নাম
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => handleFieldChange("productName", e.target.value)}
                placeholder="পণ্যের বিবরণ..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  সাইজ / ভ্যারিয়েন্ট
                </label>
                <select
                  value={formData.size}
                  onChange={(e) => handleFieldChange("size", e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                >
                  <option value="6.7 inch">৬.৭ ইঞ্চি (6.7 inch) — ৳৯৫০</option>
                  <option value="5.7 inch">৫.৭ ইঞ্চি (5.7 inch) — ৳১,১৯৯</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  পরিমাণ (টি) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFieldChange("quantity", Math.max(1, formData.quantity - 1))}
                    className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.quantity}
                    onChange={(e) => handleFieldChange("quantity", parseInt(e.target.value) || 1)}
                    className="flex-1 text-center px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange("quantity", formData.quantity + 1)}
                    className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Pricing & Delivery Charge */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <DollarSign size={14} />
              <span>মূল্য ও বিলিং বিবরণী</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  প্রতি পিসের মূল্য (৳)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.unitPrice}
                  onChange={(e) => handleFieldChange("unitPrice", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    ডেলিভারি চার্জ (৳)
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleDeliveryPreset(0)}
                      className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        formData.deliveryCharge === 0
                          ? "bg-blue-600 text-white font-bold"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                      }`}
                    >
                      ফ্রি
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeliveryPreset(60)}
                      className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        formData.deliveryCharge === 60
                          ? "bg-blue-600 text-white font-bold"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                      }`}
                    >
                      ঢাকা (৬০৳)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeliveryPreset(120)}
                      className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        formData.deliveryCharge === 120
                          ? "bg-blue-600 text-white font-bold"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                      }`}
                    >
                      বাইরে (১২০৳)
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min={0}
                  value={formData.deliveryCharge}
                  onChange={(e) => handleFieldChange("deliveryCharge", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 block font-medium">
                  হিসাব: ৳{formData.unitPrice} × {formData.quantity} টি + ৳{formData.deliveryCharge} ডেলিভারি
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  সর্বমোট প্রদেয় মূল্য
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                  ৳{formData.totalPrice}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Status & Payment Method */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <CreditCard size={14} />
              <span>স্ট্যাটাস ও পেমেন্ট পদ্ধতি</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  অর্ডার স্ট্যাটাস
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleFieldChange("status", e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Pending">Pending (পেন্ডিং)</option>
                  <option value="Confirmed">Confirmed (কনফার্মড)</option>
                  <option value="Scheduled">Scheduled (শিডিউলড)</option>
                  <option value="Processing">Processing (প্রসেসিং)</option>
                  <option value="Hold">Hold (হোল্ড)</option>
                  <option value="Shipped">Shipped (শিপড)</option>
                  <option value="Delivered">Delivered (ডেলিভার্ড)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  পেমেন্ট মেথড
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => handleFieldChange("paymentMethod", e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Cash on Delivery">Cash on Delivery (ক্যাশ অন ডেলিভারি)</option>
                  <option value="bKash">bKash (বিকাশ)</option>
                  <option value="Nagad">Nagad (নগদ)</option>
                  <option value="Rocket">Rocket (রকেট)</option>
                  <option value="Bank Transfer">Bank Transfer (ব্যাংক ট্রান্সফার)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 6: Order Notes */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <FileText size={14} />
              <span>অর্ডার নোট / মন্তব্য (ঐচ্ছিক)</span>
            </div>
            <textarea
              rows={2}
              value={formData.orderNotes}
              onChange={(e) => handleFieldChange("orderNotes", e.target.value)}
              placeholder="গ্রাহক কোনো বিশেষ নির্দেশনা দিয়ে থাকলে বা অভ্যন্তরীণ নোট লিখুন..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>অর্ডার তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <PackageCheck size={16} />
                  <span>অর্ডার তৈরি করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
