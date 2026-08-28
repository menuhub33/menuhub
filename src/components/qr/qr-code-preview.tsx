import { cn } from "@/components/lib/cn";
import { QrIcon } from "@/components/ui/icons";

export function QrCodePreview({
  qrUrl,
  name,
  className,
}: {
  qrUrl?: string | null;
  name?: string;
  className?: string;
}) {
  if (!qrUrl) {
    return (
      <div
        className={cn(
          "flex aspect-square w-full max-w-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400",
          className
        )}
      >
        <QrIcon className="size-10" />
        <p className="text-sm">لا توجد معاينة بعد</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrUrl}
        alt={name ? `رمز QR: ${name}` : "رمز QR"}
        className="aspect-square w-full object-contain"
      />
    </div>
  );
}
