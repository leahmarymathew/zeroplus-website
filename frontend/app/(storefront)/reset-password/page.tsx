"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Check } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { resetPassword } from "@/lib/api/auth";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone");
  const otpId = searchParams.get("otpId");
  const code = searchParams.get("code");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // The reset link is only valid with the otpId + code carried from the
  // forgot-password step; without them there's nothing to verify against.
  const hasToken = Boolean(phone && otpId && code);

  async function handleSubmit() {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setSubmitting(true);
    const res = await resetPassword({ otpId: otpId!, code: code!, newPassword: password });
    setSubmitting(false);
    if (!res.success) {
      toast.error(res.error.message);
      return;
    }
    setDone(true);
  }

  return (
    <>
      <Header variant="minimal" />
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[400px] rounded-[22px] border border-border-pink-light bg-white p-7 text-center shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
          {!hasToken ? (
            <>
              <h1 className="mb-1.5 text-xl font-extrabold">Reset link invalid</h1>
              <p className="mb-5 text-sm text-muted">Start over from Forgot Password to get a fresh code.</p>
              <Link href="/forgot-password" className="font-bold text-rose">
                Go to Forgot Password
              </Link>
            </>
          ) : done ? (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg">
                <Check size={26} className="text-success-text" strokeWidth={2.2} />
              </div>
              <h1 className="mb-1.5 text-xl font-extrabold">Password reset!</h1>
              <p className="mb-5 text-sm text-muted">You can now log in with your new password.</p>
              <Link href="/login" className="font-bold text-rose">
                Go to Log In
              </Link>
            </>
          ) : (
            <div className="text-left">
              <h1 className="mb-1.5 text-xl font-extrabold">Reset Password</h1>
              <p className="mb-5 text-sm text-muted">Setting a new password for +91 {phone}</p>
              <div className="mb-4.5 flex flex-col gap-3">
                <Input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Input type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <Button variant="primary" className="w-full" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Resetting…" : "Reset Password"}
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
