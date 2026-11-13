"use client";

import { createContext, useContext } from "react";
import type { PosMode } from "@/modules/tenancy/types";

const PosModeContext = createContext<PosMode>("OFF");

/** Makes the restaurant's POS package available to client components of the dashboard. */
export function PosModeProvider({ mode, children }: { mode: PosMode; children: React.ReactNode }) {
  return <PosModeContext.Provider value={mode}>{children}</PosModeContext.Provider>;
}

export function usePosMode(): PosMode {
  return useContext(PosModeContext);
}

export const POS_MODE_OPTIONS: { value: PosMode; label: string; hint: string }[] = [
  { value: "OFF", label: "غير مفعّلة", hint: "لا يظهر للمحل أي شيء من نقطة البيع." },
  { value: "CASHIER", label: "كاشير فقط", hint: "شاشة الكاشير والفواتير والتقارير، بدون شاشة النادل." },
  { value: "CASHIER_WAITER", label: "كاشير ونادل", hint: "شاشة الكاشير وشاشة النادل (يرسل الطلب ويحصّله الكاشير)." },
];
