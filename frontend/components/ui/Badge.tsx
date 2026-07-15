import type { ReactNode } from "react";

export type BadgeVariant = "trust" | "sale" | "outline" | "stock" | "warning" | "info" | "danger";

const variants: Record<BadgeVariant, string> = {
  trust: "bg-surface-pink-light text-rose",
  sale: "bg-ink text-white",
  outline: "bg-white text-rose border-[1.5px] border-border-secondary",
  stock: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning-text",
  info: "bg-info-bg text-info-text",
  danger: "bg-danger-bg text-danger-text",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = "trust", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-[5px] text-xs font-bold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
