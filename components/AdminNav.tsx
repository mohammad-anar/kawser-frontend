"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  LogOut,
  ArrowLeft,
  Shield,
  Bell,
  CheckCheck,
  Trash2,
  PackageCheck,
  ExternalLink,
  Clock,
  Check,
  KeyRound,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { logout } from "@/lib/redux/slices/authSlice";
import { useAdminSocket, NewOrderPayload } from "@/lib/useAdminSocket";

export interface AdminNotification {
  id: string;
  orderId: string;
  customerName: string;
  phoneNumber: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  read: boolean;
}

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load saved notifications from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("pc_admin_notifications");
        if (saved) {
          setNotifications(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Failed to load notifications from localStorage", e);
      }
    }
  }, []);

  // Save notifications to localStorage when updated
  const saveNotifications = (items: AdminNotification[]) => {
    setNotifications(items);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("pc_admin_notifications", JSON.stringify(items.slice(0, 50)));
      } catch (e) {
        console.error("Failed to save notifications", e);
      }
    }
  };

  // Real-time socket integration
  const { isConnected } = useAdminSocket({
    enableNotification: true,
    onNewOrder: (order: NewOrderPayload) => {
      const newNotif: AdminNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        orderId: order.orderId,
        customerName: order.customerName,
        phoneNumber: order.phoneNumber,
        quantity: order.quantity,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt || new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("pc_admin_notifications", JSON.stringify(updated.slice(0, 50)));
          } catch (e) {
            console.error("Failed to persist notification", e);
          }
        }
        return updated;
      });
    },
  });

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearAllNotifications = () => {
    saveNotifications([]);
  };

  const handleNotificationClick = (notif: AdminNotification) => {
    // Mark this notification as read
    const updated = notifications.map((n) => (n.id === notif.id ? { ...n, read: true } : n));
    saveNotifications(updated);
    setIsOpen(false);
    router.push(`/admin/orders?search=${encodeURIComponent(notif.orderId)}`);
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "এইমাত্র";
      if (mins < 60) return `${mins} মি. আগে`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs} ঘণ্টা আগে`;
      const days = Math.floor(hrs / 24);
      return `${days} দিন আগে`;
    } catch {
      return "কিছুক্ষণ আগে";
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push("/admin/login");
  };

  const navItems = [
    { label: "ড্যাশবোর্ড", href: "/admin", icon: LayoutDashboard },
    { label: "সকল অর্ডার", href: "/admin/orders", icon: ShoppingCart },
    { label: "পাসওয়ার্ড", href: "/admin/change-password", icon: KeyRound },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#080814]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-black font-black text-xs shadow-md shadow-yellow-500/20">
            PC
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center gap-1.5">
              Personal Care BD <Shield size={12} className="text-yellow-400" />
            </div>
            <div className="text-[10px] text-yellow-400 uppercase tracking-wider font-semibold">
              Admin Control Panel
            </div>
          </div>
        </Link>

        <nav className="hidden sm:flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Live Socket Status Indicator */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
            isConnected
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
          }`}
          title={isConnected ? "WebSocket লাইভ কানেক্টেড" : "WebSocket রিকানেক্ট হচ্ছে..."}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
            }`}
          />
          <span>{isConnected ? "লাইভ" : "কানেক্টিং..."}</span>
        </div>

        {/* Interactive Notification Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative p-2 rounded-xl border transition-all ${
              isOpen || unreadCount > 0
                ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400"
                : "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
            }`}
            title="নোটিফিকেশন দেখুন"
            aria-label="Notifications"
          >
            <Bell size={17} className={unreadCount > 0 ? "animate-bounce" : ""} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 border border-black animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Popover */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0e0e24] border border-yellow-500/30 rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden flex flex-col animate-scaleIn">
              {/* Header */}
              <div className="px-4 py-3 bg-[#131330] border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Bell size={15} className="text-yellow-400" /> নোটিফিকেশন তালিকা
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-yellow-500/30">
                      {unreadCount} নতুন
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-gray-400 hover:text-yellow-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                      title="সব পঠিত চিহ্নিত করুন"
                    >
                      <CheckCheck size={13} />
                      <span className="hidden sm:inline">সব পড়েছি</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] text-gray-400 hover:text-red-400 flex items-center gap-1 px-1.5 py-1 rounded hover:bg-white/5 transition-colors"
                      title="সব নোটিফিকেশন মুছুন"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-yellow-500/20 scrollbar-track-transparent">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 sm:p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-white/5 ${
                        !notif.read ? "bg-yellow-500/[0.04]" : ""
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base font-bold border ${
                          !notif.read
                            ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400 shadow-sm"
                            : "bg-white/5 border-white/10 text-gray-400"
                        }`}
                      >
                        🛍️
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold text-white truncate">
                            {notif.customerName}
                          </span>
                          <span className="text-[10px] text-yellow-400 font-extrabold bg-yellow-500/15 px-1.5 py-0.5 rounded border border-yellow-500/25 shrink-0">
                            {notif.orderId}
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-400 truncate">
                          {notif.phoneNumber} • পরিমাণ: {notif.quantity} টি
                        </p>

                        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-white/5 text-[10px]">
                          <span className="text-emerald-400 font-bold">
                            ৳{notif.totalPrice.toLocaleString()}
                          </span>
                          <span className="text-gray-400 flex items-center gap-1">
                            <Clock size={10} /> {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                      </div>

                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-10 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-2 text-gray-400">
                      <Bell size={20} />
                    </div>
                    <p className="text-xs font-semibold text-gray-300">
                      কোনো নতুন নোটিফিকেশন নেই
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      নতুন কোনো অর্ডার আসলে এখানে তাৎক্ষণিক দেখতে পাবেন।
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-[#131330] border-t border-white/10 text-center">
                <Link
                  href="/admin/orders"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-bold text-yellow-400 hover:text-yellow-300 inline-flex items-center justify-center gap-1 w-full py-1 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <PackageCheck size={14} /> সকল অর্ডার দেখুন
                </Link>
              </div>
            </div>
          )}
        </div>

        <Link
          href="/"
          target="_blank"
          className="hidden md:flex items-center gap-1 text-xs text-gray-400 hover:text-yellow-400 transition-colors px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5"
        >
          <ArrowLeft size={12} /> ওয়েবসাইট দেখুন
        </Link>

        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <span className="text-xs text-gray-300 font-medium hidden sm:block">
            {user?.name || "এডমিন"}
          </span>
          <Link
            href="/admin/change-password"
            title="পাসওয়ার্ড পরিবর্তন"
            className="hidden sm:flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 px-2.5 py-1.5 rounded-lg border border-yellow-500/20 transition-all"
          >
            <KeyRound size={13} />
            <span className="hidden md:inline">পাসওয়ার্ড</span>
          </Link>
          <button
            onClick={handleLogout}
            title="লগআউট"
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1.5 rounded-lg border border-red-500/20 transition-all"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">লগআউট</span>
          </button>
        </div>
      </div>
    </header>
  );
}

