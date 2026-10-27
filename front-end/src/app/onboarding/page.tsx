import { PendingAccessView } from "@/modules/tenancy/views/pending-access-view";
import { requireAuth } from "@/core/auth/authorization";
import { getTenantContext } from "@/core/auth/authorization";
import { canAccessAdmin } from "@/core/auth/permissions";
import { isRestaurantActivated } from "@/modules/tenancy/lib/restaurant-status";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const session = await requireAuth("/onboarding");
  if (canAccessAdmin(session.profile.platform_role)) {
    redirect("/admin");
  }

  const tenant = await getTenantContext();
  if (tenant && isRestaurantActivated(tenant.restaurant.status)) {
    redirect("/dashboard");
  }

  return <PendingAccessView restaurant={tenant?.restaurant ?? null} />;
}
