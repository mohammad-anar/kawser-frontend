"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import ManualOrderModal from "@/components/ManualOrderModal";
import SteadfastLabelPrinterModal, { SteadfastLabelItem } from "@/components/SteadfastLabelPrinterModal";
import {
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
  useUpdateOrderMutation,
  useSoftDeleteOrderMutation,
  useRestoreOrderMutation,
  usePermanentDeleteOrderMutation,
  useExportOrdersExcelMutation,
  OrderData,
  IncompleteOrderData,
  useGetBlockedIpsQuery,
  useGetBlockedEntitiesQuery,
  useBlockEntityMutation,
  useUnblockEntityMutation,
  useBlockAllEntitiesMutation,
  useUnblockAllEntitiesMutation,
  useBlockIpMutation,
  useUnblockIpMutation,
  useBulkUpdateOrderStatusMutation,
  useGetIncompleteOrdersQuery,
  useUpdateIncompleteOrderStatusMutation,
  useConvertIncompleteOrderMutation,
  useDeleteIncompleteOrderMutation,
  useSendOrderToSteadfastMutation,
  useSendBulkOrdersToSteadfastMutation,
  useLazyCheckSteadfastStatusQuery,
  useLazyCheckFraudScoreQuery,
  useGetSteadfastConfigStatusQuery,
  FraudScoreResponse,
} from "@/lib/redux/api/orderApi";
import {
  Search,
  Download,
  RefreshCw,
  Plus,
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
  ShieldBan,
  ShieldCheck,
  ShieldAlert,
  Clock,
  PackageCheck,
  Check,
  PhoneCall,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Truck,
  Copy,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminSocket } from "@/lib/useAdminSocket";

