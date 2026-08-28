import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon } from "@/components/ui/icons";

export function ImagePreview({
  src,
  alt = "معاينة الصورة",
  onReplace,
  onRemove,
}: {
  src: string;
  alt?: string;
  onReplace?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-48 w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/50 to-transparent p-3">
        {onReplace ? (
          <Button size="sm" variant="secondary" onClick={onReplace}>
            <PencilIcon className="size-4" />
            استبدال
          </Button>
        ) : null}
        {onRemove ? (
          <Button size="sm" variant="danger" onClick={onRemove}>
            <TrashIcon className="size-4" />
            حذف
          </Button>
        ) : null}
      </div>
    </div>
  );
}
