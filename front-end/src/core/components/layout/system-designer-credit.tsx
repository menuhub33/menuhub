"use client";

import { usePathname } from "next/navigation";
import { DesignerCredit } from "@/core/components/layout/designer-credit";

/** Shown on pages that do not already place the credit in a shell or a menu. */
export function SystemDesignerCredit() {
  const pathname = usePathname();
  const placedElsewhere =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/m/") ||
    pathname.startsWith("/c/");

  if (placedElsewhere) return null;

  return (
    <footer className="px-4 py-4">
      <DesignerCredit />
    </footer>
  );
}
