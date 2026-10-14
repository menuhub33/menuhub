import type { SupabaseClient } from "@supabase/supabase-js";
import {
  objectKeyFromPublicUrl,
  objectKeysToDelete,
  readR2Config,
  shouldDeleteUnreferencedObject,
} from "@/lib/image-objects";
import { deleteR2Object } from "@/lib/r2";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";

const REFERENCE_FIELDS = [
  ["product_images", "image_url"],
  ["categories", "image_url"],
  ["restaurants", "logo_url"],
  ["restaurants", "cover_image_url"],
  ["themes", "preview_image_url"],
] as const;

function referenceReader(fallback: SupabaseClient) {
  if (!hasServiceRole()) return fallback;
  try {
    return createAdminClient();
  } catch {
    return fallback;
  }
}

export async function releaseStoredImage(
  supabase: SupabaseClient,
  imageUrl: string | null | undefined
) {
  if (!imageUrl?.trim()) return;

  const config = readR2Config(process.env);
  if (!config) return;

  const objectKey = objectKeyFromPublicUrl(config.publicUrl, imageUrl);
  if (!objectKey) return;

  const reader = referenceReader(supabase);
  const counts: Array<number | null> = [];
  for (const [table, column] of REFERENCE_FIELDS) {
    const { count, error } = await reader
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq(column, imageUrl);
    if (error) return;
    counts.push(count ?? 0);
  }

  if (!shouldDeleteUnreferencedObject(counts)) return;

  for (const key of objectKeysToDelete(objectKey)) {
    try {
      await deleteR2Object(config, key);
    } catch {
      // The database change already succeeded. Cleanup stays best-effort.
    }
  }
}

export async function releaseStoredImages(
  supabase: SupabaseClient,
  urls: Array<string | null | undefined>
) {
  const unique = [...new Set(urls.map((url) => url?.trim()).filter(Boolean))] as string[];
  for (const url of unique) {
    await releaseStoredImage(supabase, url);
  }
}
