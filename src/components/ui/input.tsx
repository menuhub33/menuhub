import { cn } from "@/components/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function Input({ className, invalid, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400",
        "focus:border-teal-600 focus:ring-4 focus:ring-teal-700/15",
        "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400",
        invalid
          ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
          : "border-zinc-200",
        className
      )}
      {...props}
    />
  );
}
