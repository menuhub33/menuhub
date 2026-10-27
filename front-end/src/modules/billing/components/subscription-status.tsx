import { StatusBadge } from "@/core/components/common/status-badge";
import type { SubscriptionStatus } from "@/modules/billing/types";

export function SubscriptionStatus({ status }: { status: SubscriptionStatus }) {
  return <StatusBadge kind="subscription" value={status} />;
}
