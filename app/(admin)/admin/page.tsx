"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import {
  useGetOrderStatsQuery,
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
  OrderData,
} from "@/lib/redux/api/orderApi";
import { useAppSelector } from "@/lib/redux/hooks";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  TrendingUp,
  Users,
  ArrowUpRight,
  RefreshCw,
  MapPin,
  ExternalLink,
  ChevronRight,
  Eye,
  AlertCircle,
  XCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminSocket } from "@/lib/useAdminSocket";
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Processing: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Shipped: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  Delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);

  // RTK Queries
  const {
    data: statsData,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useGetOrderStatsQuery(undefined, {
    pollingInterval: 30000,
  });

  const {
    data: recentOrdersData,
    isLoading: isOrdersLoading,
    refetch: refetchOrders,
  } = useGetAllOrdersQuery(
    { page: 1, limit: 6, status: "Delivered", isDeleted: false },
    { pollingInterval: 30000 }
  );

  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  // Listen to real-time new orders over WebSocket
  useAdminSocket({
    onNewOrder: () => {
      refetchStats();
      refetchOrders();
    },
    enableNotification: true,
  });

  useEffect(() => {
    // Check if token exists in localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("pc_token");
      if (!token) {
        router.push("/login");
      }
    }
  }, [router]);

  const stats = statsData?.stats || {
    totalOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    uniqueCustomers: 0,
    totalRevenue: 0,
    deliveryRate: 0,
  };

  const chartData = statsData?.dailyTrend?.map((item) => ({
    name: item.date.slice(5),
    বিক্রয়: item.revenue,
    অর্ডার: item.count,
  })) || [];

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus({ id: orderId, status: newStatus }).unwrap();
      toast.success("অর্ডার স্ট্যাটাস সফলভাবে পরিবর্তন করা হয়েছে");
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "স্ট্যাটাস পরিবর্তন করতে ব্যর্থ হয়েছে।");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080817] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Header summary & Refresh */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              অ্যাডমিন <span className="text-gradient-blue">ওভারভিউ ড্যাশবোর্ড</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              রিয়েল-টাইম সফল ডেলিভারি (Delivered) পরিসংখ্যান এবং বিক্রয় ট্রেন্ড অ্যানালিটিক্স
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                refetchStats();
                refetchOrders();
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <RefreshCw size={14} className={isStatsLoading || isOrdersLoading ? "animate-spin" : ""} />
              রিফ্রেশ
            </button>
            <Link
              href="/admin/orders"
              className="btn-gold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 font-bold shadow-md cursor-pointer"
            >
              সকল অর্ডার দেখুন <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* 1. Total Revenue */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 border border-blue-100 dark:border-slate-800 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">মোট বিক্রয়</span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                ৳{stats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                ডেলিভার্ড পণ্যের মোট মূল্য
              </p>
            </div>
          </div>

          {/* 2. Total Orders */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">মোট অর্ডার</span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <ShoppingBag size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {stats.totalOrders}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
                গৃহীত সর্বমোট অর্ডার
              </p>
            </div>
          </div>

          {/* 3. Delivered Orders */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 border border-emerald-100 dark:border-slate-800 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">সফল ডেলিভারি</span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {stats.deliveredOrders}
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mt-1">
                সফলতার হার: {stats.deliveryRate}%
              </p>
            </div>
          </div>

          {/* 4. Pending Orders */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 border border-amber-100 dark:border-slate-800 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">পেন্ডিং অর্ডার</span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                {stats.pendingOrders}
              </div>
              <p className="text-[10px] sm:text-[11px] text-amber-700 dark:text-amber-300 font-semibold mt-1">
                যাচাই ও প্রক্রিয়াধীন
              </p>
            </div>
          </div>

          {/* 5. Cancelled Orders */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 border border-red-100 dark:border-slate-800 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">বাতিল অর্ডার</span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center justify-center">
                <XCircle size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-red-600 dark:text-red-400 tracking-tight">
                {stats.cancelledOrders}
              </div>
              <p className="text-[10px] sm:text-[11px] text-red-700 dark:text-red-300 font-semibold mt-1">
                বাতিলকৃত মোট অর্ডার
              </p>
            </div>
          </div>
        </div>

        {/* 7-Day Revenue & Orders Trend Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-600 dark:text-blue-400" /> গত ৭ দিনের ডেলিভার্ড বিক্রয় প্রবণতা
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">সফল ডেলিভারির দৈনিক রেভিনিউ এবং অর্ডারের সংখ্যা</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis
                    yAxisId="left"
                    stroke="#2563eb"
                    fontSize={11}
                    tickFormatter={(val) => `৳${val}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#0284c7"
                    fontSize={11}
                    allowDecimals={false}
                    tickFormatter={(val) => `${val} টি`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-card, #ffffff)",
                      borderColor: "rgba(37, 99, 235, 0.2)",
                      borderRadius: "12px",
                      color: "inherit",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === "বিক্রয়") return [`৳${Number(value).toLocaleString()}`, "ডেলিভার্ড বিক্রয়"];
                      if (name === "অর্ডার") return [`${value} টি`, "ডেলিভার্ড অর্ডার"];
                      return [value, name];
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: "12px", paddingBottom: "10px" }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="বিক্রয়"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="বিক্রয়"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="অর্ডার"
                    fill="#0284c7"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                    name="অর্ডার"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                পর্যাপ্ত ডাটা পাওয়া যায়নি
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" /> সাম্প্রতিক ডেলিভার্ড অর্ডারসমূহ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">সর্বশেষ সফলভাবে ডেলিভারি সম্পন্ন হওয়া অর্ডারের সংক্ষিপ্ত তালিকা</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold inline-flex items-center gap-1 hover:underline"
            >
              সকল অর্ডার দেখুন <ChevronRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">অর্ডার আইডি</th>
                  <th className="py-3.5 px-4 font-bold">গ্রাহকের নাম ও ফোন</th>
                  <th className="py-3.5 px-4 font-bold">ঠিকানা</th>
                  <th className="py-3.5 px-4 font-bold">পরিমাণ ও মূল্য</th>
                  <th className="py-3.5 px-4 font-bold">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 font-bold text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {recentOrdersData?.orders && recentOrdersData.orders.length > 0 ? (
                  recentOrdersData.orders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {ord.orderId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{ord.customerName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{ord.phoneNumber}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-xs text-slate-600 dark:text-slate-300">
                        {ord.address}
                        {ord.district ? `, ${ord.district}` : ""}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-white">৳{ord.totalPrice}</span>
                        <span className="text-xs text-slate-400 ml-1.5">({ord.quantity} টি)</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={ord.status}
                          disabled={isUpdating}
                          onChange={(e) => handleStatusChange(ord._id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border bg-white dark:bg-slate-800 focus:outline-none cursor-pointer ${
                            STATUS_COLORS[ord.status] || "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white transition-all inline-flex items-center gap-1 text-xs cursor-pointer"
                          title="বিস্তারিত দেখুন"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      কোনো অর্ডার পাওয়া যায়নি
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <ShoppingBag size={20} className="text-blue-600 dark:text-blue-400" />
              অর্ডার বিবরণ — <span className="font-mono text-blue-600 dark:text-blue-400">{selectedOrder.orderId}</span>
            </h3>

            <div className="space-y-3.5 text-xs sm:text-sm max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">গ্রাহকের নাম:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">ফোন নম্বর:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedOrder.phoneNumber}</span>
                </div>
                {selectedOrder.email && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[11px] font-semibold">ইমেইল:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedOrder.email}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">ঠিকানা:</span>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5 font-medium">{selectedOrder.address}</p>
                {selectedOrder.district && (
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">জেলা: {selectedOrder.district}</p>
                )}
                {selectedOrder.thana && (
                  <p className="text-slate-500 dark:text-slate-400 text-xs">থানা: {selectedOrder.thana}</p>
                )}
              </div>

              {selectedOrder.gpsCoordinates && selectedOrder.gpsCoordinates.lat && (
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                    <MapPin size={15} />
                    <span>
                      GPS: {selectedOrder.gpsCoordinates.lat.toFixed(5)},{" "}
                      {selectedOrder.gpsCoordinates.lng.toFixed(5)}
                    </span>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${selectedOrder.gpsCoordinates.lat},${selectedOrder.gpsCoordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-gold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1"
                  >
                    ম্যাপ <ExternalLink size={11} />
                  </a>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-center">
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">পণ্য</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{selectedOrder.quantity} টি</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">সাইজ</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{selectedOrder.size || "স্ট্যান্ডার্ড"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">পেমেন্ট</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">{selectedOrder.paymentMethod}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-xs">অর্ডার সময়:</span>
                  <p className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                    {new Date(selectedOrder.createdAt).toLocaleString("bn-BD")}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-xs">সর্বমোট মূল্য:</span>
                  <p className="font-black text-blue-600 dark:text-blue-400 text-base">
                    ৳{selectedOrder.totalPrice} ({selectedOrder.quantity} টি)
                  </p>
                </div>
              </div>

              {selectedOrder.orderNotes && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-xs border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-bold block mb-0.5">নোট:</span>
                  {selectedOrder.orderNotes}
                </div>
              )}

              {/* Status History Timeline */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div>
                  <span className="text-slate-400 text-[11px] font-bold block mb-2">স্ট্যাটাস ইতিহাস:</span>
                  <div className="space-y-1.5">
                    {[...selectedOrder.statusHistory].reverse().map((h, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <span className={`font-bold ${
                          STATUS_COLORS[h.status]?.includes("amber") ? "text-amber-600 dark:text-amber-400" :
                          STATUS_COLORS[h.status]?.includes("blue") ? "text-blue-600 dark:text-blue-400" :
                          STATUS_COLORS[h.status]?.includes("purple") ? "text-purple-600 dark:text-purple-400" :
                          STATUS_COLORS[h.status]?.includes("cyan") ? "text-cyan-600 dark:text-cyan-400" :
                          STATUS_COLORS[h.status]?.includes("emerald") ? "text-emerald-600 dark:text-emerald-400" :
                          STATUS_COLORS[h.status]?.includes("red") ? "text-red-600 dark:text-red-400" :
                          "text-slate-700 dark:text-slate-300"
                        }`}>{h.status}</span>
                        <span className="text-slate-400">
                          {h.changedAt ? new Date(h.changedAt).toLocaleString("bn-BD") : ""}
                        </span>
                        {h.changedBy && <span className="text-slate-500">— {h.changedBy}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
