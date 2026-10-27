import { StatusBadge } from "@/core/components/common/status-badge";
import type { DomainStatus as DomainStatusValue } from "@/modules/operations/types";

export function DomainStatus({ status }: { status: DomainStatusValue }) {
  return <StatusBadge kind="domain" value={status} />;
}
