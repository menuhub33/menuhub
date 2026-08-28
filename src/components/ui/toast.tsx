"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/components/lib/cn";
import { XIcon } from "@/components/ui/icons";

type ToastVariant = "success" | "error" | "warning" | "info";

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = ToastInput & { id: string; variant: ToastVariant };

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantClass: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-white",
  error: "border-red-200 bg-white",
  warning: "border-amber-200 bg-white",
  info: "border-sky-200 bg-white",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((input: ToastInput) => {
    const id = crypto.randomUUID();
    const item: ToastItem = {
      ...input,
      id,
      variant: input.variant ?? "info",
    };
    setItems((current) => [...current, item]);
    const duration = input.duration ?? 4000;
    window.setTimeout(() => {
      setItems((current) => current.filter((toastItem) => toastItem.id !== id));
    }, duration);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end">
        {items.map((item) => (
          <Toast
            key={item.id}
            title={item.title}
            description={item.description}
            variant={item.variant}
            onClose={() =>
              setItems((current) => current.filter((toastItem) => toastItem.id !== item.id))
            }
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast يجب أن يُستخدم داخل ToastProvider");
  }
  return context;
}

export function Toast({
  title,
  description,
  variant = "info",
  onClose,
  className,
}: {
  title: string;
  description?: string;
  variant?: ToastVariant;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto w-full max-w-sm rounded-xl border p-4 shadow-lg",
        variantClass[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">{title}</p>
          {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
            aria-label="إغلاق"
          >
            <XIcon className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
