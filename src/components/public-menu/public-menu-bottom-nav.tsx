"use client";

import { cn } from "@/components/lib/cn";
import { CartIcon, GridFourIcon, HomeIcon, UndoIcon } from "@/components/ui/icons";

export type PublicMenuTab = "home" | "cart" | "categories";

export function PublicMenuBottomNav({
  active,
  cartCount,
  onHome,
  onCart,
  onCategories,
  onBack,
}: {
  active: PublicMenuTab;
  cartCount: number;
  onHome: () => void;
  onCart: () => void;
  onCategories: () => void;
  onBack: () => void;
}) {
  const items = [
    { id: "home" as const, label: "الرئيسية", icon: HomeIcon, onClick: onHome },
    { id: "cart" as const, label: "السلة", icon: CartIcon, onClick: onCart, badge: cartCount },
    { id: "categories" as const, label: "التصنيفات", icon: GridFourIcon, onClick: onCategories },
    { id: "back" as const, label: "رجوع", icon: UndoIcon, onClick: onBack },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--mh-text)]/8 bg-[var(--mh-bg)]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-md"
      aria-label="التنقل"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-4 px-2 pt-2 pb-2">
        {items.map((item) => {
          const Icon = item.icon;
          const current = item.id !== "back" && item.id === active;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={item.onClick}
                className={cn(
                  "relative flex w-full flex-col items-center gap-1 rounded-xl py-1 text-[11px] font-medium",
                  current ? "text-[var(--mh-primary)]" : "text-[var(--mh-text)]/55"
                )}
              >
                <span className="relative">
                  <Icon className="size-5" />
                  {item.badge ? (
                    <span
                      lang="en"
                      dir="ltr"
                      className="absolute -top-1.5 -end-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white tabular-nums"
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  ) : null}
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
