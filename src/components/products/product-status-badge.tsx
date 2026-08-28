import { StatusBadge } from "@/components/common/status-badge";
import type { ProductStatus } from "@/lib/types";

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <StatusBadge kind="product" value={status} />;
}
