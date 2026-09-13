"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import {
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
  useUpdateOrderMutation,
  useSoftDeleteOrderMutation,
  useRestoreOrderMutation,
  usePermanentDeleteOrderMutation,
  useExportOrdersCSVMutation,
  OrderData,
} from "@/lib/redux/api/orderApi";
import {
  Search,
  Download,
  RefreshCw,
  Eye,
  Pencil,
  Save,
  Loader2,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  ShoppingBag,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Archive,
  Phone,
  Layers,
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
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [phoneFilter, setPhoneFilter] = useState<string>("");
  const [phoneInput, setPhoneInput] = useState<string>("");

  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingOrder, setEditingOrder] = useState<OrderData | null>(null);
  const [softDeleteTarget, setSoftDeleteTarget] = useState<OrderData | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<OrderData | null>(null);

  const [editForm, setEditForm] = useState({
    customerName: "",
    phoneNumber: "",
    email: "",
    address: "",
    district: "",
    thana: "",
    productName: "",
    quantity: 1,
    size: "স্ট্যান্ডার্ড",
    unitPrice: 899,
    deliveryCharge: 0,
    totalPrice: 899,
    paymentMethod: "Cash on Delivery",
    status: "Pending",
    orderNotes: "",
  });

  // RTK Queries: Active Orders
  const {
    data: activeOrdersData,
    isLoading: isActiveLoading,
    isFetching: isActiveFetching,
    refetch: refetchActive,
  } = useGetAllOrdersQuery(
    {
      page: activeTab === "active" ? currentPage : 1,
      limit: pageSize,
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: searchTerm || undefined,
      phone: phoneFilter || undefined,
      isDeleted: false,
    },
    { pollingInterval: 30000 }
  );

  // RTK Queries: Deleted Orders (Trash)
  const {
    data: deletedOrdersData,
    isLoading: isDeletedLoading,
    isFetching: isDeletedFetching,
    refetch: refetchDeleted,
  } = useGetAllOrdersQuery(
    {
      page: activeTab === "deleted" ? currentPage : 1,
      limit: pageSize,
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: searchTerm || undefined,
      phone: phoneFilter || undefined,
      isDeleted: true,
    },
    { pollingInterval: 30000 }
  );

  const currentOrdersData = activeTab === "active" ? activeOrdersData : deletedOrdersData;
  const isTableLoading = activeTab === "active" ? isActiveLoading : isDeletedLoading;
  const isTableFetching = activeTab === "active" ? isActiveFetching : isDeletedFetching;

  // Mutations
  const [updateOrderStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();
  const [updateOrder, { isLoading: isSavingOrder }] = useUpdateOrderMutation();
  const [softDeleteOrder, { isLoading: isSoftDeleting }] = useSoftDeleteOrderMutation();
  const [restoreOrder, { isLoading: isRestoring }] = useRestoreOrderMutation();
  const [permanentDeleteOrder, { isLoading: isPermanentDeleting }] = usePermanentDeleteOrderMutation();
  const [exportCSV, { isLoading: isExporting }] = useExportOrdersCSVMutation();

  // Real-time socket notification & automatic refetch
  useAdminSocket({
    onNewOrder: () => {
      refetchActive();
      refetchDeleted();
    },
    enableNotification: true,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("pc_token");
      if (!token) router.push("/admin/login");
    }
  }, [router]);

  const currentOrders = currentOrdersData?.orders || [];
  const isAllSelected = currentOrders.length > 0 && currentOrders.every((o) => selectedIds.includes(o._id));
  const isSomeSelected = currentOrders.some((o) => selectedIds.includes(o._id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const currentIdSet = new Set(currentOrders.map((o) => o._id));
      setSelectedIds((prev) => prev.filter((id) => !currentIdSet.has(id)));
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

  const handleTabChange = (tab: "active" | "deleted") => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchTerm(searchInput.trim());
    setPhoneFilter(phoneInput.trim());
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setPhoneInput("");
    setPhoneFilter("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus({ id: orderId, status: newStatus }).unwrap();
      toast.success("অর্ডার স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে");
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus as OrderData["status"] } : null));
      }
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "স্ট্যাটাস পরিবর্তন করতে ব্যর্থ হয়েছে।");
    }
  };

  const handleOpenEdit = (ord: OrderData) => {
    setEditingOrder(ord);
    setEditForm({
      customerName: ord.customerName || "",
      phoneNumber: ord.phoneNumber || "",
      email: ord.email || "",
      address: ord.address || "",
      district: ord.district || "",
      thana: ord.thana || "",
      productName: ord.productName || "চীন ড্রাগন সিলিকন ম্যাজিক কনডম (Top Notch Reusable)",
      quantity: ord.quantity || 1,
      size: ord.size || "স্ট্যান্ডার্ড",
      unitPrice: ord.unitPrice || 899,
      deliveryCharge: ord.deliveryCharge || 0,
      totalPrice: ord.totalPrice || 899,
      paymentMethod: ord.paymentMethod || "Cash on Delivery",
      status: ord.status || "Pending",
      orderNotes: ord.orderNotes || "",
    });
  };

  const handleQuantityChange = (qty: number) => {
    const newQty = Math.max(1, qty);
    setEditForm((prev) => ({
      ...prev,
      quantity: newQty,
      totalPrice: prev.unitPrice * newQty + prev.deliveryCharge,
    }));
  };

  const handleUnitPriceChange = (price: number) => {
    setEditForm((prev) => ({
      ...prev,
      unitPrice: price,
      totalPrice: price * prev.quantity + prev.deliveryCharge,
    }));
  };

  const handleDeliveryChargeChange = (charge: number) => {
    setEditForm((prev) => ({
      ...prev,
      deliveryCharge: charge,
      totalPrice: prev.unitPrice * prev.quantity + charge,
    }));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    if (!editForm.customerName.trim()) {
      toast.error("গ্রাহকের নাম আবশ্যক");
      return;
    }
    if (!editForm.phoneNumber.trim()) {
      toast.error("ফোন নম্বর আবশ্যক");
      return;
    }
    if (!editForm.address.trim()) {
      toast.error("ঠিকানা আবশ্যক");
      return;
    }

    try {
      const res = await updateOrder({
        id: editingOrder._id,
        customerName: editForm.customerName,
        phoneNumber: editForm.phoneNumber,
        email: editForm.email,
        address: editForm.address,
        district: editForm.district,
        thana: editForm.thana,
        productName: editForm.productName,
        quantity: Number(editForm.quantity),
        size: editForm.size,
        unitPrice: Number(editForm.unitPrice),
        deliveryCharge: Number(editForm.deliveryCharge),
        totalPrice: Number(editForm.totalPrice),
        paymentMethod: editForm.paymentMethod,
        status: editForm.status,
        orderNotes: editForm.orderNotes,
      }).unwrap();

      toast.success("অর্ডার সফলভাবে আপডেট করা হয়েছে!");
      if (selectedOrder && selectedOrder._id === editingOrder._id && res.order) {
        setSelectedOrder(res.order);
      }
      setEditingOrder(null);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "অর্ডার আপডেট করতে সমস্যা হয়েছে");
    }
  };

  const handleSoftDelete = async () => {
    if (!softDeleteTarget) return;
    try {
      await softDeleteOrder(softDeleteTarget._id).unwrap();
      toast.success(`অর্ডার ${softDeleteTarget.orderId} ট্র্যাশে সরানো হয়েছে`);
      if (selectedOrder && selectedOrder._id === softDeleteTarget._id) {
        setSelectedOrder(null);
      }
      setSoftDeleteTarget(null);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "অর্ডার ডিলিট করতে সমস্যা হয়েছে");
    }
  };

  const handleRestore = async (order: OrderData) => {
    try {
      await restoreOrder(order._id).unwrap();
      toast.success(`অর্ডার ${order.orderId} সফলভাবে পুনরুদ্ধার করা হয়েছে!`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "অর্ডার পুনরুদ্ধার করতে ব্যর্থ হয়েছে");
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteTarget) return;
    try {
      await permanentDeleteOrder(permanentDeleteTarget._id).unwrap();
      toast.success(`অর্ডার ${permanentDeleteTarget.orderId} স্থায়ীভাবে মুছে ফেলা হয়েছে!`);
      if (selectedOrder && selectedOrder._id === permanentDeleteTarget._id) {
        setSelectedOrder(null);
      }
      setPermanentDeleteTarget(null);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "স্থায়ীভাবে ডিলিট করতে সমস্যা হয়েছে");
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
        : `selfcaresolution-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(
        isCustomSelected
          ? `${selectedIds.length} টি নির্বাচিত অর্ডারের CSV ফাইল ডাউনলোড সম্পন্ন হয়েছে!`
          : "সকল অর্ডারের CSV ফাইল ডাউনলোড সম্পন্ন হয়েছে!"
      );
    } catch {
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
              গ্রাহকের অর্ডার পর্যালোচনা, এডিট, সফট ডিলিট, ট্র্যাশ ও CSV এক্সপোর্ট করুন
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                refetchActive();
                refetchDeleted();
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 transition-all active:scale-95"
            >
              <RefreshCw size={14} className={isTableFetching ? "animate-spin" : ""} />
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

        {/* Tab Switcher: Active vs Deleted */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => handleTabChange("active")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "active"
                ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20"
                : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10"
            }`}
          >
            <Layers size={15} />
            <span>সক্রিয় অর্ডার</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === "active" ? "bg-black/20 text-black" : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {activeOrdersData?.total ?? 0}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("deleted")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "deleted"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10"
            }`}
          >
            <Trash2 size={15} />
            <span>ডিলিটকৃত অর্ডার (ট্র্যাশ)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === "deleted" ? "bg-black/30 text-white" : "bg-red-500/20 text-red-400"
              }`}
            >
              {deletedOrdersData?.total ?? 0}
            </span>
          </button>
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

        {/* Filters & Search Bar */}
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

          {/* Search Inputs & Page Size Controls */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
            {/* General Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="অর্ডার আইডি (PC-XXXX) বা গ্রাহকের নাম..."
                className="w-full pl-9 pr-3 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-xs focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>

            {/* Phone Number Filter */}
            <div className="relative flex-1">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="মোবাইল নম্বর দিয়ে খুঁজুন (017...)..."
                className="w-full pl-9 pr-3 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 font-mono text-xs focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-3 py-2 shrink-0">
              <span className="text-[11px] text-gray-400 whitespace-nowrap">প্রতি পেজে:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="bg-transparent text-yellow-400 font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value={10} className="bg-[#0b0b18] text-white">10 টি</option>
                <option value={20} className="bg-[#0b0b18] text-white">20 টি</option>
                <option value={30} className="bg-[#0b0b18] text-white">30 টি</option>
                <option value={50} className="bg-[#0b0b18] text-white">50 টি</option>
                <option value={100} className="bg-[#0b0b18] text-white">100 টি</option>
              </select>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-yellow-500/10 active:scale-95"
              >
                ফিল্টার করুন
              </button>
              {(searchTerm || phoneFilter || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3 py-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white text-xs border border-white/10 transition-colors active:scale-95"
                >
                  ক্লিয়ার
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Deleted Orders Banner Notice */}
        {activeTab === "deleted" && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-300 text-xs">
            <Archive size={20} className="text-red-400 shrink-0" />
            <div>
              <span className="font-bold text-white block text-sm mb-0.5">ডিলিটকৃত অর্ডার সংগ্রহশালা (রিসাইকেল বিন)</span>
              এই অর্ডারের তথ্য গ্রাহক ও ড্যাশবোর্ড রিপোর্ট থেকে আলাদা রয়েছে। আপনি যেকোনো সময় অর্ডার সক্রিয় তালিকায় পুনরুদ্ধার করতে পারেন অথবা স্থায়ীভাবে মুছে ফেলতে পারেন।
            </div>
          </div>
        )}

        {/* Orders Table Container */}
        <div className="glass-card border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-white/5 text-gray-400 text-[11px] uppercase tracking-wider border-b border-white/10">
                <tr>
                  {activeTab === "active" && (
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
                  )}
                  <th className="py-3.5 px-4 font-semibold">অর্ডার আইডি</th>
                  <th className="py-3.5 px-4 font-semibold">
                    {activeTab === "active" ? "তারিখ" : "ডিলিট তারিখ"}
                  </th>
                  <th className="py-3.5 px-4 font-semibold">গ্রাহক ও মোবাইল</th>
                  <th className="py-3.5 px-4 font-semibold">ঠিকানা</th>
                  <th className="py-3.5 px-4 font-semibold">সাইজ ও পরিমাণ</th>
                  <th className="py-3.5 px-4 font-semibold">মোট মূল্য</th>
                  <th className="py-3.5 px-4 font-semibold">
                    {activeTab === "active" ? "স্ট্যাটাস পরিবর্তন" : "পূর্ববর্তী স্ট্যাটাস"}
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-200">
                {isTableLoading ? (
                  <tr>
                    <td colSpan={activeTab === "active" ? 9 : 8} className="py-12 text-center text-yellow-400 text-xs font-semibold">
                      লোড হচ্ছে...
                    </td>
                  </tr>
                ) : currentOrders && currentOrders.length > 0 ? (
                  currentOrders.map((ord) => {
                    const isSelected = selectedIds.includes(ord._id);
                    return (
                      <tr
                        key={ord._id}
                        className={`transition-colors ${
                          isSelected
                            ? "bg-yellow-500/[0.08] hover:bg-yellow-500/[0.12]"
                            : activeTab === "deleted"
                            ? "hover:bg-red-500/[0.04]"
                            : "hover:bg-white/5"
                        }`}
                      >
                        {activeTab === "active" && (
                          <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(ord._id)}
                              className="w-4 h-4 rounded text-yellow-500 bg-black/60 border-white/20 accent-yellow-500 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="py-3.5 px-4 font-mono font-bold text-yellow-400">
                          {ord.orderId}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-400 whitespace-nowrap">
                          {activeTab === "active"
                            ? new Date(ord.createdAt).toLocaleDateString("bn-BD")
                            : ord.deletedAt
                            ? new Date(ord.deletedAt).toLocaleString("bn-BD")
                            : new Date(ord.createdAt).toLocaleDateString("bn-BD")}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{ord.customerName}</div>
                          <div className="text-xs text-gray-400 font-mono">{ord.phoneNumber}</div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-xs text-gray-300">
                          {ord.address}
                          {ord.district ? `, ${ord.district}` : ""}
                          {ord.thana ? ` (${ord.thana})` : ""}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="font-semibold text-white">{ord.quantity} টি</span>
                          {ord.size && <span className="text-gray-400 ml-1">({ord.size})</span>}
                        </td>
                        <td className="py-3.5 px-4 font-black text-yellow-400">
                          ৳{ord.totalPrice}
                        </td>

                        {/* Status Column */}
                        <td className="py-3.5 px-4">
                          {activeTab === "active" ? (
                            <select
                              value={ord.status}
                              disabled={isUpdatingStatus}
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
                          ) : (
                            <span
                              className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                                STATUS_COLORS[ord.status] || "border-white/10 text-white"
                              }`}
                            >
                              {ord.status}
                            </span>
                          )}
                        </td>

                        {/* Action Column */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {activeTab === "active" ? (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(ord)}
                                  className="p-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 border border-yellow-500/30 transition-all inline-flex items-center gap-1 text-xs shadow-sm active:scale-95"
                                  title="অর্ডার এডিট করুন"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => setSelectedOrder(ord)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all inline-flex items-center gap-1 text-xs active:scale-95"
                                  title="বিস্তারিত দেখুন"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  onClick={() => setSoftDeleteTarget(ord)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 transition-all inline-flex items-center gap-1 text-xs active:scale-95"
                                  title="অর্ডার ট্র্যাশে পাঠান (Soft Delete)"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleRestore(ord)}
                                  disabled={isRestoring}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition-all inline-flex items-center gap-1 text-xs font-semibold active:scale-95"
                                  title="পুনরুদ্ধার করুন"
                                >
                                  <RotateCcw size={13} />
                                  <span>পুনরুদ্ধার</span>
                                </button>
                                <button
                                  onClick={() => setSelectedOrder(ord)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all inline-flex items-center gap-1 text-xs active:scale-95"
                                  title="বিস্তারিত দেখুন"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  onClick={() => setPermanentDeleteTarget(ord)}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 transition-all inline-flex items-center gap-1 text-xs font-semibold active:scale-95"
                                  title="স্থায়ীভাবে মুছে ফেলুন (Permanent Delete)"
                                >
                                  <Trash2 size={13} />
                                  <span>স্থায়ী ডিলিট</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={activeTab === "active" ? 9 : 8}
                      className="py-12 text-center text-gray-500 text-xs"
                    >
                      {activeTab === "active"
                        ? "কোনো সক্রিয় অর্ডার পাওয়া যায়নি"
                        : "ট্র্যাশে কোনো ডিলিটকৃত অর্ডার নেই"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination & Page Size Footer */}
          <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-3">
              <span>
                মোট {currentOrdersData?.total || 0} টি অর্ডারের মধ্যে পৃষ্ঠা{" "}
                <span className="text-white font-bold">{currentOrdersData?.page || 1}</span> /{" "}
                {currentOrdersData?.pages || 1}
              </span>
              <span className="text-gray-600">|</span>
              <div className="flex items-center gap-1.5">
                <span>প্রতি পেজে:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-yellow-400 font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value={10}>10 টি</option>
                  <option value={20}>20 টি</option>
                  <option value={30}>30 টি</option>
                  <option value={50}>50 টি</option>
                  <option value={100}>100 টি</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="পূর্ববর্তী পৃষ্ঠা"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 py-1 text-xs font-semibold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                পৃষ্ঠা {currentPage}
              </span>
              <button
                disabled={!currentOrdersData || currentPage >= currentOrdersData.pages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="পরবর্তী পৃষ্ঠা"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
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
              {selectedOrder.isDeleted && (
                <span className="text-[11px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-semibold">
                  ট্র্যাশড
                </span>
              )}
            </h3>

            <div className="space-y-3.5 text-xs sm:text-sm max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2 bg-white/5 p-3 rounded-xl">
                <div>
                  <span className="text-gray-400 block text-[11px]">গ্রাহকের নাম:</span>
                  <span className="font-semibold text-white">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">ফোন নম্বর:</span>
                  <span className="font-mono font-semibold text-white">{selectedOrder.phoneNumber}</span>
                </div>
                {selectedOrder.email && (
                  <div className="col-span-2">
                    <span className="text-gray-400 block text-[11px]">ইমেইল:</span>
                    <span className="font-semibold text-white">{selectedOrder.email}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-gray-400 block text-[11px]">ঠিকানা:</span>
                <p className="text-white mt-0.5">{selectedOrder.address}</p>
                {selectedOrder.district && (
                  <p className="text-gray-400 text-xs">জেলা: {selectedOrder.district}</p>
                )}
                {selectedOrder.thana && (
                  <p className="text-gray-400 text-xs">থানা: {selectedOrder.thana}</p>
                )}
              </div>

              {selectedOrder.gpsCoordinates && selectedOrder.gpsCoordinates.lat && (
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-300 text-xs">
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

              <div className="grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-xl text-center">
                <div>
                  <span className="text-gray-400 block text-[11px]">পণ্য</span>
                  <span className="font-semibold text-white text-xs">{selectedOrder.quantity} টি</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">সাইজ</span>
                  <span className="font-semibold text-white text-xs">{selectedOrder.size || "স্ট্যান্ডার্ড"}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">পেমেন্ট</span>
                  <span className="font-semibold text-green-400 text-xs">{selectedOrder.paymentMethod}</span>
                </div>
              </div>

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

              {/* Status History Timeline */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div>
                  <span className="text-gray-400 text-[11px] font-semibold block mb-2">স্ট্যাটাস ইতিহাস:</span>
                  <div className="space-y-1.5">
                    {[...selectedOrder.statusHistory].reverse().map((h, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                        <span
                          className={`font-semibold ${
                            STATUS_COLORS[h.status]?.includes("amber")
                              ? "text-amber-400"
                              : STATUS_COLORS[h.status]?.includes("blue")
                              ? "text-blue-400"
                              : STATUS_COLORS[h.status]?.includes("purple")
                              ? "text-purple-400"
                              : STATUS_COLORS[h.status]?.includes("cyan")
                              ? "text-cyan-400"
                              : STATUS_COLORS[h.status]?.includes("emerald")
                              ? "text-emerald-400"
                              : STATUS_COLORS[h.status]?.includes("red")
                              ? "text-red-400"
                              : "text-gray-300"
                          }`}
                        >
                          {h.status}
                        </span>
                        <span className="text-gray-500">
                          {h.changedAt ? new Date(h.changedAt).toLocaleString("bn-BD") : ""}
                        </span>
                        {h.changedBy && <span className="text-gray-600">— {h.changedBy}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="glass-card max-w-2xl w-full p-5 sm:p-6 border border-yellow-500/30 shadow-2xl relative rounded-2xl bg-[#0b0b18]/95 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    অর্ডার সম্পাদনা — <span className="font-mono text-yellow-400">{editingOrder.orderId}</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    অর্ডারের তথ্য পরিবর্তন করে সংরক্ষণ করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                title="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto pr-1 py-4 space-y-4 text-xs sm:text-sm">
              {/* Customer Information */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  গ্রাহকের তথ্য
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">
                      গ্রাহকের নাম <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.customerName}
                      onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">
                      মোবাইল নম্বর <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.phoneNumber}
                      onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-gray-400 mb-1">ইমেইল (ঐচ্ছিক)</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  ডেলিভারি ঠিকানা
                </h4>
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">
                    সম্পূর্ণ ঠিকানা <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-yellow-500 resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">জেলা</label>
                    <input
                      type="text"
                      value={editForm.district}
                      onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                      placeholder="যেমন: ঢাকা"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">থানা / উপজেলা</label>
                    <input
                      type="text"
                      value={editForm.thana}
                      onChange={(e) => setEditForm({ ...editForm, thana: e.target.value })}
                      placeholder="যেমন: মিরপুর"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>
              </div>

              {/* Product, Pricing & Quantity */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  পণ্য ও মূল্য বিবরণী
                </h4>
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">পণ্যের নাম</label>
                  <input
                    type="text"
                    value={editForm.productName}
                    onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">সাইজ</label>
                    <select
                      value={editForm.size}
                      onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-yellow-500"
                    >
                      <option value="স্ট্যান্ডার্ড" className="bg-[#0b0b18]">স্ট্যান্ডার্ড</option>
                      <option value="মিডিয়াম (52mm)" className="bg-[#0b0b18]">মিডিয়াম (52mm)</option>
                      <option value="লার্জ (56mm)" className="bg-[#0b0b18]">লার্জ (56mm)</option>
                      <option value="এক্সট্রা লার্জ" className="bg-[#0b0b18]">এক্সট্রা লার্জ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">পরিমাণ (টি)</label>
                    <input
                      type="number"
                      min={1}
                      value={editForm.quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">প্রতি পিসের মূল্য (৳)</label>
                    <input
                      type="number"
                      min={0}
                      value={editForm.unitPrice}
                      onChange={(e) => handleUnitPriceChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">ডেলিভারি চার্জ (৳)</label>
                    <input
                      type="number"
                      min={0}
                      value={editForm.deliveryCharge}
                      onChange={(e) => handleDeliveryChargeChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">
                      সর্বমোট মূল্য (৳)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editForm.totalPrice}
                      onChange={(e) => setEditForm({ ...editForm, totalPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-black/60 border border-yellow-500/50 rounded-lg text-yellow-400 font-bold text-xs focus:outline-none focus:border-yellow-400"
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      হিসাব: ৳{editForm.unitPrice} × {editForm.quantity} + ৳{editForm.deliveryCharge} = ৳{editForm.unitPrice * editForm.quantity + editForm.deliveryCharge}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Payment Method */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  স্ট্যাটাস ও পেমেন্ট
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">অর্ডার স্ট্যাটাস</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className={`w-full px-3 py-2 bg-black/60 border rounded-lg text-xs font-semibold focus:outline-none ${
                        STATUS_COLORS[editForm.status] || "border-white/10 text-white"
                      }`}
                    >
                      <option value="Pending" className="bg-[#0b0b18] text-amber-400">Pending</option>
                      <option value="Confirmed" className="bg-[#0b0b18] text-blue-400">Confirmed</option>
                      <option value="Processing" className="bg-[#0b0b18] text-purple-400">Processing</option>
                      <option value="Shipped" className="bg-[#0b0b18] text-cyan-400">Shipped</option>
                      <option value="Delivered" className="bg-[#0b0b18] text-emerald-400">Delivered</option>
                      <option value="Cancelled" className="bg-[#0b0b18] text-red-400">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">পেমেন্ট মেথড</label>
                    <select
                      value={editForm.paymentMethod}
                      onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-yellow-500"
                    >
                      <option value="Cash on Delivery" className="bg-[#0b0b18]">Cash on Delivery</option>
                      <option value="bKash" className="bg-[#0b0b18]">bKash</option>
                      <option value="Nagad" className="bg-[#0b0b18]">Nagad</option>
                      <option value="Rocket" className="bg-[#0b0b18]">Rocket</option>
                      <option value="Bank Transfer" className="bg-[#0b0b18]">Bank Transfer</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                <label className="block text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  অর্ডার নোট / মন্তব্য
                </label>
                <textarea
                  rows={2}
                  value={editForm.orderNotes}
                  onChange={(e) => setEditForm({ ...editForm, orderNotes: e.target.value })}
                  placeholder="অর্ডার সংক্রান্ত বিশেষ তথ্য বা কাস্টমার নোট..."
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-yellow-500 resize-none"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  disabled={isSavingOrder}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs border border-white/10 font-semibold transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingOrder}
                  className="btn-gold text-xs px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-yellow-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isSavingOrder ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      সংরক্ষণ হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      আপডেট সংরক্ষণ করুন
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Soft Delete Confirmation Modal */}
      {softDeleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 border border-red-500/30 shadow-2xl relative rounded-2xl bg-[#0e070c]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">অর্ডার ট্র্যাশে পাঠাবেন?</h3>
                <p className="text-xs text-gray-400 font-mono">অর্ডার আইডি: {softDeleteTarget.orderId}</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 mb-6 leading-relaxed">
              এই অর্ডারটি সক্রিয় তালিকা থেকে সরিয়ে <strong>ডিলিটকৃত অর্ডার (ট্র্যাশ)</strong> ট্যাবে রাখা হবে। আপনি পরবর্তীতে চাইলে যেকোনো সময় এটি পুনরুদ্ধার বা স্থায়ীভাবে মুছে ফেলতে পারবেন।
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSoftDeleteTarget(null)}
                disabled={isSoftDeleting}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs border border-white/10 font-semibold transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSoftDelete}
                disabled={isSoftDeleting}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSoftDeleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    ডিলিট হচ্ছে...
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    হ্যাঁ, ট্র্যাশে পাঠান
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {permanentDeleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 border border-red-600/50 shadow-2xl relative rounded-2xl bg-[#140508]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-600/25 border border-red-500/50 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-400">স্থায়ীভাবে মুছে ফেলা নিশ্চিতকরণ</h3>
                <p className="text-xs text-gray-400 font-mono">অর্ডার আইডি: {permanentDeleteTarget.orderId}</p>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-6">
              <p className="text-xs text-red-300 leading-relaxed font-semibold">
                সতর্কতা: এটি স্থায়ীভাবে ডেটাবেস থেকে মুছে ফেলা হবে। এই কাজটি আর ফিরিয়ে নেওয়া বা পুনরুদ্ধার করা সম্ভব হবে না!
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPermanentDeleteTarget(null)}
                disabled={isPermanentDeleting}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs border border-white/10 font-semibold transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handlePermanentDelete}
                disabled={isPermanentDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-all shadow-lg shadow-red-600/30 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isPermanentDeleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    চিরতরে মুছছে...
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    চিরতরে মুছে ফেলুন
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
