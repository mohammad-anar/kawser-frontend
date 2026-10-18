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

  // Paper Size & Orientation: Default to 50mm * 75mm Landscape for Mini Thermal Printer
  const [paperSize, setPaperSize] = useState<
    "50x75_landscape" | "50x75_portrait" | "printer_default_landscape" | "3x2_landscape" | "2x3_portrait"
  >("50x75_landscape");

  // Alignment: Center or Right Margin
  const [alignmentMode, setAlignmentMode] = useState<"center" | "right_1_8" | "custom">("center");
  const [customMargin, setCustomMargin] = useState<string>("1.8in");

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

    // Page dimension & orientation rules
    let pageSizeCss = "size: 75mm 50mm;";
    let pageWidth = "75mm";
    let pageHeight = "50mm";
    let isMini = true;

    if (paperSize === "50x75_landscape") {
      pageSizeCss = "size: 75mm 50mm;";
      pageWidth = "75mm";
      pageHeight = "50mm";
      isMini = true;
    } else if (paperSize === "50x75_portrait") {
      pageSizeCss = "size: 50mm 75mm;";
      pageWidth = "50mm";
      pageHeight = "75mm";
      isMini = true;
    } else if (paperSize === "printer_default_landscape") {
      pageSizeCss = "size: landscape;";
      pageWidth = "100%";
      pageHeight = "100%";
      isMini = false;
    } else if (paperSize === "3x2_landscape") {
      pageSizeCss = "size: 3in 2in;";
      pageWidth = "3in";
      pageHeight = "2in";
      isMini = false;
    } else if (paperSize === "2x3_portrait") {
      pageSizeCss = "size: 2in 3in;";
      pageWidth = "2in";
      pageHeight = "3in";
      isMini = false;
    }

    // Alignment rules
    let alignCss = "justify-content: center; align-items: center;";
    let contentAlign = "text-align: center;";

    if (alignmentMode === "right_1_8") {
      alignCss = "justify-content: center; align-items: flex-end; padding-right: 1.8in; padding-left: 0.1in;";
      contentAlign = "text-align: right;";
    } else if (alignmentMode === "custom") {
      const marginVal = customMargin?.trim() || "1.8in";
      alignCss = `justify-content: center; align-items: flex-end; padding-right: ${marginVal}; padding-left: 0.1in;`;
      contentAlign = "text-align: right;";
    }

    // Font scaling for 50mm*75mm mini printer
    const shopIdFontSize = isMini ? "16pt" : "20pt";
    const cidFontSize = isMini ? "22pt" : "28pt";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Steadfast Labels Print</title>
        <style>
          @page {
            ${pageSizeCss}
            margin: 0;
          }
          @media print {
            html, body {
              width: ${pageWidth} !important;
              height: ${pageHeight} !important;
              margin: 0 !important;
              padding: 0 !important;
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
            width: ${pageWidth};
            height: ${pageHeight};
          }
          .sticker-page {
            width: ${pageWidth};
            height: ${pageHeight};
            max-width: ${pageWidth};
            max-height: ${pageHeight};
            display: flex;
            flex-direction: column;
            ${alignCss}
            overflow: hidden;
            box-sizing: border-box;
          }
          .sticker-content {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            ${contentAlign}
          }
          .shop-id {
            font-size: ${shopIdFontSize};
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #000;
            margin-bottom: 3px;
            line-height: 1.15;
            white-space: nowrap;
          }
          .consignment-id {
            font-size: ${cidFontSize};
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
            <div class="sticker-content">
              <div class="shop-id">ID: ${item.shopId || shopId || DEFAULT_SHOP_ID}</div>
              <div class="consignment-id">#${item.consignmentId}</div>
            </div>
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
          toast.success(`${labelsToPrint.length} টি লেবেল প্রিন্ট কমান্ডে পাঠানো হয়েছে!`);
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
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
              <Printer size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>মিনি থার্মাল স্টিকার প্রিন্টার</span>
                <span className="text-[11px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  50mm × 75mm (34 dia)
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                শপ আইডি: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">ID: {shopId}</span> এবং কনসাইনমেন্ট: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">#...</span>
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

        {/* Quick Presets Bar (Fast 1-click toggling for mini printers) */}
        <div className="mt-3 p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
            <Sparkles size={14} className="text-emerald-600" />
            <span>মিনি প্রিন্টার প্রিসেট:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Preset 1: 50mm x 75mm Landscape Center (Default) */}
            <button
              type="button"
              onClick={() => {
                setPaperSize("50x75_landscape");
                setAlignmentMode("center");
                toast.success("50mm × 75mm ল্যান্ডস্কেপ সেন্টার (মিনি প্রিন্টার) সেট করা হয়েছে");
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer text-xs ${
                paperSize === "50x75_landscape" && alignmentMode === "center"
                  ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <AlignCenter size={13} />
              <span>50mm×75mm সেন্টার (ডিফল্ট)</span>
              {paperSize === "50x75_landscape" && alignmentMode === "center" && (
                <Check size={13} />
              )}
            </button>

            {/* Preset 2: Right Margin 1.8in */}
            <button
              type="button"
              onClick={() => {
                setPaperSize("50x75_landscape");
                setAlignmentMode("right_1_8");
                setCustomMargin("1.8in");
                toast.success("50mm × 75mm: ডান পাশ থেকে ১.৮\" মার্জিন সেট করা হয়েছে");
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer text-xs ${
                alignmentMode === "right_1_8"
                  ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <AlignRight size={13} />
              <span>ডান পাশ থেকে ১.৮" মার্জিন</span>
              {alignmentMode === "right_1_8" && <Check size={13} />}
            </button>

            {/* Preset 3: Printer Default */}
            <button
              type="button"
              onClick={() => {
                setPaperSize("printer_default_landscape");
                setAlignmentMode("center");
                toast.success("প্রিন্টার ডিফল্ট সেটিং (ল্যান্ডস্কেপ) সেট করা হয়েছে");
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer text-xs ${
                paperSize === "printer_default_landscape" && alignmentMode === "center"
                  ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <Maximize2 size={13} />
              <span>প্রিন্টার ডিফল্ট সেটিং</span>
              {paperSize === "printer_default_landscape" && alignmentMode === "center" && (
                <Check size={13} />
              )}
            </button>
          </div>
        </div>

        {/* Detailed Configuration Bar */}
        <div className="py-3 px-4 my-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shrink-0 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
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

          {/* Paper Size & Orientation */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              পেপার সাইজ (Mini Printer):
            </label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as any)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer shadow-sm text-xs"
            >
              <option value="50x75_landscape">50mm × 75mm (ল্যান্ডস্কেপ - 34 dai)</option>
              <option value="50x75_portrait">50mm × 75mm (পোর্ট্রেট - 34 dai)</option>
              <option value="printer_default_landscape">প্রিন্টার ডিফল্ট সেটিং (ল্যান্ডস্কেপ)</option>
              <option value="3x2_landscape">৩" × ২" ইঞ্চি (ল্যান্ডস্কেপ ফিক্সড)</option>
              <option value="2x3_portrait">২" × ৩" ইঞ্চি (পোর্ট্রেট)</option>
            </select>
          </div>

          {/* Alignment / Positioning */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              পজিশন / অ্যালাইনমেন্ট:
            </label>
            <select
              value={alignmentMode}
              onChange={(e) => setAlignmentMode(e.target.value as any)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer shadow-sm text-xs"
            >
              <option value="center">সেন্টার (মাঝখানে - ল্যান্ডস্কেপ)</option>
              <option value="right_1_8">ডান পাশ থেকে ১.৮" মার্জিন</option>
              <option value="custom">কাস্টম মার্জিন...</option>
            </select>
          </div>

          {/* Custom Margin Input */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              ডান মার্জিন (যেমন 1.8in বা 20mm):
            </label>
            <input
              type="text"
              value={alignmentMode === "right_1_8" ? "1.8in" : customMargin}
              onChange={(e) => {
                setAlignmentMode("custom");
                setCustomMargin(e.target.value);
              }}
              placeholder="1.8in বা 20mm"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 dark:text-white focus:outline-none shadow-sm text-xs"
            />
          </div>
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

                    {/* Sticker Visual Simulation (50mm * 75mm mini printer ratio) */}
                    <div
                      className={`bg-white text-black p-3.5 rounded-xl border border-slate-300 shadow-inner my-1 flex flex-col justify-center min-h-[85px] ${
                        alignmentMode === "right_1_8" || alignmentMode === "custom"
                          ? "items-end text-right pr-4"
                          : "items-center text-center"
                      }`}
                    >
                      <div className="inline-flex flex-col items-center">
                        <div className="font-bold text-sm tracking-wide text-slate-800 font-sans">
                          ID: {item.shopId || shopId || DEFAULT_SHOP_ID}
                        </div>
                        <div className="font-black text-xl tracking-wider text-black mt-0.5 font-sans">
                          #{item.consignmentId}
                        </div>
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
