"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Loader2,
  ShoppingBag,
  MapPin,
  User,
  FileText,
  PackageCheck,
  ClipboardPaste,
  Sparkles,
  DollarSign,
  Ruler,
} from "lucide-react";
import { useCreateManualOrderMutation, OrderData } from "@/lib/redux/api/orderApi";
import { useParseOrderTextMutation } from "@/lib/redux/api/aiApi";
import { toast } from "sonner";

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (order: OrderData) => void;
}

interface FormState {
  customerName: string;
  phoneNumber: string;
  address: string;
  productName: string;
  size: string;
  unitPrice: number;
  totalPrice: number;
  orderNotes: string;
}

const DEFAULT_FORM: FormState = {
  customerName: "",
  phoneNumber: "",
  address: "",
  productName: "Top Notch Magic Condom",
  size: "6.7 inch",
  unitPrice: 950,
  totalPrice: 950,
  orderNotes: "",
};

const normalizePhone = (value: string): string => {
  return value
    .replace(/[০-৯]/g, (d) => String(d.codePointAt(0)! - 0x09e6))
    .replace(/\s/g, "");
};

const normalizeBengaliDigits = (str: string): string =>
  str.replace(/[০-৯]/g, (d) => String(d.codePointAt(0)! - 0x09e6));

const localParseText = (text: string): Partial<FormState> => {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const result: Partial<FormState> = {};
  const noteLine = lines.find((l) => /^(note|নোট)\s*:/i.test(l));
  if (noteLine) result.orderNotes = noteLine.replace(/^(note|নোট)\s*:\s*/i, "").trim();
  const mainLines = lines.filter((l) => !/^(note|নোট)\s*:/i.test(l));
  if (mainLines[0]) result.customerName = mainLines[0];
  if (mainLines[1]) result.phoneNumber = normalizePhone(mainLines[1]);
  if (mainLines[2]) result.address = mainLines[2];
  if (mainLines[3]) {
    const normalized = normalizeBengaliDigits(mainLines[3]);
    const amount = parseFloat(normalized.replace(/[^\d.]/g, ""));
    if (!isNaN(amount) && amount > 0) { result.unitPrice = amount; result.totalPrice = amount; }
  }
  return result;
};

