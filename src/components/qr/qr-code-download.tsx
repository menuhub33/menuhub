import { cn } from "@/components/lib/cn";
import { DownloadIcon } from "@/components/ui/icons";

function fileStem(name: string): string {
  const cleaned = name.trim().replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, "-");
  return cleaned || "qr-code";
}

const downloadLinkClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-400/30";

export function QrCodeDownload({
  qrUrl,
  pngUrl,
  svgUrl,
  name = "رمز-qr",
  className,
}: {
  qrUrl?: string;
  pngUrl?: string;
  svgUrl?: string;
  name?: string;
  className?: string;
}) {
  const png = pngUrl ?? qrUrl;
  const svg = svgUrl ?? qrUrl;
  const stem = fileStem(name);

  if (!png && !svg) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {png ? (
        <a href={png} download={`${stem}.png`} className={downloadLinkClass}>
          <DownloadIcon className="size-4" />
          تحميل PNG
        </a>
      ) : null}
      {svg ? (
        <a href={svg} download={`${stem}.svg`} className={downloadLinkClass}>
          <DownloadIcon className="size-4" />
          تحميل SVG
        </a>
      ) : null}
    </div>
  );
}
