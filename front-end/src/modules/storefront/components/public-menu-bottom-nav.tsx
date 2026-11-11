"use client";

import { cn } from "@/core/lib/cn";
import { AlertCircleIcon, CartIcon, GridFourIcon, HomeIcon, UndoIcon } from "@/core/ui/icons";

export type PublicMenuTab = "home" | "cart" | "categories" | "complaints";

export function PublicMenuBottomNav({
  active,
  cartCount,
  onHome,
  onCart,
  onCategories,
  onComplaints,
  onBack,
  hideCart = false,
}: {
  active: PublicMenuTab;
  cartCount: number;
  onHome: () => void;
  onCart?: () => void;
  onCategories: () => void;
  onComplaints?: () => void;
  onBack: () => void;
  hideCart?: boolean;
}) {
  const items = [
    { id: "home" as const, label: "الرئيسية", icon: HomeIcon, onClick: onHome },
    { id: "cart" as const, label: "السلة", icon: CartIcon, onClick: onCart, badge: cartCount },
    { id: "complaints" as const, label: "شكاوي", icon: AlertCircleIcon, onClick: onComplaints },
    { id: "categories" as const, label: "التصنيفات", icon: GridFourIcon, onClick: onCategories },
    { id: "back" as const, label: "رجوع", icon: UndoIcon, onClick: onBack },
  ].filter((item) => {
    if (hideCart && item.id === "cart") return false;
    if (!onComplaints && item.id === "complaints") return false;
    return true;
  });

  const columns =
    items.length >= 5 ? "grid-cols-5" : items.length === 4 ? "grid-cols-4" : "grid-cols-3";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--mh-text)]/8 bg-[var(--mh-bg)]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-md"
      aria-label="التنقل"
    >
      <ul className={cn("mx-auto grid w-full max-w-lg px-1 pt-1.5 pb-1.5 sm:max-w-xl sm:px-2 sm:pt-2 sm:pb-2", columns)}>
        {items.map((item) => {
          const Icon = item.icon;
          const current = item.id !== "back" && item.id === active;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={item.onClick}
                className={cn(
                  "relative flex w-full min-w-0 flex-col items-center gap-0.5 rounded-xl px-0.5 py-1 text-[9px] font-medium leading-tight min-[360px]:text-[10px] sm:gap-1 sm:text-[11px]",
                  current ? "text-[var(--mh-primary)]" : "text-[var(--mh-text)]/55"
                )}
              >
                <span className="relative">
                  <Icon className="size-5" />
                  {"badge" in item && item.badge ? (
                    <span
                      lang="en"
                      dir="ltr"
                      className="absolute -top-1.5 -end-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white tabular-nums"
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  ) : null}
                </span>
                <span className="max-w-full truncate">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
