import type { Metadata } from "next";

export const metadata: Metadata = { title: "نقطة البيع" };

/** Standalone full-screen shell: no dashboard chrome, the till owns the viewport. */
export default function PosLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-40 bg-zinc-50">{children}</div>;
}
