import { getSocialLink } from "@/modules/operations/actions/social-links";
import { SocialView } from "@/modules/operations/views/social-view";
import { requirePermission } from "@/core/auth/authorization";
import { ErrorState } from "@/core/components/common/error-state";

export default async function SocialPage() {
  const tenant = await requirePermission("restaurant.update");
  const links = await getSocialLink(tenant.restaurant.id);
  if (links.error) return <ErrorState description={links.error} />;
  return <SocialView restaurantId={tenant.restaurant.id} links={links.data ?? []} />;
}
