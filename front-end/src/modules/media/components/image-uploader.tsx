"use client";

import { ImageUpload, type ImageUploadProps } from "@/modules/media/components/image-upload";

export function ImageUploader(props: ImageUploadProps) {
  return <ImageUpload {...props} />;
}
