import { apiSlice } from "./apiSlice";

export interface CreateOrderRequest {
  customerName: string;
  phoneNumber: string;
  email?: string;
  address: string;
  district?: string;
  thana?: string;
  gpsCoordinates?: { lat: number; lng: number };
  quantity: number;
  size?: string;
  unitPrice?: number;
  orderNotes?: string;
  userId?: string;
  productName?: string;
  deviceId?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  orderId: string;
  totalPrice: number;
  productName?: string;
  estimatedDelivery: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  size?: string;
}

export interface BlockedEntityData {
  _id?: string;
  type: "ip" | "phone" | "device";
  value: string;
  reason?: string;
  blockedBy?: string;
  createdAt?: string;
}

export interface OrderData {
  _id: string;
  orderId: string;
  customerName: string;
  phoneNumber: string;
  email?: string;
  address: string;
  district?: string;
  thana?: string;
  gpsCoordinates?: { lat: number; lng: number };
  productName: string;
  quantity: number;
  size?: string;
  unitPrice: number;
  deliveryCharge: number;
  totalPrice: number;
  paymentMethod: string;
  status: "Pending" | "Confirmed" | "Scheduled" | "Processing" | "Hold" | "Shipped" | "Delivered" | "Cancelled";
  ipAddress?: string;
  deviceId?: string;
  isGuestOrder: boolean;
  orderNotes?: string;
  steadfast?: {
    consignmentId?: number | null;
    trackingCode?: string;
    status?: string;
    sentAt?: string | null;
    responseMessage?: string;
  };
  statusHistory?: {
    status: string;
    changedAt: string;
    changedBy?: string;
    note?: string;
  }[];
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface FraudScoreResponse {
  success: boolean;
  phone?: string;
  totalParcels?: number;
  delivered?: number;
  cancelled?: number;
  deliveryRate?: number | null;
  riskLevel?: "low" | "medium" | "high" | "unknown";
  volumeRange?: string | null;
  volumeBand?: string | null;
  totalReports?: number;
  cancellationRatio?: number | null;
  returnRatio?: number | null;
  fraudReports?: any[];
  message?: string;
}

export interface SteadfastSendResponse {
  success: boolean;
  message: string;
  order?: OrderData;
  consignment?: {
    consignment_id?: number;
    tracking_code?: string;
    status?: string;
    invoice?: string;
  };
  successCount?: number;
  failedCount?: number;
  updatedOrders?: OrderData[];
}

export interface UpdateOrderRequest {
  id: string;
  customerName?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  district?: string;
  thana?: string;
  productName?: string;
  quantity?: number;
  size?: string;
  unitPrice?: number;
  deliveryCharge?: number;
  totalPrice?: number;
  paymentMethod?: string;
  status?: string;
  orderNotes?: string;
}

export interface CreateManualOrderRequest {
  customerName: string;
  phoneNumber: string;
  email?: string;
  address: string;
  district?: string;
  thana?: string;
  productName?: string;
  quantity?: number;
  size?: string;
  unitPrice?: number;
  deliveryCharge?: number;
  totalPrice?: number;
  paymentMethod?: string;
  status?: string;
  orderNotes?: string;
}

export interface TrackOrderParams {
  orderId?: string;
  phone?: string;
}

export interface AdminStatsResponse {
  success: boolean;
  stats: {
    totalOrders: number;
    deliveredOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    uniqueCustomers: number;
    totalRevenue: number;
    deliveryRate: number;
  };
  dailyTrend: {
    date: string;
    count: number;
    revenue: number;
  }[];
}

export interface AdminOrdersParams {
  status?: string;
  search?: string;
  phone?: string;
  size?: string;
  page?: number;
  limit?: number;
  isDeleted?: boolean;
}

export interface AdminOrdersResponse {
  success: boolean;
  orders: OrderData[];
  total: number;
  page: number;
  pages: number;
}

export const orderApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createOrder: builder.mutation<CreateOrderResponse, CreateOrderRequest>({
      query: (orderData) => ({
        url: "/orders",
        method: "POST",
        body: orderData,
      }),
      invalidatesTags: ["Order", "AdminStats"],
    }),

    createManualOrder: builder.mutation<
      { success: boolean; message: string; order: OrderData },
      CreateManualOrderRequest
    >({
      query: (orderData) => ({
        url: "/orders/admin/manual",
        method: "POST",
        body: orderData,
      }),
      invalidatesTags: ["Order", "AdminStats"],
    }),

