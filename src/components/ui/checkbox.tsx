import { cn } from "@/components/lib/cn";

export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: string;
};

export function Checkbox({ className, label, id, ...props }: CheckboxProps) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
      <input
        id={id}
        type="checkbox"
        className={cn(
          "size-4 rounded border-zinc-300 text-teal-700 accent-teal-700 focus:ring-teal-700/20",
          className
        )}
        {...props}
      />
      {label}
    </label>
  );
}
