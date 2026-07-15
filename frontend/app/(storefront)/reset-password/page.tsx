"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Check } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);

  function handleSubmit() {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setDone(true);
  }

  return (
    <>
      <Header variant="minimal" />
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[400px] rounded-[22px] border border-border-pink-light bg-white p-7 text-center shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
          {!phone ? (
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
              <Button variant="primary" className="w-full" onClick={handleSubmit}>
                Reset Password
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
