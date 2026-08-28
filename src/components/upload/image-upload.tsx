"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/components/lib/cn";
import { ImagePreview } from "@/components/upload/image-preview";
import { UploadError } from "@/components/upload/upload-error";
import { UploadProgress } from "@/components/upload/upload-progress";
import { UploadIcon } from "@/components/ui/icons";

const DEFAULT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

export type ImageUploadResult = {
  file: File;
  previewUrl: string;
};

export type ImageUploadProps = {
  value?: string | null;
  onChange?: (result: ImageUploadResult | null) => void;
  onUpload?: (file: File) => Promise<string>;
  accept?: string[];
  maxSize?: number;
  minWidth?: number;
  minHeight?: number;
  aspectHint?: string;
  disabled?: boolean;
  className?: string;
};

async function readDimensions(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("تعذر قراءة أبعاد الصورة"));
      img.src = url;
    });
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  accept = DEFAULT_TYPES,
  maxSize = DEFAULT_MAX_SIZE,
  minWidth,
  minHeight,
  aspectHint,
  disabled,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const uploadingRef = useRef(false);

  useEffect(() => {
    if (uploadingRef.current) return;
    setPreview(value ?? null);
  }, [value]);

  async function handleFile(file: File) {
    setError(null);
    if (file.type && !accept.includes(file.type) && file.type !== "image/jpg") {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const allowedExt = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
      if (!ext || !allowedExt.has(ext)) {
        setError("نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP.");
        return;
      }
    }
    if (file.size > maxSize) {
      setError(`حجم الصورة أكبر من ${(maxSize / 1024 / 1024).toFixed(0)} ميجابايت.`);
      return;
    }
    if (minWidth || minHeight) {
      const { width, height } = await readDimensions(file);
      if ((minWidth && width < minWidth) || (minHeight && height < minHeight)) {
        setError(`أبعاد الصورة صغيرة. الحد الأدنى ${minWidth ?? 0}×${minHeight ?? 0}.`);
        return;
      }
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    if (onUpload) {
      uploadingRef.current = true;
      setProgress(15);
      const timer = window.setInterval(() => {
        setProgress((current) => (current == null || current >= 90 ? current : current + 8));
      }, 180);
      try {
        const url = await onUpload(file);
        URL.revokeObjectURL(localPreview);
        setPreview(url);
        setProgress(100);
        onChange?.({ file, previewUrl: url });
      } catch (uploadError) {
        URL.revokeObjectURL(localPreview);
        setError(
          uploadError instanceof Error && uploadError.message
            ? uploadError.message
            : "فشل رفع الصورة. حاول مرة أخرى."
        );
        setPreview(value ?? null);
      } finally {
        uploadingRef.current = false;
        window.clearInterval(timer);
        window.setTimeout(() => setProgress(null), 400);
      }
      return;
    }

    onChange?.({ file, previewUrl: localPreview });
  }

  return (
    <div className={cn("grid gap-3", className)}>
      {preview ? (
        <ImagePreview
          src={preview}
          onReplace={disabled ? undefined : () => inputRef.current?.click()}
          onRemove={
            disabled
              ? undefined
              : () => {
                  setPreview(null);
                  onChange?.(null);
                }
          }
        />
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 transition hover:border-teal-400 hover:bg-teal-50/40 disabled:cursor-not-allowed"
        >
          <UploadIcon className="size-8 text-zinc-400" />
          <span className="font-medium text-zinc-800">اسحب الصورة أو اضغط للرفع</span>
          <span>JPG, PNG, WebP — حتى {(maxSize / 1024 / 1024).toFixed(0)}MB</span>
          {aspectHint ? <span>{aspectHint}</span> : null}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />
      {progress != null ? <UploadProgress value={progress} /> : null}
      <UploadError message={error} />
    </div>
  );
}
