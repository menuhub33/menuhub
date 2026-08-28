import { StatusBadge } from "@/components/common/status-badge";
import type { DomainStatus as DomainStatusValue } from "@/lib/types";

export function DomainStatus({ status }: { status: DomainStatusValue }) {
  return <StatusBadge kind="domain" value={status} />;
}
