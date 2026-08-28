import { cn } from "@/components/lib/cn";

export function FormLabel({
  children,
  htmlFor,
  required,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("text-sm font-medium text-zinc-800", className)}
    >
      {children}
      {required ? <span className="ms-1 text-red-500">*</span> : null}
    </label>
  );
}
