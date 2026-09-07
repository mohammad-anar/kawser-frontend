"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import {
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
  useExportOrdersCSVMutation,
  OrderData,
} from "@/lib/redux/api/orderApi";
import {
  Search,
  Download,
  Filter,
  RefreshCw,
  Eye,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminSocket } from "@/lib/useAdminSocket";

const STATUSES = [
  { key: "all", label: "সকল অর্ডার" },
  { key: "Pending", label: "পেন্ডিং" },
  { key: "Confirmed", label: "কনফার্মড" },
  { key: "Processing", label: "প্রসেসিং" },
  { key: "Shipped", label: "শিপড" },
  { key: "Delivered", label: "ডেলিভার্ড" },
  { key: "Cancelled", label: "বাতিল" },
];

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Processing: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Shipped: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  Delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // RTK Queries
  const {
    data: ordersData,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllOrdersQuery(
    {
      page: currentPage,
      limit: 15,
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: searchTerm || undefined,
    },
    { pollingInterval: 30000 }
  );

  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const [exportCSV, { isLoading: isExporting }] = useExportOrdersCSVMutation();

  // Real-time socket notification & automatic refetch
  useAdminSocket({
    onNewOrder: () => {
      refetch();
    },
    enableNotification: true,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("pc_token");
      if (!token) router.push("/admin/login");
    }
  }, [router]);

  const currentOrders = ordersData?.orders || [];
  const isAllSelected = currentOrders.length > 0 && currentOrders.every((o) => selectedIds.includes(o._id));
  const isSomeSelected = currentOrders.some((o) => selectedIds.includes(o._id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const currentIds = new Set(currentOrders.map((o) => o._id));
      setSelectedIds((prev) => prev.filter((id) => !currentIds.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...currentOrders.map((o) => o._id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchTerm(searchInput);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus({ id: orderId, status: newStatus }).unwrap();
      toast.success("অর্ডার স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে");
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "স্ট্যাটাস পরিবর্তন করতে ব্যর্থ হয়েছে।");
    }
  };

  const handleExportCSV = async (exportOnlySelected: boolean = false) => {
    try {
      const isCustomSelected = exportOnlySelected && selectedIds.length > 0;
      const csvString = await exportCSV({
        ids: isCustomSelected ? selectedIds : undefined,
        status: !isCustomSelected && statusFilter !== "all" ? statusFilter : undefined,
      }).unwrap();

      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const filename = isCustomSelected
        ? `selected-orders-${selectedIds.length}-${new Date().toISOString().slice(0, 10)}.csv`
        : `personalcarebd-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(
        isCustomSelected
          ? `${selectedIds.length} টি নির্বাচিত অর্ডারের CSV ফাইল ডাউনলোড সম্পন্ন হয়েছে!`
          : "সকল অর্ডারের CSV ফাইল ডাউনলোড সম্পন্ন হয়েছে!"
      );
    } catch (err) {
      toast.error("CSV এক্সপোর্ট করতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div className="min-h-screen bg-[#05050b] text-white flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              অর্ডার <span className="text-gradient-gold">ম্যানেজমেন্ট</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              গ্রাহকের অর্ডার পর্যালোচনা, চেকবক্স দিয়ে সিলেক্ট, স্ট্যাটাস পরিবর্তন এবং CSV এক্সপোর্ট করুন
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 transition-all active:scale-95"
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
              রিফ্রেশ
            </button>
            <button
              onClick={() => handleExportCSV(selectedIds.length > 0)}
              disabled={isExporting}
              className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                selectedIds.length > 0
                  ? "btn-gold"
                  : "bg-white/10 hover:bg-white/15 border-white/20 text-white"
              }`}
            >
              <Download size={14} />
              {isExporting
                ? "এক্সপোর্ট হচ্ছে..."
                : selectedIds.length > 0
                ? `সিলেক্টেড CSV (${selectedIds.length})`
                : "সকল CSV এক্সপোর্ট"}
            </button>
          </div>
        </div>

        {/* Selected Orders Action Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn shadow-lg shadow-yellow-500/5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-yellow-500 text-black font-black text-xs flex items-center justify-center shadow-md">
                {selectedIds.length}
              </span>
              <span className="text-xs sm:text-sm font-bold text-white">
                টি অর্ডার নির্বাচিত করা হয়েছে
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleExportCSV(true)}
                disabled={isExporting}
                className="btn-gold flex-1 sm:flex-initial text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold shadow-md shadow-yellow-500/20 active:scale-95"
              >
                <Download size={14} />
                {isExporting ? "এক্সপোর্ট হচ্ছে..." : `নির্বাচিত CSV ডাউনলোড (${selectedIds.length})`}
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs border border-white/10 transition-colors"
                title="সিলেকশন বাতিল"
              >
                বাতিল
              </button>
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="glass-card p-4 border border-white/10 space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {STATUSES.map((st) => (
              <button
                key={st.key}
                onClick={() => {
                  setStatusFilter(st.key);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === st.key
                    ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/20 font-bold"
                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="অর্ডার আইডি (PC-XXXX), গ্রাহকের নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
                className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-xs focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"
            >
              খুঁজুন
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearchTerm("");
                }}
                className="px-3 py-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white text-xs border border-white/10"
              >
                ক্লিয়ার
              </button>
            )}
          </form>
        </div>

        {/* Orders Table */}
        <div className="glass-card border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-white/5 text-gray-400 text-[11px] uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-yellow-500 bg-black/60 border-white/20 accent-yellow-500 cursor-pointer"
                      title="সব সিলেক্ট করুন"
                    />
                  </th>
                  <th className="py-3.5 px-4 font-semibold">অর্ডার আইডি</th>
                  <th className="py-3.5 px-4 font-semibold">তারিখ</th>
                  <th className="py-3.5 px-4 font-semibold">গ্রাহক ও মোবাইল</th>
                  <th className="py-3.5 px-4 font-semibold">ঠিকানা</th>
                  <th className="py-3.5 px-4 font-semibold">সাইজ ও পরিমাণ</th>
                  <th className="py-3.5 px-4 font-semibold">মোট মূল্য</th>
                  <th className="py-3.5 px-4 font-semibold">স্ট্যাটাস পরিবর্তন</th>
                  <th className="py-3.5 px-4 font-semibold text-right">বিস্তারিত</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-yellow-400 text-xs font-semibold">
                      লোড হচ্ছে...
                    </td>
                  </tr>
                ) : ordersData?.orders && ordersData.orders.length > 0 ? (
                  ordersData.orders.map((ord) => {
                    const isSelected = selectedIds.includes(ord._id);
                    return (
                      <tr
                        key={ord._id}
                        className={`transition-colors ${
                          isSelected
                            ? "bg-yellow-500/[0.08] hover:bg-yellow-500/[0.12]"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(ord._id)}
                            className="w-4 h-4 rounded text-yellow-500 bg-black/60 border-white/20 accent-yellow-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-yellow-400">
                          {ord.orderId}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(ord.createdAt).toLocaleDateString("bn-BD")}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{ord.customerName}</div>
                          <div className="text-xs text-gray-400 font-mono">{ord.phoneNumber}</div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-xs text-gray-300">
                          {ord.address}
                          {ord.district ? `, ${ord.district}` : ""}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="font-semibold text-white">{ord.quantity} টি</span>
                          {ord.size && <span className="text-gray-400 ml-1">({ord.size}")</span>}
                        </td>
                        <td className="py-3.5 px-4 font-black text-yellow-400">
                          ৳{ord.totalPrice}
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-500 text-xs">
                      কোনো অর্ডার পাওয়া যায়নি
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {ordersData && ordersData.pages > 1 && (
            <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
              <div>
                মোট {ordersData.total} টি অর্ডারের মধ্যে পৃষ্ঠা {ordersData.page} / {ordersData.pages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={currentPage >= ordersData.pages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Details Modal */}
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
