"use client";

import { createContext, useContext } from "react";
import { ToastProvider } from "@/core/ui/toast";
import { publicMenuHost, publicMenuUrl } from "@/core/config";

const RequestOriginContext = createContext({ host: "", protocol: "" });

export function Providers({
  children,
  host,
  protocol,
}: {
  children: React.ReactNode;
  host: string;
  protocol: string;
}) {
  return (
    <RequestOriginContext.Provider value={{ host, protocol }}>
      <ToastProvider>{children}</ToastProvider>
    </RequestOriginContext.Provider>
  );
}

export function usePublicMenuUrl(slug: string) {
  const origin = useContext(RequestOriginContext);
  return publicMenuUrl(slug, origin.host, origin.protocol);
}

export function usePublicMenuHost(slug: string) {
  const origin = useContext(RequestOriginContext);
  return publicMenuHost(slug, origin.host);
}
