"use client";

import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { getSocket, playOrderNotificationSound } from "./socket";

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
      document.title = originalTitle || "SelfCareSolution";
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

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("new_order", handleNewOrder);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("new_order", handleNewOrder);
    };
  }, [enableNotification]);

  return { isConnected };
}
