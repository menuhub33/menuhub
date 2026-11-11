import Link from "next/link";
import { cn } from "@/core/lib/cn";

export function BrandMark({
  href,
  compact = false,
  className,
  imageClassName,
}: {
  href: string;
  compact?: boolean;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <Link href={href} className={cn("block", className)}>
      <img
        src={compact ? "/menuhub-mark.png" : "/menuhub-logo.png"}
        alt="MenuHub"
        className={cn(
          "w-full object-contain",
          imageClassName ?? (compact ? "size-10" : "h-32"),
        )}
      />
    </Link>
  );
}
