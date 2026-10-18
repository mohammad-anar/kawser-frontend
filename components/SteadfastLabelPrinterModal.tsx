"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Printer,
  Trash2,
  CheckSquare,
  Square,
  Plus,
  RefreshCw,
  Copy,
  Tag,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sliders,
  Sparkles,
  AlignRight,
  AlignCenter,
  Maximize2,
  Check,
  RotateCw,
  ArrowDownUp,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export interface SteadfastLabelItem {
  id: string; // unique ID
  consignmentId: string | number;
  shopId?: string; // default "2410661"
  orderId?: string;
  customerName?: string;
  phoneNumber?: string;
  address?: string;
  createdAt: string;
  printed?: boolean;
}

interface SteadfastLabelPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  incomingLabels?: SteadfastLabelItem[];
  onLabelsProcessed?: () => void;
}

const STORAGE_KEY = "steadfast_print_labels_queue";
const DEFAULT_SHOP_ID = "2410661";

export default function SteadfastLabelPrinterModal({
  isOpen,
  onClose,
  incomingLabels = [],
  onLabelsProcessed,
}: SteadfastLabelPrinterModalProps) {
  const [labels, setLabels] = useState<SteadfastLabelItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shopId, setShopId] = useState<string>(DEFAULT_SHOP_ID);
  const [manualCid, setManualCid] = useState<string>("");

  // Text layout orientation on 50mm * 75mm paper:
  // "rotated90": text along 75mm length (matches user's photo 1 - big & clear)
  // "straight": text across 50mm width (matches user's photo 2)
  const [textOrientation, setTextOrientation] = useState<"rotated90" | "straight">("rotated90");

  // Label Feed Length (height in feed direction)
  // Standard is 75mm. Some mini printers need 76mm or 77mm to cleanly feed past the tear bar.
  const [feedHeightMm, setFeedHeightMm] = useState<number>(75);

  // Position alignment
  const [alignmentMode, setAlignmentMode] = useState<"center" | "right_offset">("center");

  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Load labels from localStorage and merge any incoming labels
  useEffect(() => {
    if (!isOpen) return;

    let savedList: SteadfastLabelItem[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) savedList = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to load steadfast label queue from localStorage:", e);
    }

    if (incomingLabels && incomingLabels.length > 0) {
      const existingCids = new Set(savedList.map((l) => String(l.consignmentId)));
      const newItems: SteadfastLabelItem[] = [];

      incomingLabels.forEach((item) => {
        const cidStr = String(item.consignmentId);
        if (!existingCids.has(cidStr)) {
          existingCids.add(cidStr);
          newItems.push({
            ...item,
            id: item.id || `lbl_${Date.now()}_${cidStr}`,
            shopId: item.shopId || DEFAULT_SHOP_ID,
            createdAt: item.createdAt || new Date().toISOString(),
            printed: false,
          });
        }
      });

      if (newItems.length > 0) {
        const merged = [...newItems, ...savedList];
        setLabels(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        // Auto-select newly added items
        setSelectedIds(merged.map((l) => l.id));
        return;
      }
    }

    setLabels(savedList);
    // By default select all if none selected
    setSelectedIds(savedList.map((l) => l.id));
  }, [isOpen, incomingLabels]);

  // Sync back to localStorage
  const persistLabels = (updated: SteadfastLabelItem[]) => {
    setLabels(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save steadfast label queue to localStorage:", e);
    }
  };

  // Toggle select single
  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all
  const handleToggleSelectAll = () => {
    if (selectedIds.length === labels.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(labels.map((l) => l.id));
    }
  };

  // Add ad-hoc / manual consignment
  const handleAddManualCid = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCid.trim().replace(/^#/, "");
    if (!clean) {
      toast.error("অনুগ্রহ করে কনসাইনমেন্ট নম্বর দিন");
      return;
    }

    const newItem: SteadfastLabelItem = {
      id: `manual_${Date.now()}`,
      consignmentId: clean,
      shopId,
      createdAt: new Date().toISOString(),
      printed: false,
    };

    const updated = [newItem, ...labels];
    persistLabels(updated);
    setSelectedIds((prev) => [newItem.id, ...prev]);
    setManualCid("");
    toast.success(`কনসাইনমেন্ট #${clean} প্রিন্ট তালিকায় যুক্ত হয়েছে!`);
  };

  // Delete selected labels
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const remaining = labels.filter((l) => !selectedIds.includes(l.id));
    persistLabels(remaining);
    setSelectedIds([]);
    setDeleteConfirmOpen(false);
    toast.success("নির্বাচিত লেবেলগুলো তালিকা থেকে মুছে ফেলা হয়েছে।");
    if (onLabelsProcessed) onLabelsProcessed();
  };

  // Clear all labels
  const handleClearAll = () => {
    persistLabels([]);
    setSelectedIds([]);
    setDeleteConfirmOpen(false);
    toast.success("সকল লেবেল তালিকা থেকে মুছে ফেলা হয়েছে।");
    if (onLabelsProcessed) onLabelsProcessed();
  };

  // Filter selected items to print
  const labelsToPrint = useMemo(() => {
    return labels.filter((l) => selectedIds.includes(l.id));
  }, [labels, selectedIds]);

  // Execute Print using hidden iframe
  const handlePrint = () => {
    if (labelsToPrint.length === 0) {
      toast.error("প্রিন্ট করার জন্য কমপক্ষে একটি লেবেল নির্বাচন করুন।");
      return;
    }

    setIsPrinting(true);

    // CRITICAL: The physical roll width is ALWAYS 50mm, feed height is 75mm (or user selected 76/77mm)
    const widthMm = "50mm";
    const heightMm = `${feedHeightMm}mm`;

    // Rotated 90° layout (Image 1 - Along the 75mm length)
    // Straight layout (Image 2 - Across the 50mm width)
    const isRotated = textOrientation === "rotated90";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Steadfast Labels - 50x75mm</title>
        <style>
          @page {
            size: ${widthMm} ${heightMm};
            margin: 0mm !important;
          }
          @media print {
            html, body {
              width: ${widthMm} !important;
              height: ${heightMm} !important;
              margin: 0mm !important;
              padding: 0mm !important;
              background: #fff !important;
              color: #000 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .sticker-page {
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #fff;
            color: #000;
            width: ${widthMm};
            height: ${heightMm};
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          .sticker-page {
            width: ${widthMm};
            height: ${heightMm};
            max-width: ${widthMm};
            max-height: ${heightMm};
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            box-sizing: border-box;
            page-break-after: always;
            break-after: page;
          }

          /* Mode 1: Rotated 90 degrees along 75mm length (matches user's first photo) */
          .content-rotated {
            width: ${heightMm};
            height: ${widthMm};
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) rotate(90deg);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            box-sizing: border-box;
            padding: 0 4mm;
            ${alignmentMode === "right_offset" ? "transform: translate(-50%, -50%) rotate(90deg) translateY(-4mm);" : ""}
          }
          .content-rotated .shop-id {
            font-size: 17pt;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #000;
            margin-bottom: 3px;
            line-height: 1.15;
            white-space: nowrap;
          }
          .content-rotated .consignment-id {
            font-size: 25pt;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #000;
            line-height: 1.15;
            white-space: nowrap;
          }

          /* Mode 2: Straight across 50mm width (matches user's second photo) */
          .content-straight {
            width: ${widthMm};
            height: ${heightMm};
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            box-sizing: border-box;
            padding: 0 2mm;
          }
          .content-straight .shop-id {
            font-size: 13pt;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #000;
            margin-bottom: 2px;
            line-height: 1.15;
            white-space: nowrap;
          }
          .content-straight .consignment-id {
            font-size: 17pt;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #000;
            line-height: 1.15;
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        ${labelsToPrint
          .map(
            (item) => `
          <div class="sticker-page">
            ${
              isRotated
                ? `
              <div class="content-rotated">
                <div class="shop-id">ID: ${item.shopId || shopId || DEFAULT_SHOP_ID}</div>
                <div class="consignment-id">#${item.consignmentId}</div>
              </div>
            `
                : `
              <div class="content-straight">
                <div class="shop-id">ID: ${item.shopId || shopId || DEFAULT_SHOP_ID}</div>
                <div class="consignment-id">#${item.consignmentId}</div>
              </div>
            `
            }
          </div>
        `
          )
          .join("")}
      </body>
      </html>
    `;

    // Write to hidden iframe and print
    let iframe = iframeRef.current;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);
      iframeRef.current = iframe;
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        setIsPrinting(false);
        try {
          iframe?.contentWindow?.focus();
          iframe?.contentWindow?.print();

          // Mark printed
          const updated = labels.map((l) =>
            selectedIds.includes(l.id) ? { ...l, printed: true } : l
          );
          persistLabels(updated);
          toast.success(`${labelsToPrint.length} টি লেবেল 50x75mm সাইজে পাঠানো হয়েছে!`);
        } catch (err) {
          console.error("Print trigger error:", err);
          toast.error("প্রিন্ট করতে সমস্যা হয়েছে।");
        }
      }, 350);
    } else {
      setIsPrinting(false);
      toast.error("প্রিন্ট ফ্রেম তৈরি করা সম্ভব হয়নি।");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-[#0f172a] max-w-4xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative rounded-3xl max-h-[92vh] flex flex-col animate-scaleIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
              <Printer size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>মিনি থার্মাল স্টিকার প্রিন্টার</span>
                <span className="text-[11px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  50mm × 75mm (38 Dai)
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                শপ আইডি: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">ID: {shopId}</span> | কনসাইনমেন্ট: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">#...</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Orientation & Layout Presets */}
        <div className="mt-3 p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
            <Sparkles size={14} className="text-emerald-600" />
            <span>প্রিন্ট মোড সিলেক্ট করুন:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Mode 1: Rotated 90 deg along 75mm length (Recommended - Photo 1) */}
            <button
              type="button"
              onClick={() => {
                setTextOrientation("rotated90");
                setAlignmentMode("center");
                toast.success("৭৫মিমি লম্বায় লেখা (রোটেট ৯০০ - বড় হরফ) সেট করা হয়েছে");
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer text-xs ${
                textOrientation === "rotated90"
                  ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <RotateCw size={13} />
              <span>৭৫মিমি লম্বায় লেখা (১ম ছবির মতো - রিকমেন্ডেড)</span>
              {textOrientation === "rotated90" && <Check size={13} />}
            </button>

            {/* Mode 2: Straight across 50mm width (Photo 2) */}
            <button
              type="button"
              onClick={() => {
                setTextOrientation("straight");
                setAlignmentMode("center");
                toast.success("৫০মিমি প্রস্থে সোজা লেখা সেট করা হয়েছে");
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer text-xs ${
                textOrientation === "straight"
                  ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <ArrowDownUp size={13} />
              <span>৫০মিমি প্রস্থে সোজা লেখা (২য় ছবির মতো)</span>
              {textOrientation === "straight" && <Check size={13} />}
            </button>
          </div>
        </div>

        {/* Detailed Configuration Bar */}
        <div className="py-2.5 px-4 my-2 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shrink-0 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          {/* Shop ID */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              শপ নম্বর (Shop ID):
            </label>
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 shadow-sm">
              <span className="font-bold text-slate-500 font-mono text-xs">ID:</span>
              <input
                type="text"
                value={shopId}
                onChange={(e) => setShopId(e.target.value.trim())}
                placeholder="2410661"
                className="w-full bg-transparent font-mono font-bold text-slate-900 dark:text-white focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Roll Width (Fixed to 50mm) */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              রোল প্রস্থ (Width):
            </label>
            <div className="bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 dark:text-slate-300 shadow-sm text-xs flex items-center justify-between">
              <span>50 মিমি (ফিক্সড)</span>
              <span className="text-[10px] text-slate-400 font-normal">রোল হেড</span>
            </div>
          </div>

          {/* Feed Length / Height Control */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              লেবেল দৈর্ঘ্য (Feed Height):
            </label>
            <select
              value={feedHeightMm}
              onChange={(e) => setFeedHeightMm(Number(e.target.value))}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer shadow-sm text-xs"
            >
              <option value={75}>75 মিমি (স্ট্যান্ডার্ড লেবেল)</option>
              <option value={76}>76 মিমি (+১ মিমি অতিরিক্ত ফিড)</option>
              <option value={77}>77 মিমি (+২ মিমি টিয়ারবার ক্লিয়ার)</option>
              <option value={78}>78 মিমি (+৩ মিমি ফিড)</option>
            </select>
          </div>

          {/* Alignment Mode */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              অ্যালাইনমেন্ট:
            </label>
            <select
              value={alignmentMode}
              onChange={(e) => setAlignmentMode(e.target.value as any)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer shadow-sm text-xs"
            >
              <option value="center">সেন্টার (মাঝখানে - ডিফল্ট)</option>
              <option value="right_offset">ডান পাশে কিছুটা মার্জিন</option>
            </select>
          </div>
        </div>

        {/* Important Printer Notice */}
        <div className="mb-2.5 p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <Info size={14} className="text-amber-600 shrink-0" />
          <span>
            <strong>টিপস:</strong> সম্পূর্ণ পেপার বাইরে আসার জন্য প্রিন্ট উইন্ডোতে <strong>Margins: "None" (কোনো মার্জিন নেই)</strong> এবং <strong>Scale: 100% (Default)</strong> রাখবেন।
          </span>
        </div>

        {/* Manual Add Consignment Form */}
        <form onSubmit={handleAddManualCid} className="flex items-center gap-2 mb-2.5 shrink-0">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 font-mono text-xs">
              #
            </span>
            <input
              type="text"
              value={manualCid}
              onChange={(e) => setManualCid(e.target.value)}
              placeholder="যেকোনো কনসাইনমেন্ট নম্বর ম্যানুয়ালি যোগ করুন (যেমন 309817944)..."
              className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={14} />
            <span>যোগ করুন</span>
          </button>
        </form>

        {/* Bulk Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 py-2 px-3 bg-slate-100/70 dark:bg-slate-800/60 rounded-2xl mb-2.5 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              {selectedIds.length === labels.length && labels.length > 0 ? (
                <CheckSquare size={16} className="text-blue-600" />
              ) : (
                <Square size={16} className="text-slate-400" />
              )}
              <span>সব সিলেক্ট ({selectedIds.length}/{labels.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 font-bold text-xs inline-flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
              >
                <Trash2 size={13} />
                <span>সিলেক্টেড মুছুন ({selectedIds.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              disabled={selectedIds.length === 0 || isPrinting}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Printer size={15} className={isPrinting ? "animate-spin" : ""} />
              <span>{isPrinting ? "প্রিন্ট হচ্ছে..." : `প্রিন্ট করুন (${selectedIds.length} টি)`}</span>
            </button>
          </div>
        </div>

        {/* Labels Grid Preview Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[220px]">
          {labels.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 space-y-2">
              <Tag size={32} className="opacity-40" />
              <p className="text-xs font-semibold">প্রিন্ট তালিকায় কোনো কনসাইনমেন্ট নেই</p>
              <p className="text-[11px] text-slate-400 max-w-sm">
                অর্ডার টেবিল থেকে বাল্ক সেন্ড করলে স্বয়ংক্রিয়ভাবে এখানে কনসাইনমেন্ট যুক্ত হবে, অথবা উপরে ম্যানুয়ালি কনসাইনমেন্ট নম্বর যোগ করতে পারেন।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {labels.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleSelectOne(item.id)}
                    className={`relative p-3 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                      isSelected
                        ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-400 dark:border-blue-700 shadow-sm ring-1 ring-blue-400 dark:ring-blue-600"
                        : "bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                        />
                        {item.orderId && (
                          <span className="font-mono font-bold text-[11px] text-blue-600 dark:text-blue-400">
                            {item.orderId}
                          </span>
                        )}
                      </div>
                      {item.printed && (
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-bold inline-flex items-center gap-0.5">
                          <CheckCircle2 size={10} /> প্রিন্টেড
                        </span>
                      )}
                    </div>

                    {/* Exact 50mm * 75mm Visual Simulation */}
                    <div className="flex justify-center my-1">
                      <div
                        className={`bg-white text-black rounded-xl border border-slate-300 shadow-sm relative overflow-hidden flex items-center justify-center transition-all ${
                          textOrientation === "rotated90"
                            ? "w-[120px] h-[180px]" // 50mm:75mm aspect ratio
                            : "w-[120px] h-[180px]"
                        }`}
                      >
                        {textOrientation === "rotated90" ? (
                          // Rotated 90 degrees simulation (Photo 1)
                          <div className="rotate-90 select-none flex flex-col items-center justify-center text-center">
                            <div className="font-bold text-xs tracking-wide text-slate-800 whitespace-nowrap">
                              ID: {item.shopId || shopId || DEFAULT_SHOP_ID}
                            </div>
                            <div className="font-black text-base tracking-wider text-black whitespace-nowrap">
                              #{item.consignmentId}
                            </div>
                          </div>
                        ) : (
                          // Straight simulation (Photo 2)
                          <div className="select-none flex flex-col items-center justify-center text-center p-2">
                            <div className="font-bold text-xs tracking-wide text-slate-800">
                              ID: {item.shopId || shopId || DEFAULT_SHOP_ID}
                            </div>
                            <div className="font-black text-sm tracking-wider text-black mt-0.5">
                              #{item.consignmentId}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span className="truncate max-w-[140px]">
                        {item.customerName || "অর্ডার লেবেল"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(String(item.consignmentId));
                          toast.success("কনসাইনমেন্ট আইডি কপি করা হয়েছে!");
                        }}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                        title="কপি করুন"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            মোট লেবেল: <strong className="text-slate-900 dark:text-white">{labels.length}</strong> টি{" "}
            (নির্বাচিত: <strong className="text-blue-600 dark:text-blue-400">{selectedIds.length}</strong> টি)
          </div>

          <div className="flex items-center gap-2">
            {labels.length > 0 && (
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 text-slate-600 dark:text-slate-300 font-bold transition-colors cursor-pointer"
              >
                মুছে ফেলুন...
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              disabled={selectedIds.length === 0 || isPrinting}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black px-5 py-2.5 rounded-xl text-xs inline-flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Printer size={15} className={isPrinting ? "animate-spin" : ""} />
              <span>{isPrinting ? "প্রিন্ট হচ্ছে..." : `প্রিন্ট করুন (${selectedIds.length})`}</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0f172a] max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl animate-scaleIn text-xs">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Trash2 size={16} className="text-red-500" />
                লেবেল মুছে ফেলা
              </h4>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                আপনি কি প্রিন্ট তালিকা থেকে নির্বাচিত লেবেলগুলো মুছে ফেলতে চান?
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
                >
                  নির্বাচিত ({selectedIds.length}) মুছুন
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold cursor-pointer"
                >
                  সব মুছুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