export default function ManualOrderModal({ isOpen, onClose, onSuccess }: ManualOrderModalProps) {
  const [formData, setFormData] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [quickText, setQuickText] = useState("");
  const [createManualOrder, { isLoading }] = useCreateManualOrderMutation();
  const [parseOrderText, { isLoading: isAiParsing }] = useParseOrderTextMutation();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) { setFormData(DEFAULT_FORM); setErrors({}); setQuickText(""); }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading && !isAiParsing) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, isAiParsing, onClose]);

  if (!isOpen) return null;

  const applyParsed = (parsed: Partial<FormState>) => {
    setFormData((prev) => ({ ...prev, ...parsed }));
    setErrors({});
  };

  const handleAiParse = async () => {
    if (!quickText.trim()) { toast.error("দয়া করে তথ্য লিখুন।"); return; }
    try {
      const res = await parseOrderText({ text: quickText }).unwrap();
      if (res.success && res.data) {
        const d = res.data;
        applyParsed({
          customerName: d.customerName || "",
          phoneNumber: d.phoneNumber || "",
          address: d.address || "",
          unitPrice: d.amount || DEFAULT_FORM.unitPrice,
          totalPrice: d.amount || DEFAULT_FORM.totalPrice,
          orderNotes: d.orderNotes || "",
        });
        toast.success("Gemini AI তথ্য parse করে ফর্মে পূরণ করেছে! ✨");
      } else {
        toast.error(res.message || "AI parse করতে পারেনি।");
      }
    } catch (err: any) {
      const parsed = localParseText(quickText);
      applyParsed(parsed);
      if (err?.data?.isConfigMissing) {
        toast.warning("Gemini API key নেই — লাইন-বাই-লাইন parse করা হয়েছে।");
      } else {
        toast.warning("AI সংযোগ ব্যর্থ — local parse করা হয়েছে।");
      }
    }
  };

  const handleLocalParse = () => {
    if (!quickText.trim()) { toast.error("দয়া করে তথ্য লিখুন।"); return; }
    applyParsed(localParseText(quickText));
    toast.success("তথ্য ফর্মে পূরণ করা হয়েছে!");
  };

  const handleFieldChange = (field: keyof FormState, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "unitPrice") updated.totalPrice = Number(value) || 0;
      return updated;
    });
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.customerName.trim()) newErrors.customerName = "গ্রাহকের নাম আবশ্যক।";
    const cleanPhone = normalizePhone(formData.phoneNumber);
    if (!cleanPhone) newErrors.phoneNumber = "মোবাইল নম্বর আবশ্যক।";
    else if (!/^(?:\+88)?01[3-9]\d{8}$/.test(cleanPhone)) newErrors.phoneNumber = "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।";
    if (!formData.address.trim()) newErrors.address = "সম্পূর্ণ ডেলিভারি ঠিকানা আবশ্যক।";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast.error("অনুগ্রহ করে সব তথ্য সঠিকভাবে পূরণ করুন।"); return; }
    try {
      const cleanPhone = normalizePhone(formData.phoneNumber);
      const res = await createManualOrder({
        customerName: formData.customerName.trim(),
        phoneNumber: cleanPhone,
        address: formData.address.trim(),
        productName: formData.productName.trim(),
        size: formData.size,
        quantity: 1,
        unitPrice: Number(formData.unitPrice),
        deliveryCharge: 0,
        totalPrice: Number(formData.totalPrice),
        paymentMethod: "Cash on Delivery",
        status: "Pending",
        orderNotes: formData.orderNotes.trim(),
      }).unwrap();
      toast.success(res.message || "ম্যানুয়াল অর্ডার সফলভাবে তৈরি হয়েছে!");
      if (onSuccess && res.order) onSuccess(res.order);
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "অর্ডার তৈরি করতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current && !isLoading && !isAiParsing) onClose(); }}
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
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">Manual Order</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ফোনে বা অন্যান্য মাধ্যমে আসা অর্ডার অ্যাডমিন প্যানেলে সরাসরি যুক্ত করুন</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isLoading || isAiParsing}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 transition-colors cursor-pointer disabled:opacity-50">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 py-4 space-y-4 text-xs sm:text-sm">
          {/* AI Quick-Fill */}
          <div className="bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/40 dark:to-blue-950/30 p-4 rounded-2xl border border-violet-200/80 dark:border-violet-800/50 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">
              <Sparkles size={14} />
              <span>AI দিয়ে দ্রুত তথ্য পূরণ</span>
              <span className="ml-auto text-[10px] normal-case font-normal bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-800">Gemini AI</span>
            </div>
            <p className="text-[11px] text-violet-700 dark:text-violet-400/80 leading-relaxed">
              যেকোনো ফরম্যাটে লিখুন — <strong>নাম, মোবাইল, ঠিকানা, টাকার পরিমাণ</strong>।
              নোট থাকলে: <code className="bg-violet-100 dark:bg-violet-900/40 px-1 rounded font-mono">Note: ...</code>
            </p>
            <textarea
              rows={5}
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              placeholder={"তানভীর হাসান\n01711223344\nবাড়ি ১২, রোড ৪, উত্তরা, ঢাকা\n950\nNote: সন্ধ্যায় ডেলিভারি দিন"}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800/60 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-violet-500 resize-none font-mono transition-colors"
            />
            <div className="flex gap-2">
              <button type="button" onClick={handleAiParse} disabled={isAiParsing || !quickText.trim()}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-violet-500/20">
                {isAiParsing ? (<><Loader2 size={14} className="animate-spin" />AI parse করছে...</>) : (<><Sparkles size={14} />Gemini AI দিয়ে Parse করুন</>)}
              </button>
              <button type="button" onClick={handleLocalParse} disabled={isAiParsing || !quickText.trim()}
                title="AI ছাড়া line-by-line parse করুন"
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 active:scale-95 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700">
                <ClipboardPaste size={13} />সাধারণ Parse
              </button>
            </div>
          </div>

          {/* Size & Price */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <Ruler size={14} /><span>সাইজ ও মূল্য</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">সাইজ</label>
                <input type="text" value={formData.size} onChange={(e) => handleFieldChange("size", e.target.value)}
                  placeholder="যেমন: 6.7 inch"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">মূল্য (৳)</label>
                <input type="number" min={0} value={formData.unitPrice} onChange={(e) => handleFieldChange("unitPrice", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 block font-medium">সর্বমোট (ডেলিভারি ফ্রি)</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">প্রদেয় মূল্য</span>
              </div>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400">৳{formData.totalPrice}</span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <User size={14} /><span>গ্রাহকের তথ্য</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">গ্রাহকের নাম <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.customerName} onChange={(e) => handleFieldChange("customerName", e.target.value)}
                  placeholder="যেমন: তানভীর হাসান"
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 transition-colors ${errors.customerName ? "border-red-500" : "border-slate-200 dark:border-slate-700"}`} />
                {errors.customerName && <p className="text-[10px] text-red-500 mt-1">{errors.customerName}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">মোবাইল নম্বর <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.phoneNumber} onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition-colors ${errors.phoneNumber ? "border-red-500" : "border-slate-200 dark:border-slate-700"}`} />
                {errors.phoneNumber && <p className="text-[10px] text-red-500 mt-1">{errors.phoneNumber}</p>}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <MapPin size={14} /><span>ডেলিভারি ঠিকানা</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">সম্পূর্ণ ঠিকানা <span className="text-red-500">*</span></label>
              <textarea rows={2} required value={formData.address} onChange={(e) => handleFieldChange("address", e.target.value)}
                placeholder="বাসা/হোল্ডিং নম্বর, রোড, এলাকা/গ্রাম..."
                className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 resize-none transition-colors ${errors.address ? "border-red-500" : "border-slate-200 dark:border-slate-700"}`} />
              {errors.address && <p className="text-[10px] text-red-500 mt-1">{errors.address}</p>}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <FileText size={14} /><span>অর্ডার নোট (ঐচ্ছিক)</span>
            </div>
            <textarea rows={2} value={formData.orderNotes} onChange={(e) => handleFieldChange("orderNotes", e.target.value)}
              placeholder="গ্রাহকের বিশেষ নির্দেশনা বা অভ্যন্তরীণ নোট..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 resize-none" />
            <p className="text-[10px] text-slate-400 dark:text-slate-500">নোট ফাঁকা থাকলে Steadfast-এ খালি নোটেই পাঠানো হবে।</p>
          </div>

          {/* Auto-set reminder */}
          <div className="px-3 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <DollarSign size={12} className="shrink-0 text-slate-400" />
            <span>স্বয়ংক্রিয়: ডেলিভারি চার্জ ৳০ | স্ট্যাটাস: Pending | পেমেন্ট: Cash on Delivery</span>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} disabled={isLoading || isAiParsing}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 font-bold transition-colors cursor-pointer disabled:opacity-50">
              বাতিল
            </button>
            <button type="submit" disabled={isLoading || isAiParsing}
              className="btn-gold text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer">
              {isLoading ? (<><Loader2 size={15} className="animate-spin" /><span>অর্ডার তৈরি হচ্ছে...</span></>) : (<><PackageCheck size={16} /><span>অর্ডার তৈরি করুন</span></>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}