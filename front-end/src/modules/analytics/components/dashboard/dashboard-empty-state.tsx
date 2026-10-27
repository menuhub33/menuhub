import { EmptyState } from "@/core/components/common/empty-state";
import { Button } from "@/core/ui/button";
import { BuildingIcon } from "@/core/ui/icons";

export function DashboardEmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<BuildingIcon className="size-7" />}
      title="ابدأ مطعمك الأول"
      description="أنشئ مطعمًا لتبدأ بناء المنيو الرقمي ورمز QR الخاص بك."
      action={
        onCreate ? (
          <Button onClick={onCreate}>إنشاء مطعم</Button>
        ) : null
      }
    />
  );
}
