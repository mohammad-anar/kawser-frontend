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
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useAdminLoginMutation,
  useGetMeQuery,
} = authApi;
