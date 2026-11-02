import type { Metadata } from "next";
import { requestOrigin } from "@/core/lib/request-origin";
import { MenuNotFound } from "@/modules/storefront/components/menu-not-found";
import { getPublicMall } from "@/modules/malls/actions/malls";
import { PublicMallView } from "@/modules/malls/views/public-mall-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicMall(slug);
  if (result.data?.kind !== "live") return { title: "المول غير متاح" };
  return {
    title: result.data.mall.name,
    description: result.data.mall.description ?? `دليل محلات ${result.data.mall.name}`,
  };
}

export default async function PublicMallPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPublicMall(slug);
  if (result.error || !result.data || result.data.kind !== "live") {
    return (
      <MenuNotFound
        title="المول غير متاح"
        description="تعذر العثور على هذا المول، أو أن دليله غير منشور بعد."
      />
    );
  }
  const { host, protocol } = await requestOrigin();
  const shareUrl = host ? `${protocol || "https"}://${host}/c/${result.data.mall.slug}` : `/c/${result.data.mall.slug}`;
  return <PublicMallView state={result.data} shareUrl={shareUrl} />;
}
