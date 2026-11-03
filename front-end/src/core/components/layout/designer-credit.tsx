import { cn } from "@/core/lib/cn";

export const DESIGNER = {
  name: "م. منتصر الحاج عمر",
  phone: "+905316924944",
  phoneHref: "tel:+905316924944",
} as const;

export function DesignerCredit({
  className,
  onMenu = false,
}: {
  className?: string;
  onMenu?: boolean;
}) {
  return (
    <p
      className={cn(
        "text-center text-xs leading-relaxed",
        onMenu ? "text-[var(--mh-text)]/70" : "text-zinc-500",
        className
      )}
    >
      برمجة وتطوير <span className="font-semibold">{DESIGNER.name}</span>
      <span className="px-1">-</span>
      <a
        href={DESIGNER.phoneHref}
        dir="ltr"
        className="inline-block font-medium underline-offset-2 hover:underline"
      >
        {DESIGNER.phone}
      </a>
    </p>
  );
}
