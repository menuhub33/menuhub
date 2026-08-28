import { cn } from "@/components/lib/cn";
import type { Category } from "@/lib/types";

export function PublicCategoryHeader({
  category,
  className,
}: {
  category: Pick<Category, "name_ar" | "name_en" | "description_ar" | "image_url">;
  className?: string;
}) {
  return (
    <header className={cn("mb-4 flex items-start gap-3", className)}>
      {category.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={category.image_url}
          alt=""
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-xl object-cover"
        />
      ) : null}
      <div className="min-w-0">
        <h2 className="text-lg font-bold leading-tight">{category.name_ar}</h2>
        {category.name_en ? (
          <p className="mt-0.5 text-xs opacity-60" dir="ltr">
            {category.name_en}
          </p>
        ) : null}
        {category.description_ar ? (
          <p className="mt-1 text-sm leading-relaxed opacity-75">{category.description_ar}</p>
        ) : null}
      </div>
    </header>
  );
}
