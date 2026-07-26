"use client";

import { useRef } from "react";

interface OtpInputProps {
  digits: string[];
  onChange: (digits: string[]) => void;
}

// 6-digit OTP entry: typing a digit advances focus to the next box,
// Backspace on an empty box moves back to the previous one, and pasting (or
// fast-typing) the whole code into any box distributes it across the rest.
export function OtpInput({ digits, onChange }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(i: number, raw: string) {
    const value = raw.replace(/\D/g, "");
    if (value.length > 1) {
      const next = [...digits];
      for (let j = 0; j < value.length && i + j < next.length; j++) {
        next[i + j] = value[j];
      }
      onChange(next);
      inputRefs.current[Math.min(i + value.length, digits.length - 1)]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = value;
    onChange(next);
    if (value && i < digits.length - 1) {
      inputRefs.current[i + 1]?.focus();
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  return (
    <div className="flex gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          aria-label={`OTP digit ${i + 1}`}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          inputMode="numeric"
          className="h-12 w-full rounded-[10px] border-[1.5px] border-border-pink text-center text-lg font-bold outline-none"
        />
      ))}
    </div>
  );
}
