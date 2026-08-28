import type { Metadata } from "next";
import { getPublicMenu } from "@/actions/public/getPublicMenu";
import { PublicMenuView } from "@/components/views/public-menu-view";
import { publicMenuUrl } from "@/lib/config";
import { MenuNotFound } from "@/components/public-menu/menu-not-found";

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
  if (result.data.kind !== "live") {
    return (
      <PublicMenuView
        reason={result.data.reason}
        shareUrl={publicMenuUrl(slug)}
      />
    );
  }
  return (
    <PublicMenuView data={result.data.data} shareUrl={publicMenuUrl(slug)} />
  );
}
