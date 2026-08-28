import { cn } from "@/components/lib/cn";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
} from "@/components/ui/icons";

const variants = {
  info: {
    wrap: "border-sky-200 bg-sky-50 text-sky-900",
    icon: InfoIcon,
  },
  success: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: CheckCircleIcon,
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50 text-amber-900",
    icon: AlertTriangleIcon,
  },
  error: {
    wrap: "border-red-200 bg-red-50 text-red-900",
    icon: AlertCircleIcon,
  },
} as const;

export type AlertProps = {
  variant?: keyof typeof variants;
  title?: string;
  children?: React.ReactNode;
  className?: string;
};

export function Alert({ variant = "info", title, children, className }: AlertProps) {
  const Icon = variants[variant].icon;
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3 text-sm",
        variants[variant].wrap,
        className
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && "mt-1 opacity-90")}>{children}</div> : null}
      </div>
    </div>
  );
}
