import type { ButtonHTMLAttributes } from "react";
import Link from "next/link";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-body font-bold text-[15px] px-7 py-[13px] transition-colors disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-rose text-white shadow-[0_8px_20px_rgba(217,79,140,0.25)] hover:bg-rose-dark disabled:bg-disabled-bg disabled:text-disabled-text disabled:shadow-none",
  secondary:
    "bg-white text-rose border-[1.5px] border-border-secondary hover:bg-surface-pink-light disabled:bg-disabled-bg disabled:text-disabled-text disabled:border-transparent",
  ghost:
    "bg-input-fill text-ink hover:bg-surface-pink-light disabled:bg-disabled-bg disabled:text-disabled-text",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

interface LinkButtonProps {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
}

export function LinkButton({ href, variant = "primary", className = "", children }: LinkButtonProps) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
