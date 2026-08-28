import { StatusBadge } from "@/components/common/status-badge";
import type { SubscriptionStatus } from "@/lib/types";

export function SubscriptionStatus({ status }: { status: SubscriptionStatus }) {
  return <StatusBadge kind="subscription" value={status} />;
}
