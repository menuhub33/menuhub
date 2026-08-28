"use client";

import { ImageUpload } from "@/components/upload/image-upload";

export function RestaurantCoverUpload({
  value,
  onUploaded,
  onUpload,
}: {
  value?: string | null;
  onUploaded?: (url: string | null) => void;
  onUpload?: (file: File) => Promise<string>;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-zinc-800">صورة الغلاف</p>
      <ImageUpload
        value={value}
        onUpload={onUpload}
        onChange={(result) => onUploaded?.(result?.previewUrl ?? null)}
        aspectHint="يفضّل صورة غلاف أفقية"
      />
    </div>
  );
}
