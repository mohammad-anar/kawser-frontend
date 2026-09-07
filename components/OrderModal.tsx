"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, MapPin, Loader2, CheckCircle, AlertCircle, ShoppingBag, Minus, Plus } from "lucide-react";
import { useCreateOrderMutation } from "@/lib/redux/api/orderApi";
import { useAppSelector } from "@/lib/redux/hooks";
import { toast } from "sonner";



interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  customerName: string;
  phoneNumber: string;
  email: string;
  address: string;
  district: string;
  size: string;
  quantity: number;
  orderNotes: string;
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
    email: "",
    address: "",
    district: "",
    size: "",
    quantity: 1,
    orderNotes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
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
        email: user.email || f.email,
      }));
    }
  }, [isOpen, user]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name as keyof FormErrors]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleQty = (delta: number) => {
    setForm((f) => ({ ...f, quantity: Math.max(1, Math.min(10, f.quantity + delta)) }));
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      toast.error("আপনার ব্রাউজার GPS সমর্থন করে না।");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setGpsCoords({ lat, lng });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=bn`
          );
          const data = await res.json();
          const addr = data.address || {};
          const parts = [
            addr.road || addr.pedestrian || "",
            addr.suburb || addr.neighbourhood || addr.village || "",
            addr.city || addr.town || addr.county || "",
            addr.state_district || "",
          ]
            .filter(Boolean)
            .join(", ");

          setForm((f) => ({
            ...f,
            address: parts || `লোকেশন: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            district: addr.state_district || addr.county || addr.city || "",
          }));
          if (errors.address) setErrors((er) => ({ ...er, address: undefined }));
          toast.success("জিপিএস লোকেশন সফলভাবে যোগ করা হয়েছে!");
        } catch {
          setForm((f) => ({
            ...f,
            address: f.address || `লোকেশন: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          }));
          toast.success("জিপিএস কোঅর্ডিনেট সেট হয়েছে!");
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        toast.error("লোকেশন অ্যাক্সেস করতে পারেনি। অনুগ্রহ করে ম্যানুয়ালি ঠিকানা দিন।");
        console.error(err);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };


  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.customerName.trim()) newErrors.customerName = "নাম আবশ্যক।";
    if (!form.phoneNumber.trim()) {
      newErrors.phoneNumber = "ফোন নম্বর আবশ্যক।";
    } else if (!/^(?:\+88)?01[3-9]\d{8}$/.test(form.phoneNumber.replace(/\s/g, ""))) {
      newErrors.phoneNumber = "সঠিক বাংলাদেশি নম্বর দিন (01XXXXXXXXX)।";
    }
    if (!form.address.trim()) newErrors.address = "ঠিকানা আবশ্যক।";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setServerError("");
    try {
      const res = await createOrder({
        ...form,
        gpsCoordinates: gpsCoords || undefined,
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
    setGpsCoords(null);
    setForm({
      customerName: user?.name || "",
      phoneNumber: user?.phone || "",
      email: user?.email || "",
      address: "",
      district: "",
      size: "",
      quantity: 1,
      orderNotes: "",
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
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
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
                <button type="button" onClick={() => handleQty(-1)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <Minus size={14} />
                </button>
                <span className="text-white font-bold w-5 text-center">{form.quantity}</span>
                <button type="button" onClick={() => handleQty(1)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </div>


            <div className="text-right text-sm">
              <span className="text-gray-400">মোট: </span>
              <span className="text-yellow-400 font-black text-lg">৳{total.toLocaleString()}</span>
              <span className="text-gray-500 text-xs ml-1">(ডেলিভারিতে পরিশোধ)</span>
            </div>

            {/* Name */}
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">
                আপনার নাম <span className="text-red-400">*</span>
              </label>
              <input
                className={`form-input ${errors.customerName ? "error" : ""}`}
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder="আপনার সম্পূর্ণ নাম"
              />
              {errors.customerName && <p className="text-red-400 text-xs mt-1">{errors.customerName}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">
                ফোন নম্বর <span className="text-red-400">*</span>
              </label>
              <input
                className={`form-input ${errors.phoneNumber ? "error" : ""}`}
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="01XXXXXXXXX"
                type="tel"
              />
              {errors.phoneNumber && <p className="text-red-400 text-xs mt-1">{errors.phoneNumber}</p>}
            </div>

            {/* Email (optional) */}
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">ইমেইল (ঐচ্ছিক)</label>
              <input
                className="form-input"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="আপনার ইমেইল"
                type="email"
              />
            </div>

            {/* Address */}
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">
                ডেলিভারি ঠিকানা <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <textarea
                  className={`form-input resize-none ${errors.address ? "error" : ""}`}
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="গ্রাম/মহল্লা, উপজেলা, জেলা সহ পূর্ণ ঠিকানা লিখুন"
                  rows={3}
                />
              </div>
              {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
              <button
                type="button"
                onClick={handleGPS}
                disabled={gpsLoading}
                className="mt-2 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 px-3 py-2 rounded-lg w-full justify-center"
              >
                {gpsLoading ? (
                  <><Loader2 size={14} className="animate-spin" /> লোকেশন খুঁজছে...</>
                ) : (
                  <><MapPin size={14} /> আমার বর্তমান লোকেশন ব্যবহার করুন</>
                )}
              </button>
              {gpsCoords && (
                <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                  <CheckCircle size={12} /> GPS লোকেশন সেট হয়েছে
                </p>
              )}
            </div>

            {/* Size selector */}
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">সাইজ (ইঞ্চি)</label>
              <select
                className="form-input !text-black !bg-white cursor-pointer font-medium"
                name="size"
                value={form.size}
                onChange={handleChange}
              >
                <option value="" className="text-black bg-white">সাইজ বেছে নিন</option>
                <option value="3" className="text-black bg-white">৩ ইঞ্চি</option>
                <option value="4" className="text-black bg-white">৪ ইঞ্চি</option>
                <option value="5" className="text-black bg-white">৫ ইঞ্চি</option>
                <option value="6" className="text-black bg-white">৬ ইঞ্চি</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">অতিরিক্ত নোট (ঐচ্ছিক)</label>
              <input
                className="form-input"
                name="orderNotes"
                value={form.orderNotes}
                onChange={handleChange}
                placeholder="কোনো বিশেষ নির্দেশনা থাকলে লিখুন"
              />
            </div>

            {/* COD badge */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                💵
              </div>
              <div>
                <p className="text-green-400 font-semibold text-sm">ক্যাশ অন ডেলিভারি</p>
                <p className="text-gray-400 text-xs">পণ্য হাতে পেয়ে টাকা দিন। 🔒 তথ্য গোপন।</p>
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
              className="btn-gold w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
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
