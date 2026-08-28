import { cn } from "@/components/lib/cn";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

export type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (item) => item === 1 || item === pageCount || Math.abs(item - page) <= 1
  );

  return (
    <nav className={cn("flex items-center justify-center gap-1", className)} aria-label="ترقيم الصفحات">
      <Button
        variant="outline"
        size="icon"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="السابق"
      >
        <ChevronRightIcon className="size-4" />
      </Button>
      {pages.map((item, index) => {
        const prev = pages[index - 1];
        return (
          <span key={item} className="contents">
            {prev && item - prev > 1 ? <span className="px-1 text-zinc-400">…</span> : null}
            <Button
              variant={item === page ? "primary" : "ghost"}
              size="icon"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
            >
              {item}
            </Button>
          </span>
        );
      })}
      <Button
        variant="outline"
        size="icon"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        aria-label="التالي"
      >
        <ChevronLeftIcon className="size-4" />
      </Button>
    </nav>
  );
}
