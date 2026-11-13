import type { Metadata } from "next";

export const metadata: Metadata = { title: "شاشة النادل" };

export default function WaiterLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-40 bg-zinc-50">{children}</div>;
}
