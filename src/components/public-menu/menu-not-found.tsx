import { UtensilsIcon } from "@/components/ui/icons";

export function MenuNotFound({
  title = "المنيو غير متاح",
  description = "تعذر العثور على هذا المنيو. قد يكون غير منشور أو تم إزالته.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div
      dir="rtl"
      lang="ar"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-16 text-center"
    >
      <span className="flex size-16 items-center justify-center rounded-2xl bg-zinc-200 text-zinc-600">
        <UtensilsIcon className="size-8" />
      </span>
      <div>
        <h1 className="text-xl font-bold text-zinc-900">{title}</h1>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">{description}</p>
      </div>
    </div>
  );
}
