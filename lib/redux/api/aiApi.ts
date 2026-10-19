import { apiSlice } from "./apiSlice";

export interface ParseOrderResponse {
  success: boolean;
  data: {
    customerName: string;
    phoneNumber: string;
    address: string;
    amount: number;
    orderNotes: string;
  };
  message?: string;
  isConfigMissing?: boolean;
}

export const aiApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    parseOrderText: builder.mutation<ParseOrderResponse, { text: string }>({
      query: (body) => ({
        url: "/ai/parse-order",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useParseOrderTextMutation } = aiApi;
