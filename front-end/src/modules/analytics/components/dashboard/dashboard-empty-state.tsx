import { EmptyState } from "@/core/components/common/empty-state";
import { Button } from "@/core/ui/button";
import { BuildingIcon } from "@/core/ui/icons";

export function DashboardEmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<BuildingIcon className="size-7" />}
      title="ابدأ نشاطك الأول"
      description="أنشئ مركزاً تجارياً أو مطعماً أو كافيه لتبدأ بناء المنيو الرقمي ورمز QR الخاص بك."
      action={
        onCreate ? (
          <Button onClick={onCreate}>إنشاء نشاط</Button>
        ) : null
      }
    />
  );
}
