"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyIcon, ExternalLinkIcon } from "@/components/ui/icons";

export function MenuLinkCard({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>رابط المنيو</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="truncate rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700" dir="ltr">
          {url}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => void copy()}>
            <CopyIcon className="size-4" />
            {copied ? "تم النسخ" : "نسخ"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => window.open(url, "_blank")}>
            <ExternalLinkIcon className="size-4" />
            فتح
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
