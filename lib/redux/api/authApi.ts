import { apiSlice } from "./apiSlice";
import { setCredentials, logout } from "../slices/authSlice";

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    role: "customer" | "admin";
  };
}

export interface RegisterRequest {
  name: string;
  phone: string;
  email?: string;
  password: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface AdminLoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (credentials) => ({
        url: "/auth/register",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.token && data.user) {
            dispatch(setCredentials({ user: data.user, token: data.token }));
          }
        } catch {
          // ignore
        }
      },
      invalidatesTags: ["User"],
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.token && data.user) {
            dispatch(setCredentials({ user: data.user, token: data.token }));
          }
        } catch {
          // ignore
        }
      },
      invalidatesTags: ["User"],
    }),
    adminLogin: builder.mutation<AuthResponse, AdminLoginRequest>({
      query: (credentials) => ({
        url: "/auth/admin/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.token && data.user) {
            dispatch(setCredentials({ user: data.user, token: data.token }));
          }
        } catch {
          // ignore
        }
      },
      invalidatesTags: ["User", "AdminStats", "Order"],
    }),
    getMe: builder.query<{ success: boolean; user: any }, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),

    // ── Forgot Password Flow (public) ────────────────────────────────────────
    forgotPassword: builder.mutation<{ success: boolean; message: string }, { email: string }>({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),
    verifyForgotOtp: builder.mutation<
      { success: boolean; message: string; resetToken: string },
      { email: string; otp: string }
    >({
      query: (body) => ({
        url: "/auth/verify-forgot-otp",
        method: "POST",
        body,
      }),
    }),
    resetPassword: builder.mutation<
      { success: boolean; message: string },
      { newPassword: string; resetToken: string }
    >({
      query: ({ newPassword, resetToken }) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: { newPassword },
        headers: { Authorization: `Bearer ${resetToken}` },
      }),
    }),

    // ── Change Password Flow (admin logged in) ───────────────────────────────
    sendChangeOtp: builder.mutation<
      { success: boolean; message: string; email: string },
      void
    >({
      query: () => ({
        url: "/auth/send-change-otp",
        method: "POST",
      }),
    }),
    verifyChangeOtp: builder.mutation<
      { success: boolean; message: string; resetToken: string },
      { otp: string }
    >({
      query: (body) => ({
        url: "/auth/verify-change-otp",
        method: "POST",
        body,
      }),
    }),
    changePassword: builder.mutation<
      { success: boolean; message: string },
      { newPassword: string; resetToken: string }
    >({
      query: ({ newPassword, resetToken }) => ({
        url: "/auth/change-password",
        method: "POST",
        body: { newPassword },
        headers: { "X-Reset-Token": resetToken },
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useAdminLoginMutation,
  useGetMeQuery,
  useForgotPasswordMutation,
  useVerifyForgotOtpMutation,
  useResetPasswordMutation,
  useSendChangeOtpMutation,
  useVerifyChangeOtpMutation,
  useChangePasswordMutation,
} = authApi;
