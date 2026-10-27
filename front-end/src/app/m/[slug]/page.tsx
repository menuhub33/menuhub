import type { Metadata } from "next";
import { getPublicMenu } from "@/modules/storefront/actions/storefront";
import { PublicMenuView } from "@/modules/storefront/views/public-menu-view";
import { currentPublicMenuUrl } from "@/core/lib/request-origin";
import { MenuNotFound } from "@/modules/storefront/components/menu-not-found";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/m/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicMenu(slug);
  if (result.data?.kind !== "live") {
    return { title: "المنيو غير متاح" };
  }
  const restaurant = result.data.data.restaurant;
  return {
    title: restaurant.name,
    description: restaurant.description ?? `منيو ${restaurant.name}`,
    openGraph: {
      title: restaurant.name,
      description: restaurant.description ?? undefined,
      images: restaurant.cover_image_url ? [restaurant.cover_image_url] : undefined,
    },
  };
}

export default async function PublicMenuPage({ params }: PageProps<"/m/[slug]">) {
  const { slug } = await params;
  const result = await getPublicMenu(slug);
  if (result.error || !result.data) {
    return <MenuNotFound />;
  }
  const shareUrl = await currentPublicMenuUrl(slug);
  if (result.data.kind !== "live") {
    return (
      <PublicMenuView
        reason={result.data.reason}
        shareUrl={shareUrl}
      />
    );
  }
  return (
    <PublicMenuView data={result.data.data} shareUrl={shareUrl} />
  );
}
