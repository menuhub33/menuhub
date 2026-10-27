import { headers } from "next/headers";
import { publicMenuUrl } from "@/core/config";

export async function requestOrigin() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const protocol = headerList.get("x-forwarded-proto") ?? "";
  return { host, protocol };
}

export async function currentPublicMenuUrl(slug: string) {
  const { host, protocol } = await requestOrigin();
  return publicMenuUrl(slug, host, protocol);
}
