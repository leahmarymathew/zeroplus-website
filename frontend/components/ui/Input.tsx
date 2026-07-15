import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leftIcon, error, className = "", ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`flex items-center gap-2 rounded-full border-[1.5px] bg-white px-4 py-[11px] transition-shadow ${
          error ? "border-danger-text" : "border-border-pink"
        } focus-within:border-rose focus-within:shadow-[0_0_0_3px_rgba(217,79,140,0.12)]`}
      >
        {leftIcon && <span className="flex-none text-placeholder-icon">{leftIcon}</span>}
        <input
          ref={ref}
          className={`w-full min-w-0 border-none bg-transparent text-[13.5px] text-ink outline-none placeholder:text-muted-light ${className}`}
          {...props}
        />
      </div>
      {error && <span className="px-1 text-xs font-bold text-danger-text">{error}</span>}
    </div>
  );
});
