import { cn } from "@/components/lib/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export function Textarea({ className, invalid, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "w-full resize-y rounded-xl border bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400",
        "focus:border-teal-600 focus:ring-4 focus:ring-teal-700/15",
        "disabled:cursor-not-allowed disabled:bg-zinc-50",
        invalid
          ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
          : "border-zinc-200",
        className
      )}
      {...props}
    />
  );
}
