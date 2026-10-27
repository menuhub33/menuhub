import { EmptyState } from "@/core/components/common/empty-state";
import { Button } from "@/core/ui/button";
import { PlusIcon, UtensilsIcon } from "@/core/ui/icons";

export function MenuEmptyState({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<UtensilsIcon className="size-7" />}
      title="لا توجد أقسام"
      description="أضف أول قسم ثم ابدأ بإدراج المنتجات لبناء المنيو."
      action={
        onAdd ? (
          <Button onClick={onAdd}>
            <PlusIcon className="size-4" />
            إضافة أول قسم
          </Button>
        ) : null
      }
    />
  );
}
