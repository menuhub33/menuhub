"use client";

import { ImageUpload, type ImageUploadProps } from "@/components/upload/image-upload";

export function ImageUploader(props: ImageUploadProps) {
  return <ImageUpload {...props} />;
}
