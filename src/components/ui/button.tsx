import { cn } from "@/components/lib/cn";

const variants = {
  primary:
    "bg-teal-700 text-white hover:bg-teal-800 focus-visible:ring-teal-700/30 disabled:bg-teal-700/50",
  secondary:
    "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus-visible:ring-zinc-400/30",
  outline:
    "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 focus-visible:ring-zinc-400/30",
  ghost: "text-zinc-700 hover:bg-zinc-100 focus-visible:ring-zinc-400/30",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600/30 disabled:bg-red-600/50",
  link: "text-teal-700 underline-offset-4 hover:underline px-0 h-auto",
} as const;

const sizes = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-5 text-base rounded-xl gap-2",
  icon: "size-10 rounded-xl p-0",
} as const;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
