"use client";

import { cn } from "@/components/lib/cn";
import { BuildingIcon, UtensilsIcon } from "@/components/ui/icons";
import { BUSINESS_TYPE_OPTIONS, normalizeBusinessType } from "@/lib/business-type";
import type { BusinessType } from "@/lib/types";

function TypeIcon({ type }: { type: BusinessType }) {
  if (type === "SHOP") return <BuildingIcon className="size-6" />;
  return <UtensilsIcon className="size-6" />;
}

export function BusinessTypePicker({
  value,
  onChange,
  disabled,
}: {
  value?: BusinessType | null;
  onChange: (type: BusinessType) => void;
  disabled?: boolean;
}) {
  const selected = normalizeBusinessType(value);

  return (
    <div className="grid gap-3">
      <div>
        <h2 className="text-base font-bold text-zinc-900">نوع النشاط</h2>
        <p className="mt-1 text-sm text-zinc-500">
          يحدده الأدمن فقط. يظهر في المنيو العام: تناول في المكان للمطاعم والكافيهات، أو الاستلام من المحل للمتاجر.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {BUSINESS_TYPE_OPTIONS.map((option) => {
          const active = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-2xl border p-4 text-start transition",
                active
                  ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600/20"
                  : "border-zinc-200 bg-white hover:border-teal-200",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              <span
                className={cn(
                  "mb-3 flex size-10 items-center justify-center rounded-xl",
                  active ? "bg-teal-600 text-white" : "bg-zinc-100 text-zinc-600"
                )}
              >
                <TypeIcon type={option.value} />
              </span>
              <p className="font-bold text-zinc-900">{option.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{option.hint}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
