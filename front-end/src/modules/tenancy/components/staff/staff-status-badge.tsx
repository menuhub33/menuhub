import { Badge } from "@/core/ui/badge";

export function StaffStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "success" : "default"} dot>
      {active ? "نشط" : "غير نشط"}
    </Badge>
  );
}
