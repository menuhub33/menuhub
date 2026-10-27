import { StatusBadge } from "@/core/components/common/status-badge";
import type { ProductStatus } from "@/modules/catalog/types";

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <StatusBadge kind="product" value={status} />;
}
