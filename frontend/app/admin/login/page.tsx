"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAdminAuthStore } from "@/store/adminAuthStore";

// No backend yet — accepts any well-formed credentials, same stub pattern
// as the customer login page.
export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAdminAuthStore((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Enter a username and password");
      return;
    }
    login();
    router.push("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[380px] rounded-[20px] border border-admin-border bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.05)] sm:p-9">
        <div className="mb-6 text-center">
          <Image src="/logo.png" alt="Zeroplus" width={1628} height={1236} className="mx-auto mb-2.5 h-10 w-auto" />
          <div className="text-xs font-extrabold tracking-wider text-muted-light">ADMIN PANEL</div>
        </div>
        <form onSubmit={handleSubmit} className="mb-4.5 flex flex-col gap-3">
          <input
            type="text"
            placeholder="Admin username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-xl border-[1.5px] border-border-pink px-4 py-[11px] text-[13.5px] outline-none focus:border-rose"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border-[1.5px] border-border-pink px-4 py-[11px] text-[13.5px] outline-none focus:border-rose"
          />
          <button
            type="submit"
            className="rounded-xl bg-rose py-3 text-[14.5px] font-bold text-white shadow-[0_8px_20px_rgba(217,79,140,0.25)]"
          >
            Log In
          </button>
        </form>
        <p className="text-center text-xs text-strikethrough">Restricted access — store staff only.</p>
      </div>
    </div>
  );
}
