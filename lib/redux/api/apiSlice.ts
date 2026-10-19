import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    const isProduction =
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";
    if (isProduction) {
      const configured = process.env.NEXT_PUBLIC_API_URL;
      if (configured && !configured.includes("localhost") && !configured.includes("127.0.0.1")) {
        return configured;
      }
      return "https://kawser-backend-wvmd.onrender.com/api";
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
};

const API_BASE_URL = getApiBaseUrl();

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("pc_token");
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ["Order", "AdminStats", "User", "SingleOrder", "BlockedIp", "IncompleteOrder"],
  endpoints: () => ({}),
});
