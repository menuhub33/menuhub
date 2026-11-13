import type { Metadata } from "next";

export const metadata: Metadata = { title: "شاشة المطبخ" };

/** Standalone full-screen shell: the kitchen display owns the viewport. */
export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-40 bg-zinc-100">{children}</div>;
}
