import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-[#0d2040] text-[#6b88b0]",
    success: "bg-emerald-500/10 text-emerald-400",
    warning: "bg-yellow-500/10 text-yellow-400",
    danger: "bg-red-500/10 text-red-400",
    info: "bg-blue-600/10 text-blue-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
