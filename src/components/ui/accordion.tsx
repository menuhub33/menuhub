"use client";

import { useState } from "react";
import { cn } from "@/components/lib/cn";
import { ChevronDownIcon } from "@/components/ui/icons";

export type AccordionItem = {
  id: string;
  title: string;
  content: React.ReactNode;
};

export type AccordionProps = {
  items: AccordionItem[];
  type?: "single" | "multiple";
  className?: string;
};

export function Accordion({ items, type = "single", className }: AccordionProps) {
  const [open, setOpen] = useState<string[]>([]);

  function toggle(id: string) {
    setOpen((current) => {
      const isOpen = current.includes(id);
      if (type === "single") return isOpen ? [] : [id];
      return isOpen ? current.filter((item) => item !== id) : [...current, id];
    });
  }

  return (
    <div className={cn("divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200", className)}>
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              {item.title}
              <ChevronDownIcon className={cn("size-4 text-zinc-500 transition", isOpen && "rotate-180")} />
            </button>
            {isOpen ? <div className="px-4 pb-4 text-sm text-zinc-600">{item.content}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
