"use client";

import { ImageUpload } from "@/components/upload/image-upload";

export function CategoryImageUpload({
  value,
  onUploaded,
  onUpload,
  disabled,
}: {
  value?: string | null;
  onUploaded?: (url: string | null) => void;
  onUpload?: (file: File) => Promise<string>;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-zinc-800">صورة القسم</p>
      <ImageUpload
        value={value}
        onUpload={onUpload}
        onChange={(result) => onUploaded?.(result?.previewUrl ?? null)}
        aspectHint="يفضّل صورة أفقية للقسم"
        disabled={disabled}
      />
    </div>
  );
}
