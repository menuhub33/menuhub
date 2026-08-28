"use client";

import { useState } from "react";
import { cn } from "@/components/lib/cn";
import { Button } from "@/components/ui/button";
import { CopyIcon, ShareIcon } from "@/components/ui/icons";

export function ShareMenu({
  title,
  text,
  url,
  onShare,
  className,
}: {
  title: string;
  text?: string;
  url?: string;
  onShare?: () => void;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink(shareUrl: string) {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
    onShare?.();
  }

  async function share() {
    const shareUrl = url ?? window.location.href;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title,
          text: text ?? title,
          url: shareUrl,
        });
        onShare?.();
        return;
      }
      await copyLink(shareUrl);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await copyLink(shareUrl);
      } catch {
        return;
      }
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => void share()}
      className={cn(
        "bg-[var(--mh-bg)]/90 text-[var(--mh-text)] shadow-sm backdrop-blur-sm hover:bg-[var(--mh-bg)]",
        className
      )}
      aria-label="مشاركة المنيو"
    >
      {copied ? <CopyIcon className="size-4" /> : <ShareIcon className="size-4" />}
      {copied ? "تم النسخ" : "مشاركة"}
    </Button>
  );
}
