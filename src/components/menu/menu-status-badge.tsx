import { StatusBadge } from "@/components/common/status-badge";
import type { MenuStatus } from "@/lib/types";

export function MenuStatusBadge({ status }: { status: MenuStatus }) {
  return <StatusBadge kind="menu" value={status} />;
}