const STATUSES = [
  { key: "all", label: "সকল অর্ডার" },
  { key: "Pending", label: "পেন্ডিং" },
  { key: "Confirmed", label: "কনফার্মড" },
  { key: "Scheduled", label: "শিডিউলড" },
  { key: "Processing", label: "প্রসেসিং" },
  { key: "Hold", label: "হোল্ড" },
  { key: "Shipped", label: "শিপড" },
  { key: "Delivered", label: "ডেলিভার্ড" },
  { key: "Cancelled", label: "বাতিল" },
];

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Scheduled: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  Processing: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Hold: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  Shipped: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  Delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"active" | "incomplete" | "deleted">("active");
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
  const [blockIpTarget, setBlockIpTarget] = useState<OrderData | null>(null);
  const [blockReason, setBlockReason] = useState<string>("স্প্যাম / অযাচিত অর্ডার");
  const [isManualOrderOpen, setIsManualOrderOpen] = useState<boolean>(false);
  const [openBlockDropdownOrderId, setOpenBlockDropdownOrderId] = useState<string | null>(null);
  const [bulkStatusTarget, setBulkStatusTarget] = useState<string | null>(null);

  // Incomplete Orders State
  const [convertingTarget, setConvertingTarget] = useState<IncompleteOrderData | null>(null);
  const [deleteIncTarget, setDeleteIncTarget] = useState<IncompleteOrderData | null>(null);
  const [convertForm, setConvertForm] = useState({
    customerName: "",
    phoneNumber: "",
    address: "",
    district: "",
    thana: "",
    productName: "Love Lock Condom / Magic Condom",
    quantity: 1,
    size: "স্ট্যান্ডার্ড",
    unitPrice: 950,
    deliveryCharge: 0,
    totalPrice: 950,
    paymentMethod: "Cash on Delivery",
    orderNotes: "",
  });

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
    unitPrice: 950,
    deliveryCharge: 0,
    totalPrice: 950,
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

  // RTK Queries: Incomplete Orders (Abandoned)
  const {
    data: incompleteOrdersData,
    isLoading: isIncompleteLoading,
    isFetching: isIncompleteFetching,
    refetch: refetchIncomplete,
  } = useGetIncompleteOrdersQuery(
    {
      page: activeTab === "incomplete" ? currentPage : 1,
      limit: pageSize,
      search: searchTerm || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    },
    { pollingInterval: 30000 }
  );

  const currentOrdersData = activeTab === "active" ? activeOrdersData : deletedOrdersData;
  const isTableLoading =
    activeTab === "active"
      ? isActiveLoading
      : activeTab === "incomplete"
      ? isIncompleteLoading
      : isDeletedLoading;
  const isTableFetching =
    activeTab === "active"
      ? isActiveFetching
      : activeTab === "incomplete"
      ? isIncompleteFetching
      : isDeletedFetching;

  // Mutations
  const [updateOrderStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();
  const [updateOrder, { isLoading: isSavingOrder }] = useUpdateOrderMutation();
  const [softDeleteOrder, { isLoading: isSoftDeleting }] = useSoftDeleteOrderMutation();
  const [restoreOrder, { isLoading: isRestoring }] = useRestoreOrderMutation();
  const [permanentDeleteOrder, { isLoading: isPermanentDeleting }] = usePermanentDeleteOrderMutation();
  const [exportExcel, { isLoading: isExporting }] = useExportOrdersExcelMutation();
  const [blockIpMutation, { isLoading: isBlockingIp }] = useBlockIpMutation();
  const [unblockIpMutation, { isLoading: isUnblockingIp }] = useUnblockIpMutation();
  const [blockEntityMutation, { isLoading: isBlockingEntity }] = useBlockEntityMutation();
  const [unblockEntityMutation, { isLoading: isUnblockingEntity }] = useUnblockEntityMutation();
  const [blockAllEntitiesMutation, { isLoading: isBlockingAll }] = useBlockAllEntitiesMutation();
  const [unblockAllEntitiesMutation, { isLoading: isUnblockingAll }] = useUnblockAllEntitiesMutation();
  const [bulkUpdateOrderStatus, { isLoading: isBulkUpdatingStatus }] = useBulkUpdateOrderStatusMutation();
  const [updateIncompleteStatus, { isLoading: isUpdatingIncStatus }] = useUpdateIncompleteOrderStatusMutation();
  const [convertIncompleteOrder, { isLoading: isConvertingInc }] = useConvertIncompleteOrderMutation();
  const [deleteIncompleteOrderMutation, { isLoading: isDeletingInc }] = useDeleteIncompleteOrderMutation();
  const { data: blockedEntitiesData } = useGetBlockedEntitiesQuery();

  const blockedEntitiesList = blockedEntitiesData?.entities || [];
  const blockedIpSet = useMemo(() => new Set(blockedEntitiesList.filter((e) => e.type === "ip").map((e) => e.value)), [blockedEntitiesList]);
  const blockedPhoneSet = useMemo(() => new Set(blockedEntitiesList.filter((e) => e.type === "phone").map((e) => e.value)), [blockedEntitiesList]);
  const blockedDeviceSet = useMemo(() => new Set(blockedEntitiesList.filter((e) => e.type === "device").map((e) => e.value)), [blockedEntitiesList]);

  // Steadfast Courier States & Hooks
  const [sendOrderToSteadfast, { isLoading: isSendingSingleSteadfast }] = useSendOrderToSteadfastMutation();
  const [sendBulkOrdersToSteadfast, { isLoading: isSendingBulkSteadfast }] = useSendBulkOrdersToSteadfastMutation();
  const [triggerCheckStatus] = useLazyCheckSteadfastStatusQuery();
  const [triggerCheckFraud, { isFetching: isCheckingFraud }] = useLazyCheckFraudScoreQuery();
  const { data: sfConfig } = useGetSteadfastConfigStatusQuery();

  const [sendingOrderId, setSendingOrderId] = useState<string | null>(null);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [fraudModalPhone, setFraudModalPhone] = useState<string | null>(null);
  const [fraudData, setFraudData] = useState<FraudScoreResponse | { error?: string } | null>(null);
  const [bulkSteadfastConfirmOpen, setBulkSteadfastConfirmOpen] = useState<boolean>(false);
  const [isLabelPrinterOpen, setIsLabelPrinterOpen] = useState<boolean>(false);
  const [labelPrinterIncoming, setLabelPrinterIncoming] = useState<SteadfastLabelItem[]>([]);

  // Real-time socket notification & automatic refetch
  useAdminSocket({
    onNewOrder: () => {
      refetchActive();
      refetchDeleted();
      refetchIncomplete();
    },
    enableNotification: true,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("pc_token");
      if (!token) router.push("/login");
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

  const handleTabChange = (tab: "active" | "incomplete" | "deleted") => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleOpenConvert = (inc: IncompleteOrderData) => {
    setConvertingTarget(inc);
    const qty = inc.quantity || 1;
    const unitPrice = inc.unitPrice || 950;
    const delivery = 0;
    setConvertForm({
      customerName: inc.customerName || "",
      phoneNumber: inc.phoneNumber || "",
      address: inc.address || "",
      district: "",
      thana: "",
      productName: inc.productName || "চীন ড্রাগন সিলিকন ম্যাজিক কনডম (Top Notch Reusable)",
      quantity: qty,
      size: inc.size || "স্ট্যান্ডার্ড",
      unitPrice: unitPrice,
      deliveryCharge: delivery,
      totalPrice: unitPrice * qty + delivery,
      paymentMethod: "Cash on Delivery",
      orderNotes: inc.orderNotes || "",
    });
  };

  const handleConvertQtyChange = (qty: number) => {
    const newQty = Math.max(1, qty);
    setConvertForm((prev) => ({
      ...prev,
      quantity: newQty,
      totalPrice: prev.unitPrice * newQty + prev.deliveryCharge,
    }));
  };

  const handleConvertUnitPriceChange = (price: number) => {
    setConvertForm((prev) => ({
      ...prev,
      unitPrice: price,
      totalPrice: price * prev.quantity + prev.deliveryCharge,
    }));
  };

  const handleConvertDeliveryChargeChange = (charge: number) => {
    setConvertForm((prev) => ({
      ...prev,
      deliveryCharge: charge,
      totalPrice: prev.unitPrice * prev.quantity + charge,
    }));
  };

  const handleConfirmConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingTarget) return;

    if (!convertForm.customerName.trim()) {
      toast.error("গ্রাহকের নাম আবশ্যক");
      return;
    }
    if (!convertForm.phoneNumber.trim()) {
      toast.error("ফোন নম্বর আবশ্যক");
      return;
    }
    if (!convertForm.address.trim()) {
      toast.error("ডেলিভারি ঠিকানা আবশ্যক");
      return;
    }

    try {
      const res = await convertIncompleteOrder({
        id: convertingTarget._id,
        customerName: convertForm.customerName.trim(),
        phoneNumber: convertForm.phoneNumber.trim(),
        address: convertForm.address.trim(),
        district: convertForm.district.trim(),
        thana: convertForm.thana.trim(),
        productName: convertForm.productName,
        quantity: Number(convertForm.quantity),
        size: convertForm.size,
        unitPrice: Number(convertForm.unitPrice),
        deliveryCharge: Number(convertForm.deliveryCharge),
        totalPrice: Number(convertForm.totalPrice),
        paymentMethod: convertForm.paymentMethod,
        orderNotes: convertForm.orderNotes,
      }).unwrap();

      toast.success(res.message || "অসম্পূর্ণ অর্ডারটি সফলভাবে মূল অর্ডারে রূপান্তর করা হয়েছে!");
      setConvertingTarget(null);
      refetchActive();
      refetchIncomplete();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "অর্ডারে রূপান্তর করতে সমস্যা হয়েছে");
    }
  };

  const handleUpdateIncStatus = async (id: string, newStatus: string) => {
    try {
      await updateIncompleteStatus({ id, status: newStatus }).unwrap();
      toast.success("অসম্পূর্ণ অর্ডারের স্ট্যাটাস সফলভাবে আপডেট হয়েছে");
      refetchIncomplete();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে");
    }
  };

  const handleDeleteIncomplete = async () => {
    if (!deleteIncTarget) return;
    try {
      await deleteIncompleteOrderMutation(deleteIncTarget._id).unwrap();
      toast.success("অসম্পূর্ণ অর্ডারটি মুছে ফেলা হয়েছে");
      setDeleteIncTarget(null);
      refetchIncomplete();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "ডিলিট করতে সমস্যা হয়েছে");
    }
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
      unitPrice: ord.unitPrice || 950,
      deliveryCharge: ord.deliveryCharge || 0,
      totalPrice: ord.totalPrice || 950,
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

  const handleBlockIp = async () => {
    if (!blockIpTarget?.ipAddress) {
      toast.error("এই অর্ডারে কোনো আইপি অ্যাড্রেস সংরক্ষিত নেই।");
      return;
    }
    try {
      const res = await blockIpMutation({
        ip: blockIpTarget.ipAddress,
        reason: blockReason || "স্প্যাম / অযাচিত অর্ডার",
      }).unwrap();
      toast.success(res.message || "আইপি সফলভাবে ব্লক করা হয়েছে।");
      setBlockIpTarget(null);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "আইপি ব্লক করতে সমস্যা হয়েছে।");
    }
  };

  const handleUnblockIp = async () => {
    if (!blockIpTarget?.ipAddress) return;
    try {
      const res = await unblockIpMutation(blockIpTarget.ipAddress).unwrap();
      toast.success(res.message || "আইপি সফলভাবে আনব্লক করা হয়েছে।");
      setBlockIpTarget(null);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "আইপি আনব্লক করতে সমস্যা হয়েছে।");
    }
  };

  const handleToggleBlockEntity = async (
    type: "ip" | "phone" | "device",
    value: string,
    isCurrentlyBlocked: boolean
  ) => {
    if (!value) return;
    try {
      if (isCurrentlyBlocked) {
        const res = await unblockEntityMutation({ type, value }).unwrap();
        toast.success(res.message || `${type.toUpperCase()} সফলভাবে আনব্লক করা হয়েছে।`);
      } else {
        const res = await blockEntityMutation({
          type,
          value,
          reason: blockReason || "স্প্যাম / অযাচিত অর্ডার",
        }).unwrap();
        toast.success(res.message || `${type.toUpperCase()} সফলভাবে ব্লক করা হয়েছে।`);
      }
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "অপারেশন সম্পন্ন করতে সমস্যা হয়েছে।");
    }
  };

  const handleBlockAll = async (ord: OrderData) => {
    try {
      const res = await blockAllEntitiesMutation({
        ip: ord.ipAddress || undefined,
        phone: ord.phoneNumber,
        deviceId: ord.deviceId || undefined,
        reason: blockReason || "স্প্যাম / অযাচিত অর্ডার",
      }).unwrap();
      toast.success(res.message || "সবগুলো সফলভাবে ব্লক করা হয়েছে।");
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "ব্লক করতে সমস্যা হয়েছে।");
    }
  };

  const handleUnblockAll = async (ord: OrderData) => {
    try {
      const res = await unblockAllEntitiesMutation({
        ip: ord.ipAddress || undefined,
        phone: ord.phoneNumber,
        deviceId: ord.deviceId || undefined,
      }).unwrap();
      toast.success(res.message || "সবগুলো সফলভাবে আনব্লক করা হয়েছে।");
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "আনব্লক করতে সমস্যা হয়েছে।");
    }
  };

  const handleConfirmBulkStatus = async () => {
    if (!bulkStatusTarget || selectedIds.length === 0) return;
    try {
      const res = await bulkUpdateOrderStatus({
        ids: selectedIds,
        status: bulkStatusTarget,
      }).unwrap();
      toast.success(res.message || `${selectedIds.length} টি অর্ডারের স্ট্যাটাস আপডেট হয়েছে।`);
      setSelectedIds([]);
      setBulkStatusTarget(null);
      refetchActive();
      refetchDeleted();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "বাল্ক স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।");
    }
  };

  const selectedOrdersWithCidCount = useMemo(() => {
    if (!currentOrders || selectedIds.length === 0) return 0;
    return currentOrders.filter(
      (ord) => selectedIds.includes(ord._id) && ord.steadfast?.consignmentId
    ).length;
  }, [currentOrders, selectedIds]);

  const handleSendBulkSteadfast = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await sendBulkOrdersToSteadfast({ orderIds: selectedIds }).unwrap();
      toast.success(res.message || `${selectedIds.length} টি অর্ডার স্টিডফাস্টে পাঠানো হয়েছে!`);
      setSelectedIds([]);
      setBulkSteadfastConfirmOpen(false);
      refetchActive();

      // Automatically queue returned consignments for 2x3" label printing
      if (res.updatedOrders && res.updatedOrders.length > 0) {
        const returnedLabels: SteadfastLabelItem[] = res.updatedOrders
          .filter((o: OrderData) => Boolean(o.steadfast?.consignmentId))
          .map((o: OrderData) => ({
            id: String(o.steadfast!.consignmentId),
            consignmentId: o.steadfast!.consignmentId!,
            shopId: "2410661",
            orderId: o.orderId,
            customerName: o.customerName,
            phoneNumber: o.phoneNumber,
            address: o.address,
            createdAt: new Date().toISOString(),
          }));

        if (returnedLabels.length > 0) {
          setLabelPrinterIncoming(returnedLabels);
          setIsLabelPrinterOpen(true);
        }
      }
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "স্টিডফাস্টে পাঠাতে সমস্যা হয়েছে।");
    }
  };

  const handleSendSingleSteadfast = async (order: OrderData) => {
    try {
      setSendingOrderId(order._id);
      const res = await sendOrderToSteadfast(order._id).unwrap();
      toast.success(res.message || "স্টিডফাস্টে সফলভাবে পাঠানো হয়েছে!");
      refetchActive();

      const cid = res.consignment?.consignment_id || res.order?.steadfast?.consignmentId;
      if (cid) {
        setLabelPrinterIncoming([
          {
            id: String(cid),
            consignmentId: cid,
            shopId: "2410661",
            orderId: order.orderId,
            customerName: order.customerName,
            phoneNumber: order.phoneNumber,
            address: order.address,
            createdAt: new Date().toISOString(),
          },
        ]);
        setIsLabelPrinterOpen(true);
      }
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "স্টিডফাস্টে পাঠাতে সমস্যা হয়েছে।");
    } finally {
      setSendingOrderId(null);
    }
  };

  const handleOpenPrintForSelected = () => {
    if (!currentOrders) return;
    const selectedOrdersWithCid = currentOrders.filter(
      (ord) => selectedIds.includes(ord._id) && ord.steadfast?.consignmentId
    );

    if (selectedOrdersWithCid.length === 0) {
      toast.error("নির্বাচিত কোনো অর্ডারে স্টিডফাস্ট কনসাইনমেন্ট আইডি নেই। প্রথমে স্টিডফাস্টে পাঠান।");
      return;
    }

    const items: SteadfastLabelItem[] = selectedOrdersWithCid.map((ord) => ({
      id: String(ord.steadfast!.consignmentId),
      consignmentId: ord.steadfast!.consignmentId!,
      shopId: "2410661",
      orderId: ord.orderId,
      customerName: ord.customerName,
      phoneNumber: ord.phoneNumber,
      address: ord.address,
      createdAt: ord.createdAt || new Date().toISOString(),
    }));

    setLabelPrinterIncoming(items);
    setIsLabelPrinterOpen(true);
  };

  const handleOpenSingleLabel = (ord: OrderData) => {
    if (!ord.steadfast?.consignmentId) {
      toast.error("এই অর্ডারে কোনো কনসাইনমেন্ট আইডি নেই");
      return;
    }
    setLabelPrinterIncoming([
      {
        id: String(ord.steadfast.consignmentId),
        consignmentId: ord.steadfast.consignmentId,
        shopId: "2410661",
        orderId: ord.orderId,
        customerName: ord.customerName,
        phoneNumber: ord.phoneNumber,
        address: ord.address,
        createdAt: ord.createdAt || new Date().toISOString(),
      },
    ]);
    setIsLabelPrinterOpen(true);
  };

  const handleSyncSteadfastStatus = async (orderId: string) => {
    try {
      setSyncingOrderId(orderId);
      const res = await triggerCheckStatus(orderId).unwrap();
      toast.success(`স্টিডফাস্ট স্ট্যাটাস: ${res.delivery_status || res.steadfast?.status || "আপডেটেড"}`);
      refetchActive();
    } catch (err: unknown) {
      toast.error("স্ট্যাটাস সিঙ্ক করতে সমস্যা হয়েছে।");
    } finally {
      setSyncingOrderId(null);
    }
  };

  const handleOpenFraudCheck = async (phone: string) => {
    setFraudModalPhone(phone);
    setFraudData(null);
    try {
      const res = await triggerCheckFraud(phone).unwrap();
      setFraudData(res);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      setFraudData({ error: error?.data?.message || "ফ্রড স্কোর চেক করা যায়নি।" });
    }
  };

  const handleExportExcel = async (exportOnlySelected: boolean = false) => {
    try {
      const isCustomSelected = exportOnlySelected && selectedIds.length > 0;
      const blob = await exportExcel({
        ids: isCustomSelected ? selectedIds : undefined,
        status: !isCustomSelected && statusFilter !== "all" ? statusFilter : undefined,
        isDeleted: activeTab === "deleted",
      }).unwrap();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = isCustomSelected
        ? `selected-orders-${selectedIds.length}-${dateStr}.xlsx`
        : `selfcaresolution-orders-${activeTab === "deleted" ? "trash-" : ""}${dateStr}.xlsx`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(
        isCustomSelected
          ? `${selectedIds.length} টি নির্বাচিত অর্ডারের Excel ফাইল ডাউনলোড সম্পন্ন হয়েছে!`
          : "অর্ডার Excel ফাইল ডাউনলোড সম্পন্ন হয়েছে! (Google Sheets ও Excel এ ব্যবহারযোগ্য)"
      );
    } catch {
      toast.error("Excel ফাইল এক্সপোর্ট করতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080817] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              অর্ডার <span className="text-gradient-blue">ম্যানেজমেন্ট</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              গ্রাহকের অর্ডার পর্যালোচনা, এডিট, সফট ডিলিট, ট্র্যাশ ও Excel এক্সপোর্ট করুন
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                refetchActive();
                refetchDeleted();
                refetchIncomplete();
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <RefreshCw size={14} className={isTableFetching ? "animate-spin" : ""} />
              রিফ্রেশ
            </button>
            <button
              onClick={() => setIsManualOrderOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all active:scale-95 shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Plus size={14} />
              ম্যানুয়াল অর্ডার
            </button>
            <button
              onClick={() => {
                setLabelPrinterIncoming([]);
                setIsLabelPrinterOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-all active:scale-95 shadow-sm cursor-pointer"
              title="২×৩ ইঞ্চি স্টিডফাস্ট কুরিয়ার স্টিকার / লেবেল প্রিন্টার"
            >
              <Printer size={14} />
              <span>স্টিকার প্রিন্ট</span>
            </button>
            <button
              onClick={() => handleExportExcel(selectedIds.length > 0)}
              disabled={isExporting}
              className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm ${
                selectedIds.length > 0
                  ? "btn-gold"
                  : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              }`}
            >
              <Download size={14} />
              {isExporting
                ? "এক্সপোর্ট হচ্ছে..."
                : selectedIds.length > 0
                ? `সিলেক্টেড Excel (${selectedIds.length})`
                : "সকল Excel এক্সপোর্ট"}
            </button>
          </div>
        </div>

        {/* Tab Switcher: Active vs Incomplete vs Deleted */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
          <button
            onClick={() => handleTabChange("active")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "active"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <Layers size={15} />
            <span>সক্রিয় অর্ডার</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === "active" ? "bg-white/20 text-white" : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
              }`}
            >
              {activeOrdersData?.total ?? 0}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("incomplete")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "incomplete"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                : "bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <AlertCircle size={15} />
            <span>অসম্পূর্ণ অর্ডার (Abandoned)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === "incomplete" ? "bg-white/20 text-white" : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
              }`}
            >
              {incompleteOrdersData?.total ?? 0}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("deleted")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "deleted"
                ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                : "bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <Trash2 size={15} />
            <span>ডিলিটকৃত অর্ডার (ট্র্যাশ)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === "deleted" ? "bg-white/20 text-white" : "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400"
              }`}
            >
              {deletedOrdersData?.total ?? 0}
            </span>
          </button>
        </div>

        {/* Selected Orders Action Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                {selectedIds.length}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                টি অর্ডার নির্বাচিত করা হয়েছে
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Bulk Status Select Dropdown */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl px-2.5 py-1.5 shadow-sm">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  বাল্ক স্ট্যাটাস:
                </span>
                <select
                  value=""
                  disabled={isBulkUpdatingStatus}
                  onChange={(e) => {
                    if (e.target.value) {
                      setBulkStatusTarget(e.target.value);
                    }
                  }}
                  className="bg-transparent text-blue-600 dark:text-blue-400 font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="" disabled className="bg-white dark:bg-slate-900 text-slate-500">
                    স্ট্যাটাস পরিবর্তন করুন...
                  </option>
                  <option value="Pending" className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400">Pending</option>
                  <option value="Confirmed" className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400">Confirmed</option>
                  <option value="Scheduled" className="bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400">Scheduled</option>
                  <option value="Processing" className="bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400">Processing</option>
                  <option value="Hold" className="bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400">Hold</option>
                  <option value="Shipped" className="bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400">Shipped</option>
                  <option value="Delivered" className="bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400">Delivered</option>
                  <option value="Cancelled" className="bg-white dark:bg-slate-900 text-red-600 dark:text-red-400">Cancelled</option>
                </select>
              </div>

              {/* Send to Steadfast Bulk Button */}
              <button
                type="button"
                onClick={() => setBulkSteadfastConfirmOpen(true)}
                disabled={isSendingBulkSteadfast}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold shadow-md cursor-pointer active:scale-95 transition-all"
                title="নির্বাচিত অর্ডারগুলো স্টিডফাস্ট কুরিয়ারে পাঠান"
              >
                <Truck size={14} />
                <span>{isSendingBulkSteadfast ? "পাঠানো হচ্ছে..." : `স্টিডফাস্টে পাঠান (${selectedIds.length})`}</span>
              </button>

              {/* Print Labels for Selected Orders */}
              {selectedOrdersWithCidCount > 0 && (
                <button
                  type="button"
                  onClick={handleOpenPrintForSelected}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold shadow-md cursor-pointer active:scale-95 transition-all"
                  title="নির্বাচিত অর্ডারগুলোর জন্য ২×৩ ইঞ্চি কুরিয়ার স্টিকার প্রিন্ট করুন"
                >
                  <Printer size={14} />
                  <span>স্টিকার প্রিন্ট ({selectedOrdersWithCidCount})</span>
                </button>
              )}

              <button
                onClick={() => handleExportExcel(true)}
                disabled={isExporting}
                className="btn-gold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold shadow-md cursor-pointer active:scale-95"
              >
                <Download size={14} />
                {isExporting ? "এক্সপোর্ট হচ্ছে..." : `Excel (${selectedIds.length})`}
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 font-semibold transition-colors cursor-pointer"
                title="সিলেকশন বাতিল"
              >
                বাতিল
              </button>
            </div>
          </div>
        )}

        {/* Filters & Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {STATUSES.map((st) => (
              <button
                key={st.key}
                onClick={() => {
                  setStatusFilter(st.key);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === st.key
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
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
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="অর্ডার আইডি (CZ-XXXX) বা গ্রাহকের নাম..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
              />
            </div>

            {/* Phone Number Filter */}
            <div className="relative flex-1">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="মোবাইল নম্বর দিয়ে খুঁজুন (017...)..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
              />
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shrink-0">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">প্রতি পেজে:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="bg-transparent text-blue-600 dark:text-blue-400 font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value={10} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">10 টি</option>
                <option value={20} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">20 টি</option>
                <option value={30} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">30 টি</option>
                <option value={50} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">50 টি</option>
                <option value={100} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">100 টি</option>
              </select>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                className="btn-gold font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm cursor-pointer active:scale-95"
              >
                ফিল্টার করুন
              </button>
              {(searchTerm || phoneFilter || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs border border-slate-200 dark:border-slate-700 font-semibold transition-colors cursor-pointer active:scale-95"
                >
                  ক্লিয়ার
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Deleted Orders Banner Notice */}
        {activeTab === "deleted" && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-4 flex items-center gap-3 text-red-700 dark:text-red-300 text-xs">
            <Archive size={20} className="text-red-500 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block text-sm mb-0.5">ডিলিটকৃত অর্ডার সংগ্রহশালা (রিসাইকেল বিন)</span>
              এই অর্ডারের তথ্য গ্রাহক ও ড্যাশবোর্ড রিপোর্ট থেকে আলাদা রয়েছে। আপনি যেকোনো সময় অর্ডার সক্রিয় তালিকায় পুনরুদ্ধার করতে পারেন অথবা স্থায়ীভাবে মুছে ফেলতে পারেন।
            </div>
          </div>
        )}

        {/* Incomplete Orders Banner Notice */}
        {activeTab === "incomplete" && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs">
            <AlertCircle size={20} className="text-amber-500 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block text-sm mb-0.5">অসম্পূর্ণ অর্ডারসমূহ (Abandoned Checkout)</span>
              যেসব গ্রাহক নাম ও ফোন নম্বর লিখে কিন্তু অর্ডার সাবমিট না করেই বন্ধ করে দিয়েছেন, তাদের তালিকা এখানে দেখা যাচ্ছে। আপনি ফোন করে নিশ্চিত হয়ে &quot;অর্ডারে রূপান্তর&quot; বাটনে চাপ দিয়ে চূড়ান্ত অর্ডার তৈরি করতে পারেন।
            </div>
          </div>
        )}

        {/* Orders Table Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
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
                        className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                        title="সব সিলেক্ট করুন"
                      />
                    </th>
                  )}
                  <th className="py-3.5 px-4 font-semibold">
                    {activeTab === "incomplete" ? "অসম্পূর্ণ আইডি" : "অর্ডার আইডি"}
                  </th>
                  <th className="py-3.5 px-4 font-semibold">
                    {activeTab === "deleted" ? "ডিলিট তারিখ ও সময়" : "তারিখ ও সময় (GMT+6)"}
                  </th>
                  <th className="py-3.5 px-4 font-semibold">গ্রাহক ও মোবাইল</th>
                  <th className="py-3.5 px-4 font-semibold">
                    {activeTab === "incomplete" ? "ঠিকানা (ঐচ্ছিক)" : "ঠিকানা"}
                  </th>
                  <th className="py-3.5 px-4 font-semibold">সাইজ ও পরিমাণ</th>
                  <th className="py-3.5 px-4 font-semibold">
                    {activeTab === "incomplete" ? "আনুমানিক মূল্য" : "মোট মূল্য"}
                  </th>
                  <th className="py-3.5 px-4 font-semibold">
                    {activeTab === "deleted" ? "পূর্ববর্তী স্ট্যাটাস" : "স্ট্যাটাস পরিবর্তন"}
                  </th>
                  {activeTab === "active" && (
                    <th className="py-3.5 px-4 font-semibold">স্টিডফাস্ট কুরিয়ার</th>
                  )}
                  <th className="py-3.5 px-4 font-semibold text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                {isTableLoading ? (
                  <tr>
                    <td colSpan={activeTab === "active" ? 10 : 8} className="py-12 text-center text-blue-600 dark:text-blue-400 text-xs font-bold">
                      লোড হচ্ছে...
                    </td>
                  </tr>
                ) : activeTab === "incomplete" ? (
                  incompleteOrdersData?.incompleteOrders && incompleteOrdersData.incompleteOrders.length > 0 ? (
                    incompleteOrdersData.incompleteOrders.map((inc) => (
                      <tr
                        key={inc._id}
                        className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                          INC-{inc._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {new Date(inc.createdAt).toLocaleDateString("bn-BD", {
                              timeZone: "Asia/Dhaka",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Clock size={11} className="text-slate-400 shrink-0" />
                            {new Date(inc.createdAt).toLocaleTimeString("bn-BD", {
                              timeZone: "Asia/Dhaka",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                            <span>{inc.customerName}</span>
                            {inc.hasPreviousOrders && (
                              <span
                                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 inline-flex items-center gap-0.5"
                                title={`এই নম্বরে পূর্বে ${inc.previousOrdersCount} টি সফল অর্ডার রয়েছে`}
                              >
                                <UserCheck size={11} />
                                পূর্বের গ্রাহক ({inc.previousOrdersCount})
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <div className="flex items-center gap-1">
                              <PhoneCall size={12} className="text-emerald-500" />
                              <a
                                href={`tel:${inc.phoneNumber}`}
                                className="hover:underline text-emerald-600 dark:text-emerald-400 font-bold"
                              >
                                {inc.phoneNumber}
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenFraudCheck(inc.phoneNumber)}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors inline-flex items-center gap-0.5 cursor-pointer active:scale-95"
                              title="স্টিডফাস্ট ফ্রড স্কোর ও ডেলিভারি হিস্ট্রি চেক করুন"
                            >
                              <ShieldAlert size={10} />
                              <span>ফ্রড চেক</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <span className={inc.address ? "text-slate-700 dark:text-slate-300" : "text-slate-400 italic text-xs"}>
                            {inc.address || "ঠিকানা প্রদান করা হয়নি"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{inc.quantity} টি</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{inc.size || "স্ট্যান্ডার্ড"}</div>
                        </td>
                        <td className="py-3.5 px-4 font-black text-amber-600 dark:text-amber-400">
                          ৳{inc.totalPrice}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={inc.status}
                            onChange={(e) => handleUpdateIncStatus(inc._id, e.target.value)}
                            disabled={isUpdatingIncStatus}
                            className={`text-xs font-bold rounded-lg border px-2.5 py-1 focus:outline-none cursor-pointer ${
                              inc.status === "Pending"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                : inc.status === "Contacted"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                : inc.status === "Converted"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                            }`}
                          >
                            <option value="Pending" className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400">Pending</option>
                            <option value="Contacted" className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400">Contacted (যোগাযোগ সম্পন্ন)</option>
                            <option value="Converted" className="bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400">Converted (রূপান্তরিত)</option>
                            <option value="Cancelled" className="bg-white dark:bg-slate-900 text-red-600 dark:text-red-400">Cancelled (বাতিল)</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`tel:${inc.phoneNumber}`}
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-all inline-flex items-center gap-1 text-xs cursor-pointer active:scale-95"
                              title="সরাসরি কল দিন"
                            >
                              <PhoneCall size={13} />
                            </a>
                            {inc.status !== "Converted" && (
                              <button
                                onClick={() => handleOpenConvert(inc)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1 transition-all shadow-sm active:scale-95 cursor-pointer"
                                title="অর্ডারে রূপান্তর করুন"
                              >
                                <CheckCircle2 size={13} />
                                <span>অর্ডারে রূপান্তর</span>
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteIncTarget(inc)}
                              className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 transition-all inline-flex items-center gap-1 text-xs cursor-pointer active:scale-95"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        কোনো অসম্পূর্ণ অর্ডার পাওয়া যায়নি
                      </td>
                    </tr>
                  )
                ) : currentOrders && currentOrders.length > 0 ? (
                  currentOrders.map((ord) => {
                    const isSelected = selectedIds.includes(ord._id);
                    return (
                      <tr
                        key={ord._id}
                        className={`transition-colors ${
                          isSelected
                            ? "bg-blue-50/80 dark:bg-blue-950/30"
                            : activeTab === "deleted"
                            ? "hover:bg-red-50/50 dark:hover:bg-red-950/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        {activeTab === "active" && (
                          <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(ord._id)}
                              className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {ord.orderId}
                        </td>
                        <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                          {activeTab === "active" ? (
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {new Date(ord.createdAt).toLocaleDateString("bn-BD", {
                                  timeZone: "Asia/Dhaka",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                <Clock size={11} className="text-slate-400 shrink-0" />
                                {new Date(ord.createdAt).toLocaleTimeString("bn-BD", {
                                  timeZone: "Asia/Dhaka",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </div>
                            </div>
                          ) : ord.deletedAt ? (
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {new Date(ord.deletedAt).toLocaleDateString("bn-BD", {
                                  timeZone: "Asia/Dhaka",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                              <div className="text-[11px] text-red-500/80 font-mono flex items-center gap-1 mt-0.5">
                                <Clock size={11} className="text-red-400 shrink-0" />
                                {new Date(ord.deletedAt).toLocaleTimeString("bn-BD", {
                                  timeZone: "Asia/Dhaka",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {new Date(ord.createdAt).toLocaleDateString("bn-BD", {
                                  timeZone: "Asia/Dhaka",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                <Clock size={11} className="text-slate-400 shrink-0" />
                                {new Date(ord.createdAt).toLocaleTimeString("bn-BD", {
                                  timeZone: "Asia/Dhaka",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{ord.customerName}</div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{ord.phoneNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleOpenFraudCheck(ord.phoneNumber)}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors inline-flex items-center gap-0.5 cursor-pointer active:scale-95"
                              title="স্টিডফাস্ট ফ্রড স্কোর ও পার্সেল হিস্ট্রি চেক করুন"
                            >
                              <ShieldAlert size={10} />
                              <span>ফ্রড চেক</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-xs text-slate-600 dark:text-slate-300">
                          {ord.address}
                          {ord.district ? `, ${ord.district}` : ""}
                          {ord.thana ? ` (${ord.thana})` : ""}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="font-bold text-slate-900 dark:text-white">{ord.quantity} টি</span>
                          {ord.size && <span className="text-slate-500 dark:text-slate-400 ml-1">({ord.size})</span>}
                        </td>
                        <td className="py-3.5 px-4 font-black text-blue-600 dark:text-blue-400">
                          ৳{ord.totalPrice}
                        </td>

                        {/* Status Column */}
                        <td className="py-3.5 px-4">
                          {activeTab === "active" ? (
                            <select
                              value={ord.status}
                              disabled={isUpdatingStatus}
                              onChange={(e) => handleStatusChange(ord._id, e.target.value)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none cursor-pointer ${
                                STATUS_COLORS[ord.status] || "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white"
                              }`}
                            >
                              <option value="Pending" className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400">Pending</option>
                              <option value="Confirmed" className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400">Confirmed</option>
                              <option value="Scheduled" className="bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400">Scheduled</option>
                              <option value="Processing" className="bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400">Processing</option>
                              <option value="Hold" className="bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400">Hold</option>
                              <option value="Shipped" className="bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400">Shipped</option>
                              <option value="Delivered" className="bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400">Delivered</option>
                              <option value="Cancelled" className="bg-white dark:bg-slate-900 text-red-600 dark:text-red-400">Cancelled</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                                STATUS_COLORS[ord.status] || "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white"
                              }`}
                            >
                              {ord.status}
                            </span>
                          )}
                        </td>

                        {/* Steadfast Courier Column */}
                        {activeTab === "active" && (
                          <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                            {ord.steadfast?.consignmentId ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    CID: {ord.steadfast.consignmentId}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleSyncSteadfastStatus(ord._id)}
                                    disabled={syncingOrderId === ord._id}
                                    className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors cursor-pointer"
                                    title="লাইভ ডেলিভারি স্ট্যাটাস রিফ্রেশ করুন"
                                  >
                                    <RefreshCw size={11} className={syncingOrderId === ord._id ? "animate-spin text-emerald-600" : ""} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSingleLabel(ord)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors cursor-pointer"
                                    title="২×৩ ইঞ্চি স্টিকার প্রিন্ট করুন"
                                  >
                                    <Printer size={11} />
                                  </button>
                                </div>
                                {ord.steadfast.trackingCode && (
                                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                    <span>TRK: {ord.steadfast.trackingCode}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (ord.steadfast?.trackingCode) {
                                          navigator.clipboard.writeText(ord.steadfast.trackingCode);
                                          toast.success("ট্র্যাকিং কোড কপি করা হয়েছে!");
                                        }
                                      }}
                                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                                      title="ট্র্যাকিং কোড কপি করুন"
                                    >
                                      <Copy size={10} />
                                    </button>
                                  </div>
                                )}
                                <div>
                                  <span
                                    className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                      ord.steadfast.status?.toLowerCase().includes("deliver")
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                        : ord.steadfast.status?.toLowerCase().includes("cancel")
                                        ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800"
                                        : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                    }`}
                                  >
                                    {ord.steadfast.status || "ইন-কুরিয়ার"}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendSingleSteadfast(ord)}
                                disabled={sendingOrderId === ord._id}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[11px] inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                title="অর্ডারটি স্টিডফাস্ট কুরিয়ারে বুকিং করুন"
                              >
                                <Truck size={13} className={sendingOrderId === ord._id ? "animate-bounce" : ""} />
                                <span>{sendingOrderId === ord._id ? "পাঠানো হচ্ছে..." : "স্টিডফাস্টে পাঠান"}</span>
                              </button>
                            )}
                          </td>
                        )}

                        {/* Action Column */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {activeTab === "active" ? (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(ord)}
                                  className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 transition-all inline-flex items-center gap-1 text-xs cursor-pointer active:scale-95"
                                  title="অর্ডার এডিট করুন"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => setSelectedOrder(ord)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all inline-flex items-center gap-1 text-xs cursor-pointer active:scale-95"
                                  title="বিস্তারিত দেখুন"
                                >
                                  <Eye size={13} />
                                </button>
                                <div className="relative inline-block text-left">
                                  {/* Block Icon Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenBlockDropdownOrderId(
                                        openBlockDropdownOrderId === ord._id ? null : ord._id
                                      );
                                    }}
                                    className={`p-1.5 rounded-lg border transition-all inline-flex items-center gap-1 text-xs cursor-pointer active:scale-95 ${
                                      (ord.ipAddress && blockedIpSet.has(ord.ipAddress)) ||
                                      blockedPhoneSet.has(ord.phoneNumber) ||
                                      (ord.deviceId && blockedDeviceSet.has(ord.deviceId))
                                        ? "bg-red-500/15 text-red-500 border-red-500/40 hover:bg-red-500/25"
                                        : "bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                                    }`}
                                    title="ব্লকিং ড্রপডাউন (IP, Phone, Device)"
                                  >
                                    <ShieldBan size={13} />
                                  </button>

                                  {/* Block Dropdown Popover */}
                                  {openBlockDropdownOrderId === ord._id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-30"
                                        onClick={() => setOpenBlockDropdownOrderId(null)}
                                      />
                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute right-0 top-full mt-1.5 z-40 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3.5 space-y-3 animate-scaleIn text-left"
                                      >
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                          <div className="flex items-center gap-2">
                                            <ShieldBan size={16} className="text-red-500" />
                                            <span className="font-bold text-slate-900 dark:text-white text-xs">
                                              ব্লকিং ড্রপডাউন — {ord.orderId}
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setOpenBlockDropdownOrderId(null)}
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                                          >
                                            <X size={14} />
                                          </button>
                                        </div>

                                        {/* IP Row */}
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                              আইপি অ্যাড্রেস:
                                            </span>
                                            {ord.ipAddress ? (
                                              blockedIpSet.has(ord.ipAddress) ? (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-900">
                                                  ব্লকড
                                                </span>
                                              ) : (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-900">
                                                  সচল
                                                </span>
                                              )
                                            ) : (
                                              <span className="text-[10px] text-slate-400 italic">রেকর্ড নেই</span>
                                            )}
                                          </div>
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                              {ord.ipAddress || "রেকর্ড নেই"}
                                            </span>
                                            <button
                                              type="button"
                                              disabled={!ord.ipAddress || isBlockingEntity || isUnblockingEntity}
                                              onClick={() =>
                                                handleToggleBlockEntity(
                                                  "ip",
                                                  ord.ipAddress!,
                                                  Boolean(ord.ipAddress && blockedIpSet.has(ord.ipAddress))
                                                )
                                              }
                                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                                                ord.ipAddress && blockedIpSet.has(ord.ipAddress)
                                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                                  : "bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800"
                                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                                            >
                                              {ord.ipAddress && blockedIpSet.has(ord.ipAddress) ? "আনব্লক" : "ব্লক"}
                                            </button>
                                          </div>
                                        </div>

                                        {/* Phone Row */}
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                              মোবাইল নম্বর:
                                            </span>
                                            {blockedPhoneSet.has(ord.phoneNumber) ? (
                                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-900">
                                                ব্লকড
                                              </span>
                                            ) : (
                                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-900">
                                                সচল
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                              {ord.phoneNumber}
                                            </span>
                                            <button
                                              type="button"
                                              disabled={isBlockingEntity || isUnblockingEntity}
                                              onClick={() =>
                                                handleToggleBlockEntity(
                                                  "phone",
                                                  ord.phoneNumber,
                                                  blockedPhoneSet.has(ord.phoneNumber)
                                                )
                                              }
                                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                                                blockedPhoneSet.has(ord.phoneNumber)
                                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                                  : "bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800"
                                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                                            >
                                              {blockedPhoneSet.has(ord.phoneNumber) ? "আনব্লক" : "ব্লক"}
                                            </button>
                                          </div>
                                        </div>

                                        {/* Device ID Row */}
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                              ডিভাইস আইডি:
                                            </span>
                                            {ord.deviceId ? (
                                              blockedDeviceSet.has(ord.deviceId) ? (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-900">
                                                  ব্লকড
                                                </span>
                                              ) : (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-900">
                                                  সচল
                                                </span>
                                              )
                                            ) : (
                                              <span className="text-[10px] text-slate-400 italic">রেকর্ড নেই</span>
                                            )}
                                          </div>
                                          <div className="flex items-center justify-between gap-2">
                                            <span
                                              className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]"
                                              title={ord.deviceId || ""}
                                            >
                                              {ord.deviceId || "রেকর্ড নেই"}
                                            </span>
                                            <button
                                              type="button"
                                              disabled={!ord.deviceId || isBlockingEntity || isUnblockingEntity}
                                              onClick={() =>
                                                handleToggleBlockEntity(
                                                  "device",
                                                  ord.deviceId!,
                                                  Boolean(ord.deviceId && blockedDeviceSet.has(ord.deviceId))
                                                )
                                              }
                                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                                                ord.deviceId && blockedDeviceSet.has(ord.deviceId)
                                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                                  : "bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800"
                                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                                            >
                                              {ord.deviceId && blockedDeviceSet.has(ord.deviceId) ? "আনব্লক" : "ব্লক"}
                                            </button>
                                          </div>
                                        </div>

                                        {/* Block All / Unblock All Button */}
                                        {(() => {
                                          const hasAnyBlocked =
                                            (ord.ipAddress && blockedIpSet.has(ord.ipAddress)) ||
                                            blockedPhoneSet.has(ord.phoneNumber) ||
                                            (ord.deviceId && blockedDeviceSet.has(ord.deviceId));

                                          return hasAnyBlocked ? (
                                            <button
                                              type="button"
                                              disabled={isBlockingAll || isUnblockingAll}
                                              onClick={() => handleUnblockAll(ord)}
                                              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                              <ShieldCheck size={14} />
                                              সবগুলো একসাথে আনব্লক করুন
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              disabled={isBlockingAll || isUnblockingAll}
                                              onClick={() => handleBlockAll(ord)}
                                              className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                              <ShieldBan size={14} />
                                              সবগুলো একসাথে ব্লক করুন
                                            </button>
                                          );
                                        })()}
                                      </div>
                                    </>
                                  )}
                                </div>
                                <button
                                  onClick={() => setSoftDeleteTarget(ord)}
                                  className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 transition-all inline-flex items-center gap-1 text-xs cursor-pointer active:scale-95"
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
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-all inline-flex items-center gap-1 text-xs font-semibold cursor-pointer active:scale-95"
                                  title="পুনরুদ্ধার করুন"
                                >
                                  <RotateCcw size={13} />
                                  <span>পুনরুদ্ধার</span>
                                </button>
                                <button
                                  onClick={() => setSelectedOrder(ord)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all inline-flex items-center gap-1 text-xs cursor-pointer active:scale-95"
                                  title="বিস্তারিত দেখুন"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  onClick={() => {
                                    setBlockIpTarget(ord);
                                    setBlockReason("স্প্যাম / অযাচিত অর্ডার");
                                  }}
                                  className={`p-1.5 rounded-lg border transition-all inline-flex items-center gap-1 text-xs cursor-pointer active:scale-95 ${
                                    ord.ipAddress && blockedIpSet.has(ord.ipAddress)
                                      ? "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20"
                                      : "bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                                  }`}
                                  title={
                                    ord.ipAddress && blockedIpSet.has(ord.ipAddress)
                                      ? "আইপি ব্লকড (ম্যানেজ / আনব্লক করুন)"
                                      : "আইপি ব্লক করুন"
                                  }
                                >
                                  <ShieldBan size={13} />
                                </button>
                                <button
                                  onClick={() => setPermanentDeleteTarget(ord)}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 transition-all inline-flex items-center gap-1 text-xs font-semibold cursor-pointer active:scale-95"
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
                      colSpan={activeTab === "active" ? 10 : 8}
                      className="py-12 text-center text-slate-400 text-xs"
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
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span>
                মোট {activeTab === "incomplete" ? incompleteOrdersData?.total || 0 : currentOrdersData?.total || 0} টি অর্ডারের মধ্যে পৃষ্ঠা{" "}
                <span className="text-slate-900 dark:text-white font-bold">
                  {activeTab === "incomplete" ? incompleteOrdersData?.page || 1 : currentOrdersData?.page || 1}
                </span> /{" "}
                {activeTab === "incomplete" ? incompleteOrdersData?.pages || 1 : currentOrdersData?.pages || 1}
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div className="flex items-center gap-1.5">
                <span>প্রতি পেজে:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-blue-600 dark:text-blue-400 font-bold text-xs focus:outline-none cursor-pointer"
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
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="পূর্ববর্তী পৃষ্ঠা"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-lg">
                পৃষ্ঠা {currentPage}
              </span>
              <button
                disabled={
                  activeTab === "incomplete"
                    ? !incompleteOrdersData || currentPage >= incompleteOrdersData.pages
                    : !currentOrdersData || currentPage >= currentOrdersData.pages
                }
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
              {selectedOrder.isDeleted && (
                <span className="text-[11px] bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 px-2 py-0.5 rounded-full font-bold">
                  ট্র্যাশড
                </span>
              )}
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
                {selectedOrder.ipAddress && (
                  <div className="col-span-2 pt-1 border-t border-slate-100 dark:border-slate-700/40 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold">গ্রাহকের আইপি (IP):</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">{selectedOrder.ipAddress}</span>
                    </div>
                    {blockedIpSet.has(selectedOrder.ipAddress) ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-900">
                        আইপি ব্লকড
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-900">
                        আইপি সচল
                      </span>
                    )}
                  </div>
                )}
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
                  <p className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                    {new Date(selectedOrder.createdAt).toLocaleString("bn-BD", {
                      timeZone: "Asia/Dhaka",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}{" "}
                    <span className="text-[11px] font-mono text-blue-500">(GMT+6)</span>
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

              {/* Steadfast Courier Info in Details Modal */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <Truck size={15} className="text-emerald-600 dark:text-emerald-400" />
                    <span>স্টিডফাস্ট কুরিয়ার ট্র্যাকিং</span>
                  </div>
                  {selectedOrder.steadfast?.consignmentId ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenSingleLabel(selectedOrder)}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Printer size={12} />
                        স্টিকার প্রিন্ট
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSyncSteadfastStatus(selectedOrder._id)}
                        disabled={syncingOrderId === selectedOrder._id}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={11} className={syncingOrderId === selectedOrder._id ? "animate-spin" : ""} />
                        লাইভ সিঙ্ক
                      </button>
                    </div>
                  ) : null}
                </div>

                {selectedOrder.steadfast?.consignmentId ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">কনসাইনমেন্ট আইডি:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                        {selectedOrder.steadfast.consignmentId}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">ট্র্যাকিং কোড:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                        {selectedOrder.steadfast.trackingCode || "প্রযোজ্য নয়"}
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">ডেলিভারি স্ট্যাটাস:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded text-[11px] border border-emerald-200 dark:border-emerald-800">
                        {selectedOrder.steadfast.status || "In Courier"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">স্টিডফাস্টে এখনো বুকিং করা হয়নি</span>
                    <button
                      type="button"
                      onClick={() => handleSendSingleSteadfast(selectedOrder)}
                      disabled={sendingOrderId === selectedOrder._id}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Truck size={13} className={sendingOrderId === selectedOrder._id ? "animate-bounce" : ""} />
                      {sendingOrderId === selectedOrder._id ? "পাঠানো হচ্ছে..." : "এখনই পাঠান"}
                    </button>
                  </div>
                )}
              </div>

              {/* Status History Timeline */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div>
                  <span className="text-slate-400 text-[11px] font-bold block mb-2">স্ট্যাটাস ইতিহাস:</span>
                  <div className="space-y-1.5">
                    {[...selectedOrder.statusHistory].reverse().map((h, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <span
                          className={`font-bold ${
                            STATUS_COLORS[h.status]?.includes("amber")
                              ? "text-amber-600 dark:text-amber-400"
                              : STATUS_COLORS[h.status]?.includes("blue")
                              ? "text-blue-600 dark:text-blue-400"
                              : STATUS_COLORS[h.status]?.includes("indigo")
                              ? "text-indigo-600 dark:text-indigo-400"
                              : STATUS_COLORS[h.status]?.includes("purple")
                              ? "text-purple-600 dark:text-purple-400"
                              : STATUS_COLORS[h.status]?.includes("orange")
                              ? "text-orange-600 dark:text-orange-400"
                              : STATUS_COLORS[h.status]?.includes("cyan")
                              ? "text-cyan-600 dark:text-cyan-400"
                              : STATUS_COLORS[h.status]?.includes("emerald")
                              ? "text-emerald-600 dark:text-emerald-400"
                              : STATUS_COLORS[h.status]?.includes("red")
                              ? "text-red-600 dark:text-red-400"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {h.status}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {h.changedAt
                            ? new Date(h.changedAt).toLocaleString("bn-BD", {
                                timeZone: "Asia/Dhaka",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : ""}
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

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0f172a] max-w-2xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative rounded-3xl max-h-[92vh] flex flex-col animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    অর্ডার সম্পাদনা — <span className="font-mono text-blue-600 dark:text-blue-400">{editingOrder.orderId}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    অর্ডারের তথ্য পরিবর্তন করে সংরক্ষণ করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
                title="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto pr-1 py-4 space-y-4 text-xs sm:text-sm">
              {/* Customer Information */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-3">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  গ্রাহকের তথ্য
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      গ্রাহকের নাম <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.customerName}
                      onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      মোবাইল নম্বর <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.phoneNumber}
                      onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">ইমেইল (ঐচ্ছিক)</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-3">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  ডেলিভারি ঠিকানা
                </h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    সম্পূর্ণ ঠিকানা <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">জেলা</label>
                    <input
                      type="text"
                      value={editForm.district}
                      onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                      placeholder="যেমন: ঢাকা"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">থানা / উপজেলা</label>
                    <input
                      type="text"
                      value={editForm.thana}
                      onChange={(e) => setEditForm({ ...editForm, thana: e.target.value })}
                      placeholder="যেমন: মিরপুর"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Product, Pricing & Quantity */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-3">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  পণ্য ও মূল্য বিবরণী
                </h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">পণ্যের নাম</label>
                  <input
                    type="text"
                    value={editForm.productName}
                    onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">সাইজ</label>
                    <select
                      value={editForm.size}
                      onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="স্ট্যান্ডার্ড">স্ট্যান্ডার্ড</option>
                      <option value="মিডিয়াম (52mm)">মিডিয়াম (52mm)</option>
                      <option value="লার্জ (56mm)">লার্জ (56mm)</option>
                      <option value="এক্সট্রা লার্জ">এক্সট্রা লার্জ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">পরিমাণ (টি)</label>
                    <input
                      type="number"
                      min={1}
                      value={editForm.quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">প্রতি পিসের মূল্য (৳)</label>
                    <input
                      type="number"
                      min={0}
                      value={editForm.unitPrice}
                      onChange={(e) => handleUnitPriceChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">ডেলিভারি চার্জ (৳)</label>
                    <input
                      type="number"
                      min={0}
                      value={editForm.deliveryCharge}
                      onChange={(e) => handleDeliveryChargeChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      সর্বমোট মূল্য (৳)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editForm.totalPrice}
                      onChange={(e) => setEditForm({ ...editForm, totalPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-500/50 rounded-xl text-blue-600 dark:text-blue-400 font-bold text-xs focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                      হিসাব: ৳{editForm.unitPrice} × {editForm.quantity} + ৳{editForm.deliveryCharge} = ৳{editForm.unitPrice * editForm.quantity + editForm.deliveryCharge}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Payment Method */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-3">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  স্ট্যাটাস ও পেমেন্ট
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">অর্ডার স্ট্যাটাস</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-semibold focus:outline-none ${
                        STATUS_COLORS[editForm.status] || "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white"
                      }`}
                    >
                      <option value="Pending" className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400">Pending</option>
                      <option value="Confirmed" className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400">Confirmed</option>
                      <option value="Scheduled" className="bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400">Scheduled</option>
                      <option value="Processing" className="bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400">Processing</option>
                      <option value="Hold" className="bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400">Hold</option>
                      <option value="Shipped" className="bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400">Shipped</option>
                      <option value="Delivered" className="bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400">Delivered</option>
                      <option value="Cancelled" className="bg-white dark:bg-slate-900 text-red-600 dark:text-red-400">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">পেমেন্ট মেথড</label>
                    <select
                      value={editForm.paymentMethod}
                      onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="Cash on Delivery">Cash on Delivery</option>
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Rocket">Rocket</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-2">
                <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  অর্ডার নোট / মন্তব্য
                </label>
                <textarea
                  rows={2}
                  value={editForm.orderNotes}
                  onChange={(e) => setEditForm({ ...editForm, orderNotes: e.target.value })}
                  placeholder="অর্ডার সংক্রান্ত বিশেষ তথ্য বা কাস্টমার নোট..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  disabled={isSavingOrder}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 font-bold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingOrder}
                  className="btn-gold text-xs px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] max-w-md w-full p-6 border border-red-200 dark:border-red-900 shadow-2xl relative rounded-3xl animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">অর্ডার ট্র্যাশে পাঠাবেন?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">অর্ডার আইডি: {softDeleteTarget.orderId}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              এই অর্ডারটি সক্রিয় তালিকা থেকে সরিয়ে <strong>ডিলিটকৃত অর্ডার (ট্র্যাশ)</strong> ট্যাবে রাখা হবে। আপনি পরবর্তীতে চাইলে যেকোনো সময় এটি পুনরুদ্ধার বা স্থায়ীভাবে মুছে ফেলতে পারবেন।
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSoftDeleteTarget(null)}
                disabled={isSoftDeleting}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 font-bold transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSoftDelete}
                disabled={isSoftDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] max-w-md w-full p-6 border border-red-300 dark:border-red-900 shadow-2xl relative rounded-3xl animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-600 dark:text-red-400">স্থায়ীভাবে মুছে ফেলা নিশ্চিতকরণ</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">অর্ডার আইডি: {permanentDeleteTarget.orderId}</p>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-3 mb-6">
              <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed font-semibold">
                সতর্কতা: এটি স্থায়ীভাবে ডেটাবেস থেকে মুছে ফেলা হবে। এই কাজটি আর ফিরিয়ে নেওয়া বা পুনরুদ্ধার করা সম্ভব হবে না!
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPermanentDeleteTarget(null)}
                disabled={isPermanentDeleting}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 font-bold transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handlePermanentDelete}
                disabled={isPermanentDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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

      {/* IP Block / Unblock Modal */}
      {blockIpTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative rounded-3xl animate-scaleIn">
            <button
              onClick={() => setBlockIpTarget(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  blockIpTarget.ipAddress && blockedIpSet.has(blockIpTarget.ipAddress)
                    ? "bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                    : "bg-red-100 dark:bg-red-950/80 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400"
                }`}
              >
                {blockIpTarget.ipAddress && blockedIpSet.has(blockIpTarget.ipAddress) ? (
                  <ShieldCheck size={22} />
                ) : (
                  <ShieldAlert size={22} />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {blockIpTarget.ipAddress && blockedIpSet.has(blockIpTarget.ipAddress)
                    ? "আইপি আনব্লক ব্যবস্থাপনা"
                    : "আইপি ব্লক ব্যবস্থাপনা"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  অর্ডার: {blockIpTarget.orderId}
                </p>
              </div>
            </div>

            <div className="space-y-3.5 mb-6">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">গ্রাহকের নাম:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{blockIpTarget.customerName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">মোবাইল:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{blockIpTarget.phoneNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">গ্রাহকের আইপি:</span>
                  <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                    {blockIpTarget.ipAddress || "কোনো আইপি রেকর্ড নেই"}
                  </span>
                </div>
              </div>

              {blockIpTarget.ipAddress ? (
                blockedIpSet.has(blockIpTarget.ipAddress) ? (
                  <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl p-3">
                    <p className="text-xs text-red-600 dark:text-red-300 font-semibold flex items-center gap-1.5">
                      <ShieldBan size={15} /> এই আইপিটি বর্তমানে ব্লক করা আছে। আনব্লক করতে নিচের বাটনে চাপ দিন।
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      ব্লক করার কারণ (ঐচ্ছিক):
                    </label>
                    <input
                      type="text"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="যেমন: স্প্যাম অর্ডার / ফেক অর্ডার"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-red-500"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      ⚠️ আইপি ব্লক করলে এই আইপি থেকে আর কোনো অর্ডার করা যাবে না।
                    </p>
                  </div>
                )
              ) : (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                    এই পুরনো অর্ডারে কোনো আইপি অ্যাড্রেস সংরক্ষিত নেই। নতুন অর্ডারের সাথে আইপি স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBlockIpTarget(null)}
                disabled={isBlockingIp || isUnblockingIp}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 font-bold transition-colors cursor-pointer"
              >
                বাতিল
              </button>

              {blockIpTarget.ipAddress &&
                (blockedIpSet.has(blockIpTarget.ipAddress) ? (
                  <button
                    type="button"
                    onClick={handleUnblockIp}
                    disabled={isUnblockingIp}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isUnblockingIp ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        আনব্লক হচ্ছে...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={13} />
                        আইপি আনব্লক করুন
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleBlockIp}
                    disabled={isBlockingIp}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isBlockingIp ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        ব্লক হচ্ছে...
                      </>
                    ) : (
                      <>
                        <ShieldBan size={13} />
                        আইপি ব্লক করুন
                      </>
                    )}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
      {/* Bulk Status Confirmation Modal */}
      {bulkStatusTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] max-w-md w-full p-6 border border-blue-200 dark:border-blue-900 shadow-2xl relative rounded-3xl animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <RefreshCw size={20} className={isBulkUpdatingStatus ? "animate-spin" : ""} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">বাল্ক স্ট্যাটাস পরিবর্তন নিশ্চিতকরণ</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  নির্বাচিত {selectedIds.length} টি অর্ডার
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              আপনি কি নিশ্চিতভাবে নির্বাচিত <strong>{selectedIds.length} টি</strong> অর্ডারের স্ট্যাটাস পরিবর্তন করে{" "}
              <span className="font-black text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                {bulkStatusTarget}
              </span>{" "}
              করতে চান?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBulkStatusTarget(null)}
                disabled={isBulkUpdatingStatus}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 font-bold transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkStatus}
                disabled={isBulkUpdatingStatus}
                className="btn-gold px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isBulkUpdatingStatus ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    আপডেট হচ্ছে...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={13} />
                    হ্যাঁ, আপডেট করুন
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incomplete Order Conversion Modal */}
      {convertingTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0f172a] max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative rounded-3xl animate-scaleIn my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setConvertingTarget(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  অসম্পূর্ণ অর্ডারকে চূড়ান্ত অর্ডারে রূপান্তর
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  আইডি: INC-{convertingTarget._id.slice(-6).toUpperCase()}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-900/50">
              গ্রাহকের সাথে ফোনে কথা বলে ডেলিভারির সম্পূর্ণ ঠিকানা নিশ্চিত করুন। সম্পন্ন হলে এটি মূল অর্ডার টেবিলে যুক্ত হবে।
            </p>

            <form onSubmit={handleConfirmConvert} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  গ্রাহকের নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={convertForm.customerName}
                  onChange={(e) => setConvertForm({ ...convertForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  মোবাইল নম্বর <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={convertForm.phoneNumber}
                  onChange={(e) => setConvertForm({ ...convertForm, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  সম্পূর্ণ ডেলিভারি ঠিকানা <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={convertForm.address}
                  onChange={(e) => setConvertForm({ ...convertForm, address: e.target.value })}
                  placeholder="যেমন: বাসা/হোল্ডিং নম্বর, রোড, এলাকা/গ্রাম..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    জেলা (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={convertForm.district}
                    onChange={(e) => setConvertForm({ ...convertForm, district: e.target.value })}
                    placeholder="যেমন: ঢাকা"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    থানা / উপজেলা (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={convertForm.thana}
                    onChange={(e) => setConvertForm({ ...convertForm, thana: e.target.value })}
                    placeholder="যেমন: মিরপুর"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    পরিমাণ
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={convertForm.quantity}
                    onChange={(e) => handleConvertQtyChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    একক মূল্য (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={convertForm.unitPrice}
                    onChange={(e) => handleConvertUnitPriceChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ডেলিভারি (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={convertForm.deliveryCharge}
                    onChange={(e) => handleConvertDeliveryChargeChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">সর্বমোট প্রদেয় মূল্য:</span>
                <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                  ৳{convertForm.totalPrice}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  নোট / বিশেষ নির্দেশনা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={convertForm.orderNotes}
                  onChange={(e) => setConvertForm({ ...convertForm, orderNotes: e.target.value })}
                  placeholder="যেমন: গ্রাহক আগামীকাল ডেলিভারি চেয়েছেন..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConvertingTarget(null)}
                  disabled={isConvertingInc}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 font-bold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isConvertingInc}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isConvertingInc ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      রূপান্তর হচ্ছে...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} />
                      চূড়ান্ত অর্ডারে রূপান্তর করুন
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Incomplete Order Modal */}
      {deleteIncTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative rounded-3xl animate-scaleIn">
            <button
              onClick={() => setDeleteIncTarget(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  অসম্পূর্ণ অর্ডার মুছে ফেলা
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  আইডি: INC-{deleteIncTarget._id.slice(-6).toUpperCase()}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6">
              আপনি কি নিশ্চিত যে <span className="font-bold text-slate-900 dark:text-white">{deleteIncTarget.customerName}</span> ({deleteIncTarget.phoneNumber})-এর এই অসম্পূর্ণ অর্ডারটি তালিকা থেকে চিরতরে মুছে ফেলতে চান?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteIncTarget(null)}
                disabled={isDeletingInc}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 font-bold transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleDeleteIncomplete}
                disabled={isDeletingInc}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isDeletingInc ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    মুছে ফেলা হচ্ছে...
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    মুছে ফেলুন
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Steadfast Send Confirmation Modal */}
      {bulkSteadfastConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] max-w-md w-full p-6 border border-emerald-200 dark:border-emerald-900 shadow-2xl relative rounded-3xl animate-scaleIn">
            <button
              onClick={() => setBulkSteadfastConfirmOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Truck size={20} className={isSendingBulkSteadfast ? "animate-bounce" : ""} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">স্টিডফাস্ট কুরিয়ারে বুকিং</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  নির্বাচিত {selectedIds.length} টি অর্ডার
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              আপনি কি নিশ্চিতভাবে নির্বাচিত <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedIds.length} টি</strong> অর্ডারকে <strong>স্টিডফাস্ট কুরিয়ারে (Steadfast Bulk API)</strong> পাঠাতে চান? সফলভাবে বুকিং হলে প্রতিটি অর্ডারে কনসাইনমেন্ট আইডি এবং ট্র্যাকিং কোড যুক্ত হবে।
            </p>

            {sfConfig && !sfConfig.isConfigured && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-amber-500" />
                <span>সতর্কতা: ব্যাকএন্ড .env ফাইলে STEADFAST_API_KEY বা SECRET_KEY কনফিগার করা নেই।</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBulkSteadfastConfirmOpen(false)}
                disabled={isSendingBulkSteadfast}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 font-bold transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSendBulkSteadfast}
                disabled={isSendingBulkSteadfast}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSendingBulkSteadfast ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    পাঠানো হচ্ছে...
                  </>
                ) : (
                  <>
                    <Truck size={13} />
                    হ্যাঁ, পাঠিয়ে দিন ({selectedIds.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fraud Score Modal */}
      {fraudModalPhone && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative rounded-3xl animate-scaleIn">
            <button
              onClick={() => {
                setFraudModalPhone(null);
                setFraudData(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">স্টিডফাস্ট ফ্রড স্কোর চেক</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {fraudModalPhone}
                </p>
              </div>
            </div>

            {isCheckingFraud ? (
              <div className="py-8 text-center space-y-3">
                <Loader2 size={28} className="animate-spin text-amber-500 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  স্টিডফাস্ট কুরিয়ার ডাটাবেজ থেকে ডেলিভারি হিস্ট্রি যাচাই করা হচ্ছে...
                </p>
              </div>
            ) : fraudData && "error" in fraudData && fraudData.error ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    যাচাই করতে সমস্যা হয়েছে
                  </div>
                  <p>{fraudData.error}</p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setFraudModalPhone(null);
                      setFraudData(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            ) : fraudData && "success" in fraudData ? (
              <div className="space-y-4">
                {/* Risk Level Badge */}
                <div
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    fraudData.riskLevel === "low"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                      : fraudData.riskLevel === "medium"
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                      : fraudData.riskLevel === "high"
                      ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300"
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {fraudData.riskLevel === "low" ? (
                      <ShieldCheck size={18} className="text-emerald-600" />
                    ) : fraudData.riskLevel === "high" ? (
                      <ShieldBan size={18} className="text-red-600" />
                    ) : (
                      <ShieldAlert size={18} className="text-amber-600" />
                    )}
                    <div>
                      <span className="font-black text-xs block">
                        {fraudData.riskLevel === "low"
                          ? "কম ঝুঁকি (বিশ্বাসযোগ্য গ্রাহক)"
                          : fraudData.riskLevel === "medium"
                          ? "মাঝারি ঝুঁকি (সতর্ক থাকুন)"
                          : fraudData.riskLevel === "high"
                          ? "উচ্চ ঝুঁকি (অর্ডার বাতিলের প্রবণতা বেশি)"
                          : "কোনো পূর্ব হিস্ট্রি পাওয়া যায়নি"}
                      </span>
                      <span className="text-[11px] opacity-80">
                        সফলতার হার: {fraudData.deliveryRate !== null && fraudData.deliveryRate !== undefined ? `${fraudData.deliveryRate}%` : "নতুন গ্রাহক"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[11px] text-slate-400 block font-semibold">মোট পার্সেল</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {fraudData.totalParcels ?? 0} টি
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-semibold">ডেলিভারি সম্পন্ন</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {fraudData.delivered ?? 0} টি
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40">
                    <span className="text-[11px] text-red-600 dark:text-red-400 block font-semibold">রিটার্ন / বাতিল</span>
                    <span className="text-base font-black text-red-600 dark:text-red-400">
                      {fraudData.cancelled ?? 0} টি
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 block font-semibold">সফলতার হার</span>
                    <span className="text-base font-black text-blue-600 dark:text-blue-400">
                      {fraudData.deliveryRate !== null && fraudData.deliveryRate !== undefined ? `${fraudData.deliveryRate}%` : "—"}
                    </span>
                  </div>
                </div>

                {/* Phone Blocking Action */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {blockedPhoneSet.has(fraudModalPhone) ? "এই নম্বরটি ব্লক তালিকায় রয়েছে" : "অযাচিত অর্ডার প্রতিরোধে"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleBlockEntity("phone", fraudModalPhone, blockedPhoneSet.has(fraudModalPhone))
                    }
                    disabled={isBlockingEntity || isUnblockingEntity}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95 ${
                      blockedPhoneSet.has(fraudModalPhone)
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                        : "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                    }`}
                  >
                    {blockedPhoneSet.has(fraudModalPhone) ? (
                      <>
                        <ShieldCheck size={12} />
                        নম্বর আনব্লক করুন
                      </>
                    ) : (
                      <>
                        <ShieldBan size={12} />
                        নম্বর ব্লক করুন
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Manual Order Modal */}
      <ManualOrderModal
        isOpen={isManualOrderOpen}
        onClose={() => setIsManualOrderOpen(false)}
        onSuccess={() => {
          refetchActive();
          refetchIncomplete();
        }}
      />

      {/* Steadfast 2x3" Label / Sticker Printer Modal */}
      <SteadfastLabelPrinterModal
        isOpen={isLabelPrinterOpen}
        onClose={() => setIsLabelPrinterOpen(false)}
        incomingLabels={labelPrinterIncoming}
      />
    </div>
  );
}