    trackOrder: builder.query<{ success: boolean; order: OrderData }, TrackOrderParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.orderId) queryParams.set("orderId", params.orderId);
        if (params.phone) queryParams.set("phone", params.phone);
        return `/orders/track?${queryParams.toString()}`;
      },
      providesTags: (result, error, arg) => [
        { type: "SingleOrder", id: arg.orderId || arg.phone },
      ],
    }),

    getMyOrders: builder.query<{ success: boolean; orders: OrderData[] }, void>({
      query: () => "/orders/my",
      providesTags: ["Order"],
    }),

    getAllOrders: builder.query<AdminOrdersResponse, AdminOrdersParams>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params.status && params.status !== "all") qp.set("status", params.status);
        if (params.search) qp.set("search", params.search);
        if (params.phone) qp.set("phone", params.phone);
        if (params.size && params.size !== "all") qp.set("size", params.size);
        if (params.isDeleted !== undefined) qp.set("isDeleted", params.isDeleted.toString());
        if (params.page) qp.set("page", params.page.toString());
        if (params.limit) qp.set("limit", params.limit.toString());
        return `/orders/admin/all?${qp.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.orders.map(({ _id }) => ({ type: "Order" as const, id: _id })),
              { type: "Order", id: "LIST" },
            ]
          : [{ type: "Order", id: "LIST" }],
    }),

    getOrderStats: builder.query<AdminStatsResponse, void>({
      query: () => "/orders/admin/stats",
      providesTags: ["AdminStats"],
    }),

    updateOrderStatus: builder.mutation<
      { success: boolean; message: string; order: OrderData },
      { id: string; status: string }
    >({
      query: ({ id, status }) => ({
        url: `/orders/admin/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Order", id },
        { type: "Order", id: "LIST" },
        "AdminStats",
      ],
    }),

    bulkUpdateOrderStatus: builder.mutation<
      { success: boolean; message: string; modifiedCount: number },
      { ids: string[]; status: string }
    >({
      query: (body) => ({
        url: "/orders/admin/bulk-status",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Order", "AdminStats"],
    }),

    updateOrder: builder.mutation<
      { success: boolean; message: string; order: OrderData },
      UpdateOrderRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/orders/admin/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Order", id },
        { type: "Order", id: "LIST" },
        "AdminStats",
      ],
    }),

    softDeleteOrder: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/orders/admin/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Order", "AdminStats"],
    }),

    restoreOrder: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/orders/admin/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: ["Order", "AdminStats"],
    }),

    permanentDeleteOrder: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/orders/admin/${id}/permanent`,
        method: "DELETE",
      }),
      invalidatesTags: ["Order", "AdminStats"],
    }),

    exportOrdersCSV: builder.mutation<
      Blob,
      { ids?: string[]; status?: string; isDeleted?: boolean; size?: string }
    >({
      query: (body) => ({
        url: "/orders/admin/export",
        method: "POST",
        body,
        responseHandler: (response) => response.blob(),
      }),
    }),

    exportOrdersExcel: builder.mutation<
      Blob,
      { ids?: string[]; status?: string; isDeleted?: boolean; size?: string }
    >({
      query: (body) => ({
        url: "/orders/admin/export",
        method: "POST",
        body,
        responseHandler: (response) => response.blob(),
      }),
    }),

    getBlockedIps: builder.query<{ success: boolean; blockedIps: BlockedIpData[] }, void>({
      query: () => "/orders/admin/blocked-ips",
      providesTags: ["BlockedIp"],
    }),

    getBlockedEntities: builder.query<{ success: boolean; entities: BlockedEntityData[] }, void>({
      query: () => "/orders/admin/blocked-entities",
      providesTags: ["BlockedIp"],
    }),

    blockEntity: builder.mutation<
      { success: boolean; message: string; entity?: BlockedEntityData },
      { type: "ip" | "phone" | "device"; value: string; reason?: string }
    >({
      query: (body) => ({
        url: "/orders/admin/block-entity",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BlockedIp"],
    }),

    unblockEntity: builder.mutation<
      { success: boolean; message: string },
      { type: "ip" | "phone" | "device"; value: string }
    >({
      query: (body) => ({
        url: "/orders/admin/unblock-entity",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BlockedIp"],
    }),

    blockAllEntities: builder.mutation<
      { success: boolean; message: string },
      { ip?: string; phone?: string; deviceId?: string; reason?: string }
    >({
      query: (body) => ({
        url: "/orders/admin/block-all",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BlockedIp"],
    }),

    unblockAllEntities: builder.mutation<
      { success: boolean; message: string },
      { ip?: string; phone?: string; deviceId?: string }
    >({
      query: (body) => ({
        url: "/orders/admin/unblock-all",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BlockedIp"],
    }),

    blockIp: builder.mutation<
      { success: boolean; message: string; blockedIp?: BlockedIpData },
      { ip: string; reason?: string }
    >({
      query: (body) => ({
        url: "/orders/admin/block-ip",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BlockedIp"],
    }),

    unblockIp: builder.mutation<{ success: boolean; message: string }, string>({
      query: (ip) => ({
        url: `/orders/admin/block-ip/${encodeURIComponent(ip)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BlockedIp"],
    }),

    recordIncompleteOrder: builder.mutation<
      { success: boolean; message: string; incompleteOrder: IncompleteOrderData },
      Partial<IncompleteOrderData>
    >({
      query: (body) => ({
        url: "/orders/incomplete",
        method: "POST",
        body,
      }),
      invalidatesTags: ["IncompleteOrder"],
    }),

    getIncompleteOrders: builder.query<
      {
        success: boolean;
        incompleteOrders: IncompleteOrderData[];
        total: number;
        page: number;
        pages: number;
      },
      { page?: number; limit?: number; search?: string; status?: string; size?: string }
    >({
      query: (params) => ({
        url: "/orders/admin/incomplete",
        params,
      }),
      providesTags: ["IncompleteOrder"],
    }),

    updateIncompleteOrderStatus: builder.mutation<
      { success: boolean; message: string; incompleteOrder: IncompleteOrderData },
      { id: string; status?: string; adminNotes?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/orders/admin/incomplete/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["IncompleteOrder"],
    }),

    convertIncompleteOrder: builder.mutation<
      { success: boolean; message: string; order: OrderData },
      { id: string; [key: string]: any }
    >({
      query: ({ id, ...body }) => ({
        url: `/orders/admin/incomplete/${id}/convert`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["IncompleteOrder", "Order", "AdminStats"],
    }),

    deleteIncompleteOrder: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/orders/admin/incomplete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["IncompleteOrder"],
    }),

    sendOrderToSteadfast: builder.mutation<SteadfastSendResponse, string>({
      query: (id) => ({
        url: `/steadfast/send-order/${id}`,
        method: "POST",
      }),
      invalidatesTags: ["Order", "AdminStats"],
    }),

    sendBulkOrdersToSteadfast: builder.mutation<SteadfastSendResponse, { orderIds: string[] }>({
      query: (body) => ({
        url: `/steadfast/send-bulk`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Order", "AdminStats"],
    }),

    checkSteadfastStatus: builder.query<{ success: boolean; delivery_status?: string; steadfast?: any }, string>({
      query: (orderId) => `/steadfast/status/${orderId}`,
      providesTags: ["Order"],
    }),

    checkFraudScore: builder.query<FraudScoreResponse, string>({
      query: (phone) => `/steadfast/fraud-score/${encodeURIComponent(phone)}`,
    }),

    getSteadfastConfigStatus: builder.query<{ success: boolean; isConfigured: boolean; baseUrl?: string }, void>({
      query: () => `/steadfast/config-status`,
    }),
  }),
});

