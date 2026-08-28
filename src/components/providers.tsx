"use client";

import { ToastProvider } from "@/components/ui/toast";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ToastProvider>{children}</ToastProvider>
    </AppRouterCacheProvider>
  );
}
