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
    { page: 1, limit: 6 },
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
        router.push("/admin/login");
      }
    }
  }, [router]);

  const stats = statsData?.stats || {
    totalOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
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
    <div className="min-h-screen bg-[#05050b] text-white flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Header summary & Refresh */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              অ্যাডমিন <span className="text-gradient-gold">ওভারভিউ ড্যাশবোর্ড</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              রিয়েল-টাইম অর্ডার পরিসংখ্যান এবং বিক্রয় ট্রেন্ড অ্যানালিটিক্স
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                refetchStats();
                refetchOrders();
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 transition-all active:scale-95"
            >
              <RefreshCw size={14} className={isStatsLoading || isOrdersLoading ? "animate-spin" : ""} />
              রিফ্রেশ
            </button>
            <Link
              href="/admin/orders"
              className="btn-gold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5"
            >
              সকল অর্ডার দেখুন <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Revenue */}
          <div className="glass-card p-5 border border-yellow-500/20 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">মোট বিক্রয়</span>
              <div className="w-9 h-9 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ৳{stats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-[11px] text-yellow-400 font-medium mt-1">
                সর্বমোট বিক্রিত পণ্যের মূল্য
              </p>
            </div>
          </div>

          {/* Total Orders */}
          <div className="glass-card p-5 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">মোট অর্ডার</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <ShoppingBag size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {stats.totalOrders}
              </div>
              <p className="text-[11px] text-blue-400 font-medium mt-1">
                সর্বমোট সফলভাবে গৃহীত অর্ডার
              </p>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="glass-card p-5 border border-amber-500/20 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">পেন্ডিং অর্ডার</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                {stats.pendingOrders}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                যাচাই ও কনফার্মেশন প্রয়োজন
              </p>
            </div>
          </div>

          {/* Delivered Orders */}
          <div className="glass-card p-5 border border-emerald-500/20 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">সফল ডেলিভারি</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                {stats.deliveredOrders}
              </div>
              <p className="text-[11px] text-emerald-400/80 font-medium mt-1">
                ডেলিভারি রেট: {stats.deliveryRate}%
              </p>
            </div>
          </div>
        </div>

        {/* 7-Day Revenue & Orders Trend Chart */}
        <div className="glass-card p-6 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-yellow-400" /> গত ৭ দিনের বিক্রয় প্রবণতা
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">দৈনিক রেভিনিউ এবং অর্ডারের সংখ্যা</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                  <YAxis
                    yAxisId="left"
                    stroke="#eab308"
                    fontSize={11}
                    tickFormatter={(val) => `৳${val}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#00d4ff"
                    fontSize={11}
                    allowDecimals={false}
                    tickFormatter={(val) => `${val} টি`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d0d1e",
                      borderColor: "#eab30840",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === "বিক্রয়") return [`৳${Number(value).toLocaleString()}`, "দৈনিক বিক্রয়"];
                      if (name === "অর্ডার") return [`${value} টি`, "মোট অর্ডার"];
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
                    stroke="#eab308"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="বিক্রয়"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="অর্ডার"
                    fill="#00d4ff"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                    name="অর্ডার"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">
                পর্যাপ্ত ডাটা পাওয়া যায়নি
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="glass-card border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">সাম্প্রতিক অর্ডারসমূহ</h2>
              <p className="text-xs text-gray-400 mt-0.5">সর্বশেষ গৃহীত অর্ডারগুলোর সংক্ষিপ্ত তালিকা</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              সকল অর্ডার দেখুন <ChevronRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-white/5 text-gray-400 text-[11px] uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">অর্ডার আইডি</th>
                  <th className="py-3.5 px-4 font-semibold">গ্রাহকের নাম ও ফোন</th>
                  <th className="py-3.5 px-4 font-semibold">ঠিকানা</th>
                  <th className="py-3.5 px-4 font-semibold">পরিমাণ ও মূল্য</th>
                  <th className="py-3.5 px-4 font-semibold">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 font-semibold text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-200">
                {recentOrdersData?.orders && recentOrdersData.orders.length > 0 ? (
                  recentOrdersData.orders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-yellow-400">
                        {ord.orderId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{ord.customerName}</div>
                        <div className="text-xs text-gray-400 font-mono">{ord.phoneNumber}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-xs text-gray-300">
                        {ord.address}
                        {ord.district ? `, ${ord.district}` : ""}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white">৳{ord.totalPrice}</span>
                        <span className="text-xs text-gray-400 ml-1.5">({ord.quantity} টি)</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={ord.status}
                          disabled={isUpdating}
                          onChange={(e) => handleStatusChange(ord._id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border bg-black/60 focus:outline-none cursor-pointer ${
                            STATUS_COLORS[ord.status] || "border-white/10 text-white"
                          }`}
                        >
                          <option value="Pending" className="bg-[#0b0b1a] text-amber-400">Pending</option>
                          <option value="Confirmed" className="bg-[#0b0b1a] text-blue-400">Confirmed</option>
                          <option value="Processing" className="bg-[#0b0b1a] text-purple-400">Processing</option>
                          <option value="Shipped" className="bg-[#0b0b1a] text-cyan-400">Shipped</option>
                          <option value="Delivered" className="bg-[#0b0b1a] text-emerald-400">Delivered</option>
                          <option value="Cancelled" className="bg-[#0b0b1a] text-red-400">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all inline-flex items-center gap-1 text-xs"
                          title="বিস্তারিত দেখুন"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 text-xs">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 border border-white/20 shadow-2xl relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg bg-white/5"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ShoppingBag size={20} className="text-yellow-400" />
              অর্ডার বিবরণ — <span className="font-mono text-yellow-400">{selectedOrder.orderId}</span>
            </h3>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-2 bg-white/5 p-3 rounded-xl">
                <div>
                  <span className="text-gray-400 block text-[11px]">গ্রাহকের নাম:</span>
                  <span className="font-semibold text-white">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">ফোন নম্বর:</span>
                  <span className="font-mono font-semibold text-white">{selectedOrder.phoneNumber}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-400 block text-[11px]">ঠিকানা:</span>
                <p className="text-white mt-0.5">{selectedOrder.address}</p>
                {selectedOrder.district && (
                  <p className="text-gray-400 text-xs">জেলা: {selectedOrder.district}</p>
                )}
              </div>

              {selectedOrder.gpsCoordinates && selectedOrder.gpsCoordinates.lat && (
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-300 text-xs">
                    <MapPin size={15} />
                    <span>
                      GPS লোকেশন: {selectedOrder.gpsCoordinates.lat.toFixed(5)},{" "}
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

              <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                <div>
                  <span className="text-gray-400 text-xs">অর্ডার সময়:</span>
                  <p className="text-gray-300 text-xs">
                    {new Date(selectedOrder.createdAt).toLocaleString("bn-BD")}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 text-xs">সর্বমোট মূল্য:</span>
                  <p className="font-black text-yellow-400 text-base">
                    ৳{selectedOrder.totalPrice} ({selectedOrder.quantity} টি)
                  </p>
                </div>
              </div>

              {selectedOrder.orderNotes && (
                <div className="p-2.5 rounded-lg bg-white/5 text-gray-300 text-xs">
                  <span className="text-gray-400 font-semibold block mb-0.5">নোট:</span>
                  {selectedOrder.orderNotes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
