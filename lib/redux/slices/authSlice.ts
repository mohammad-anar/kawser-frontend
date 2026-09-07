import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: "customer" | "admin";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const getInitialAuth = (): AuthState => {
  if (typeof window === "undefined") {
    return { user: null, token: null, isAuthenticated: false };
  }
  try {
    const token = localStorage.getItem("pc_token");
    const userStr = localStorage.getItem("pc_user");
    const user = userStr ? JSON.parse(userStr) : null;
    return {
      user,
      token,
      isAuthenticated: Boolean(token && user),
    };
  } catch {
    return { user: null, token: null, isAuthenticated: false };
  }
};

const initialState: AuthState = getInitialAuth();

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      if (typeof window !== "undefined") {
        localStorage.setItem("pc_token", action.payload.token);
        localStorage.setItem("pc_user", JSON.stringify(action.payload.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("pc_token");
        localStorage.removeItem("pc_user");
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
