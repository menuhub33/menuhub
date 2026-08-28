"use client";

import { ImageUpload, type ImageUploadResult } from "@/components/upload/image-upload";

export function ProductImageUpload({
  value,
  label = "الصورة الرئيسية",
  disabled,
  onUploaded,
  onUpload,
  onChange,
}: {
  value?: string | null;
  label?: string;
  disabled?: boolean;
  onUploaded?: (url: string | null) => void;
  onUpload?: (file: File) => Promise<string>;
  onChange?: (result: ImageUploadResult | null) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-zinc-800">{label}</p>
      <ImageUpload
        value={value}
        disabled={disabled}
        onUpload={onUpload}
        aspectHint="يفضّل صورة مربعة وواضحة"
        onChange={(result) => {
          onChange?.(result);
          onUploaded?.(result?.previewUrl ?? null);
        }}
      />
    </div>
  );
}
