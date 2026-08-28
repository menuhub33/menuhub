import { PendingAccessView } from "@/components/views/pending-access-view";
import { requireAuth } from "@/lib/auth/authorization";
import { getTenantContext } from "@/lib/auth/authorization";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { isRestaurantActivated } from "@/lib/restaurant-status";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const session = await requireAuth("/onboarding");
  if (canAccessAdmin(session.profile.platform_role)) {
    redirect("/admin");
  }

  const tenant = await getTenantContext(session);
  if (tenant && isRestaurantActivated(tenant.restaurant.status)) {
    redirect("/dashboard");
  }

  return <PendingAccessView restaurant={tenant?.restaurant ?? null} />;
}
