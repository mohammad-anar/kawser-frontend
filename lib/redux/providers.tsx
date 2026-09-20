"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { setCredentials } from "./slices/authSlice";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      const token = localStorage.getItem("pc_token");
      const userStr = localStorage.getItem("pc_user");
      if (token && userStr) {
        const user = JSON.parse(userStr);
        if (user && (user.id || user._id || user.role)) {
          store.dispatch(setCredentials({ user, token }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  return <>{children}</>;
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
