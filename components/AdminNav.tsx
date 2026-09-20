"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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
import ThemeToggle from "./ThemeToggle";

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
    router.push("/login");
  };

  const navItems = [
    { label: "ড্যাশবোর্ড", href: "/admin", icon: LayoutDashboard },
    { label: "সকল অর্ডার", href: "/admin/orders", icon: ShoppingCart },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/98 dark:bg-[#0a0a1e]/98 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-6">
        <Link href="/admin" className="flex items-center gap-2.5 sm:gap-3 group">
          <div className="w-32 sm:w-40 transition-transform duration-200 group-hover:scale-105">
            <Image
              src="/images/selfcaresolution2.PNG"
              width={180}
              height={90}
              alt="Care Zone BD Admin"
              priority
              className="h-auto w-full object-contain"
            />
          </div>
          <div className="hidden xs:flex flex-col border-l border-blue-200 dark:border-slate-700 pl-2.5">
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <span>Admin</span>
              <Shield size={11} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              Control Panel
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
                    ? "bg-blue-600 text-white border border-blue-700 shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
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
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
              : "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800"
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
            className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
              isOpen || unreadCount > 0
                ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            title="নোটিফিকেশন দেখুন"
            aria-label="Notifications"
          >
            <Bell size={17} className={unreadCount > 0 ? "animate-bounce" : ""} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 border border-white dark:border-black animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Popover */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-scaleIn">
              {/* Header */}
              <div className="px-4 py-3 bg-blue-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Bell size={15} className="text-blue-600 dark:text-blue-400" /> নোটিফিকেশন তালিকা
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-200 dark:border-blue-800">
                      {unreadCount} নতুন
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="সব পঠিত চিহ্নিত করুন"
                    >
                      <CheckCheck size={13} />
                      <span className="hidden sm:inline">সব পড়েছি</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-red-500 flex items-center gap-1 px-1.5 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="সব নোটিফিকেশন মুছুন"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 sm:p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-blue-50/50 dark:hover:bg-slate-800/60 ${
                        !notif.read ? "bg-blue-50/30 dark:bg-slate-800/30" : ""
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base font-bold border ${
                          !notif.read
                            ? "bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                        }`}
                      >
                        🛍️
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {notif.customerName}
                          </span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 shrink-0">
                            {notif.orderId}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {notif.phoneNumber} • পরিমাণ: {notif.quantity} টি
                        </p>

                        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            ৳{notif.totalPrice.toLocaleString()}
                          </span>
                          <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Clock size={10} /> {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                      </div>

                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-10 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-2 text-slate-400">
                      <Bell size={20} />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      কোনো নতুন নোটিফিকেশন নেই
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      নতুন কোনো অর্ডার আসলে এখানে তাৎক্ষণিক দেখতে পাবেন।
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-blue-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center">
                <Link
                  href="/admin/orders"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center justify-center gap-1 w-full py-1 rounded-lg hover:bg-blue-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <PackageCheck size={14} /> সকল অর্ডার দেখুন
                </Link>
              </div>
            </div>
          )}
        </div>

        <ThemeToggle />

        <Link
          href="/"
          target="_blank"
          className="hidden md:flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-semibold"
        >
          <ArrowLeft size={12} /> ওয়েবসাইট দেখুন
        </Link>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold hidden sm:block" suppressHydrationWarning>
            {user?.name || "এডমিন"}
          </span>
          <Link
            href="/admin/change-password"
            title="পাসওয়ার্ড পরিবর্তন"
            className="hidden sm:flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-white bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 font-bold transition-all"
          >
            <KeyRound size={13} />
            <span className="hidden md:inline">পাসওয়ার্ড</span>
          </Link>
          <button
            onClick={handleLogout}
            title="লগআউট"
            className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 font-bold transition-all cursor-pointer"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">লগআউট</span>
          </button>
        </div>
      </div>
    </header>
  );
}

