"use client";

import { cn } from "@/components/lib/cn";
import { formatDate } from "@/components/lib/format";
import { QrCodeDownload } from "@/components/qr/qr-code-download";
import { QrCodePreview } from "@/components/qr/qr-code-preview";
import { printQrSheet } from "@/components/qr/qr-code-print";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrinterIcon } from "@/components/ui/icons";
import type { QrCode } from "@/lib/types";

export function QrCodeCard({
  qr,
  restaurantName,
  onPrint,
  className,
}: {
  qr: QrCode;
  restaurantName?: string;
  onPrint?: (qr: QrCode) => void;
  className?: string;
}) {
  const formatLabel = qr.format.toUpperCase() === "SVG" ? "SVG" : "PNG";

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{qr.name}</CardTitle>
            {restaurantName ? (
              <p className="mt-0.5 text-sm text-zinc-500">{restaurantName}</p>
            ) : null}
          </div>
          <Badge variant="teal">{formatLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <QrCodePreview qrUrl={qr.qr_url} name={qr.name} className="mx-auto max-w-52" />
        <p className="text-center text-xs text-zinc-400">
          {formatDate(qr.created_at)}
          {qr.logo_enabled ? " · مع الشعار" : ""}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <QrCodeDownload qrUrl={qr.qr_url} name={qr.name} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onPrint) onPrint(qr);
              else printQrSheet(qr.qr_url, qr.name, restaurantName);
            }}
          >
            <PrinterIcon className="size-4" />
            طباعة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
