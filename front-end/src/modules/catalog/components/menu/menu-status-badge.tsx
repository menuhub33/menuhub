import { StatusBadge } from "@/core/components/common/status-badge";
import type { MenuStatus } from "@/modules/catalog/types";

export function MenuStatusBadge({ status }: { status: MenuStatus }) {
  return <StatusBadge kind="menu" value={status} />;
}
