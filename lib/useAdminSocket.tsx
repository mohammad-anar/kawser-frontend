"use client";

import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { getSocket, playOrderNotificationSound, playStatusChangeSound } from "./socket";

export interface NewOrderPayload {
  _id: string;
  orderId: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface UseAdminSocketOptions {
  onNewOrder?: (order: NewOrderPayload) => void;
  enableNotification?: boolean;
}

// Global title blinker controller
let blinkInterval: NodeJS.Timeout | null = null;
let originalTitle: string = "";
let blinkCount = 0;
let isBlinking = false;

export function triggerTitleBlink(count: number = 1) {
  if (typeof document === "undefined") return;

  if (!isBlinking) {
    originalTitle = document.title;
    isBlinking = true;
  }
  blinkCount = Math.max(blinkCount, count);

  if (blinkInterval) {
    clearInterval(blinkInterval);
  }

  let showAlt = true;
  blinkInterval = setInterval(() => {
    if (showAlt) {
      document.title = `🔔 (${blinkCount}) নতুন অর্ডার এসেছে!`;
    } else {
      document.title = originalTitle || "CareZoneBD";
    }
    showAlt = !showAlt;
  }, 900);

  // Stop blinking when user focuses or clicks the document
  const stopBlinking = () => {
    if (blinkInterval) {
      clearInterval(blinkInterval);
      blinkInterval = null;
    }
    if (originalTitle) {
      document.title = originalTitle;
    }
    isBlinking = false;
    blinkCount = 0;
    window.removeEventListener("focus", stopBlinking);
    window.removeEventListener("click", stopBlinking);
  };

  window.addEventListener("focus", stopBlinking, { once: true });
  window.addEventListener("click", stopBlinking, { once: true });
}

export function useAdminSocket({
  onNewOrder,
  enableNotification = true,
}: UseAdminSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const onNewOrderRef = useRef(onNewOrder);

  useEffect(() => {
    onNewOrderRef.current = onNewOrder;
  }, [onNewOrder]);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("join_admin");
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleNewOrder = (order: NewOrderPayload) => {
      // Play audio notification chime
      playOrderNotificationSound();

      // Trigger document title blinking
      triggerTitleBlink(1);

      // Show rich Sonner toast
      if (enableNotification) {
        toast.custom(
          (t) => (
            <div className="bg-[#121228] border border-yellow-500/40 shadow-2xl shadow-yellow-500/10 rounded-2xl p-4 text-white flex items-start gap-3 w-full max-w-md animate-fadeIn">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0 text-xl font-black">
                🛍️
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-sm text-yellow-400">
                    নতুন অর্ডার এসেছে!
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    {order.orderId}
                  </span>
                </div>
                <p className="text-xs text-gray-200 mt-1 truncate">
                  <span className="font-semibold text-white">{order.customerName}</span> (
                  {order.phoneNumber})
                </p>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1.5 pt-1.5 border-t border-white/10">
                  <span>পরিমাণ: {order.quantity} টি</span>
                  <span className="text-yellow-400 font-black text-xs">৳{order.totalPrice}</span>
                </div>
              </div>
            </div>
          ),
          { duration: 8000 }
        );
      }

      // Execute custom callback (e.g. refetch RTK Query)
      if (onNewOrderRef.current) {
        onNewOrderRef.current(order);
      }
    };

    const handleOrderStatusUpdated = (data: {
      orderId: string;
      newStatus: string;
      previousStatus?: string;
      customerName?: string;
      source?: string;
      steadfastStatus?: string;
    }) => {
      if (!data?.orderId || !data?.newStatus) return;

      // Play soft notification sound
      playStatusChangeSound();

      const status = data.newStatus;
      const getStatusStyle = (st: string) => {
        switch (st) {
          case "Delivered":
            return {
              bg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
              badge: "bg-emerald-500 text-white",
              icon: "📦",
              label: "ডেলিভার্ড (Delivered)",
            };
          case "Partial Delivered":
            return {
              bg: "bg-teal-500/20 border-teal-500/40 text-teal-300",
              badge: "bg-teal-600 text-white",
              icon: "📦🌓",
              label: "আংশিক ডেলিভার্ড (Partial Delivered)",
            };
          case "Shipped":
            return {
              bg: "bg-blue-500/20 border-blue-500/40 text-blue-300",
              badge: "bg-blue-500 text-white",
              icon: "🚚",
              label: "শিপড / ডেলিভারির পথে (Shipped)",
            };
          case "Cancelled":
            return {
              bg: "bg-rose-500/20 border-rose-500/40 text-rose-300",
              badge: "bg-rose-500 text-white",
              icon: "❌",
              label: "বাতিল (Cancelled)",
            };
          case "Hold":
            return {
              bg: "bg-amber-500/20 border-amber-500/40 text-amber-300",
              badge: "bg-amber-500 text-white",
              icon: "⏸️",
              label: "হোল্ড (Hold)",
            };
          case "Processing":
            return {
              bg: "bg-purple-500/20 border-purple-500/40 text-purple-300",
              badge: "bg-purple-500 text-white",
              icon: "⏳",
              label: "প্রসেসিং (Processing)",
            };
          case "Confirmed":
            return {
              bg: "bg-teal-500/20 border-teal-500/40 text-teal-300",
              badge: "bg-teal-500 text-white",
              icon: "✅",
              label: "কনফার্মড (Confirmed)",
            };
          default:
            return {
              bg: "bg-slate-500/20 border-slate-500/40 text-slate-300",
              badge: "bg-slate-600 text-white",
              icon: "🔄",
              label: st,
            };
        }
      };

      const style = getStatusStyle(status);

      toast.custom(
        (t) => (
          <div className="bg-[#0f172a] border border-slate-700/80 shadow-2xl shadow-blue-500/10 rounded-2xl p-4 text-white flex items-start gap-3 w-full max-w-md animate-fadeIn">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 text-xl font-bold ${style.bg}`}
            >
              {style.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  অর্ডার স্ট্যাটাস পরিবর্তিত হয়েছে
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-blue-400 border border-slate-700">
                  {data.orderId}
                </span>
              </div>
              {data.customerName && (
                <p className="text-xs text-slate-300 mt-1 truncate font-medium">
                  গ্রাহক: <span className="text-white font-semibold">{data.customerName}</span>
                </p>
              )}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-400">বর্তমান স্ট্যাটাস:</span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-sm ${style.badge}`}>
                  {style.label}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                <span>সোর্স:</span>
                <span className="text-slate-300 font-semibold">{data.source || "Steadfast Courier"}</span>
              </div>
            </div>
          </div>
        ),
        { duration: 7000 }
      );

      if (onNewOrderRef.current) {
        onNewOrderRef.current({} as any);
      }
    };

    const handleBulkStatusUpdated = () => {
      if (onNewOrderRef.current) {
        onNewOrderRef.current({} as any);
      }
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("new_order", handleNewOrder);
    socket.on("order_status_updated", handleOrderStatusUpdated);
    socket.on("orders_bulk_status_updated", handleBulkStatusUpdated);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("new_order", handleNewOrder);
      socket.off("order_status_updated", handleOrderStatusUpdated);
      socket.off("orders_bulk_status_updated", handleBulkStatusUpdated);
    };
  }, [enableNotification]);

  return { isConnected };
}
