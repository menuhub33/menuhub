import { cn } from "@/components/lib/cn";
import { FormError } from "@/components/forms/form-error";
import { FormLabel } from "@/components/forms/form-label";

export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <FormLabel htmlFor={htmlFor} required={required}>
        {label}
      </FormLabel>
      {children}
      {hint && !error ? <p className="text-xs text-zinc-500">{hint}</p> : null}
      <FormError message={error} />
    </div>
  );
}