export interface IncompleteOrderData {
  _id: string;
  customerName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  district?: string;
  thana?: string;
  productName: string;
  quantity: number;
  size?: string;
  unitPrice: number;
  deliveryCharge?: number;
  totalPrice: number;
  ipAddress?: string;
  deviceId?: string;
  status: "Pending" | "Contacted" | "Converted" | "Cancelled";
  adminNotes?: string;
  orderNotes?: string;
  hasPreviousOrders?: boolean;
  previousOrdersCount?: number;
  convertedOrderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlockedIpData {
  _id?: string;
  ip: string;
  reason?: string;
  blockedBy?: string;
  createdAt: string;
}

export const {
  useCreateOrderMutation,
  useCreateManualOrderMutation,
  useTrackOrderQuery,
  useLazyTrackOrderQuery,
  useGetMyOrdersQuery,
  useGetAllOrdersQuery,
  useGetOrderStatsQuery,
  useUpdateOrderStatusMutation,
  useUpdateOrderMutation,
  useSoftDeleteOrderMutation,
  useRestoreOrderMutation,
  usePermanentDeleteOrderMutation,
  useExportOrdersCSVMutation,
  useExportOrdersExcelMutation,
  useGetBlockedIpsQuery,
  useGetBlockedEntitiesQuery,
  useBlockEntityMutation,
  useUnblockEntityMutation,
  useBlockAllEntitiesMutation,
  useUnblockAllEntitiesMutation,
  useBlockIpMutation,
  useUnblockIpMutation,
  useBulkUpdateOrderStatusMutation,
  useRecordIncompleteOrderMutation,
  useGetIncompleteOrdersQuery,
  useUpdateIncompleteOrderStatusMutation,
  useConvertIncompleteOrderMutation,
  useDeleteIncompleteOrderMutation,
  useSendOrderToSteadfastMutation,
  useSendBulkOrdersToSteadfastMutation,
  useCheckSteadfastStatusQuery,
  useLazyCheckSteadfastStatusQuery,
  useCheckFraudScoreQuery,
  useLazyCheckFraudScoreQuery,
  useGetSteadfastConfigStatusQuery,
} = orderApi;

