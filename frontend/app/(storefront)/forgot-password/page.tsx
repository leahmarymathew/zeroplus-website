"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { forgotPassword } from "@/lib/api/auth";

// Section 6.4: forgot-password reuses the send/verify OTP pair. The reset code
// itself is verified together with the new password on /reset-password (the
// backend's reset-password call does the OTP check + password update in one
// step), so here we only collect the phone, request the code, and carry the
// otpId + typed code forward.
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpId, setOtpId] = useState("");
  const [sending, setSending] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);

  async function handleSendCode() {
    if (!/^\d{10}$/.test(phone)) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    setSending(true);
    const res = await forgotPassword(phone);
    setSending(false);
    if (!res.success) {
      toast.error(res.error.message);
      return;
    }
    setOtpId(res.data.otpId);
    setOtpSent(true);
    toast.success("Reset code sent");
  }

  function handleVerify() {
    const code = otpDigits.join("");
    if (code.length !== 6) {
      toast.error("Enter all 6 digits");
      return;
    }
    router.push(
      `/reset-password?otpId=${encodeURIComponent(otpId)}&code=${encodeURIComponent(code)}&phone=${encodeURIComponent(phone)}`
    );
  }

  return (
    <>
      <Header variant="minimal" />
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[400px] rounded-[22px] border border-border-pink-light bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
          <h1 className="mb-1.5 text-xl font-extrabold">Forgot Password</h1>
          <p className="mb-5 text-sm text-muted">Enter your phone number and we&rsquo;ll send a reset code.</p>

          {!otpSent ? (
            <>
              <Input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="mb-4.5"
              />
              <Button variant="primary" className="w-full" onClick={handleSendCode} disabled={sending}>
                {sending ? "Sending…" : "Send Reset Code"}
              </Button>
            </>
          ) : (
            <>
              <p className="mb-3 text-[12.5px] text-muted">Enter the 6-digit code sent to your number.</p>
              <div className="mb-4 flex gap-2">
                {otpDigits.map((d, i) => (
                  <input
                    key={i}
                    value={d}
                    onChange={(e) => {
                      const next = [...otpDigits];
                      next[i] = e.target.value.replace(/\D/g, "").slice(0, 1);
                      setOtpDigits(next);
                    }}
                    maxLength={1}
                    className="h-12 w-full rounded-[10px] border-[1.5px] border-border-pink text-center text-lg font-bold outline-none"
                  />
                ))}
              </div>
              <Button variant="primary" className="w-full" onClick={handleVerify}>
                Verify &amp; Continue
              </Button>
              <button type="button" onClick={handleSendCode} className="mt-3 w-full text-center text-xs font-bold text-rose">
                Resend code
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
