import { getSocialLink } from "@/actions/social-links/getSocialLink";
import { SocialView } from "@/components/views/social-view";
import { requirePermission } from "@/lib/auth/authorization";
import { ErrorState } from "@/components/common/error-state";

export default async function SocialPage() {
  const tenant = await requirePermission("restaurant.update");
  const links = await getSocialLink(tenant.restaurant.id);
  if (links.error) return <ErrorState description={links.error} />;
  return <SocialView restaurantId={tenant.restaurant.id} links={links.data ?? []} />;
}
