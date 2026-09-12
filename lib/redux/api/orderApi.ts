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
  orderNotes?: string;
  userId?: string;
  productName?: string;
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
  status: "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  isGuestOrder: boolean;
  orderNotes?: string;
  statusHistory?: {
    status: string;
    changedAt: string;
    changedBy?: string;
    note?: string;
  }[];
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
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
  page?: number;
  limit?: number;
}

export interface AdminOrdersResponse {
  success: boolean;
  orders: OrderData[];
  total: number;
  page: number;
  pages: number;
}

export const orderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation<CreateOrderResponse, CreateOrderRequest>({
      query: (orderData) => ({
        url: "/orders",
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

    exportOrdersCSV: builder.mutation<
      string,
      { ids?: string[]; status?: string }
    >({
      query: (body) => ({
        url: "/orders/admin/export",
        method: "POST",
        body,
        responseHandler: (response) => response.text(),
      }),
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useTrackOrderQuery,
  useLazyTrackOrderQuery,
  useGetMyOrdersQuery,
  useGetAllOrdersQuery,
  useGetOrderStatsQuery,
  useUpdateOrderStatusMutation,
  useExportOrdersCSVMutation,
} = orderApi;
