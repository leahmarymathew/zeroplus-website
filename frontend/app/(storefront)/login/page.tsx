"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";

const loginSchema = z.object({
  identifier: z.string().min(3, "Enter your phone number or email"),
  password: z.string().min(4, "Enter your password"),
});
type LoginForm = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type RegisterForm = z.infer<typeof registerSchema>;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function GoogleButton() {
  return (
    <button
      type="button"
      onClick={() => toast("Google sign-in needs a real OAuth client ID + backend — wired once /backend exists")}
      className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-full border-[1.5px] border-border-pink bg-white py-3 text-sm font-bold text-ink"
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.5 12.3c0-.85-.08-1.66-.22-2.45H12v4.63h6.46c-.28 1.5-1.13 2.77-2.4 3.63v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.87-3c-1.08.72-2.45 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.96H1.24v3.1C3.22 21.3 7.28 24 12 24z" />
        <path fill="#FBBC05" d="M5.25 14.29A7.2 7.2 0 0 1 4.86 12c0-.8.14-1.57.39-2.29v-3.1H1.24A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.24 5.39l4.01-3.1z" />
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.28 0 3.22 2.7 1.24 6.61l4.01 3.1C6.2 6.87 8.86 4.75 12 4.75z" />
      </svg>
      Continue with Google
    </button>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const [mode, setMode] = useState<"login" | "register">(searchParams.get("tab") === "register" ? "register" : "login");
  const login = useAuthStore((s) => s.login);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  function onLogin() {
    // No backend yet — accept any well-formed credentials and create a mock session.
    login({
      id: crypto.randomUUID(),
      name: "Sample User",
      email: loginForm.getValues("identifier").includes("@") ? loginForm.getValues("identifier") : null,
      phone: loginForm.getValues("identifier").includes("@") ? "9800000000" : loginForm.getValues("identifier"),
      role: "CUSTOMER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    toast.success("Logged in");
    router.push(redirect);
  }

  function onRegister(values: RegisterForm) {
    login({
      id: crypto.randomUUID(),
      name: values.name,
      email: values.email || null,
      phone: values.phone,
      role: "CUSTOMER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    toast.success("Account created");
    router.push(redirect);
  }

  return (
    <>
      <Header variant="minimal" />
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[400px] rounded-[22px] border border-border-pink-light bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
          <div className="mb-6 flex rounded-full bg-input-fill p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full py-2 text-[13.5px] font-bold ${mode === "login" ? "bg-white text-rose" : "text-muted-light"}`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-full py-2 text-[13.5px] font-bold ${mode === "register" ? "bg-white text-rose" : "text-muted-light"}`}
            >
              Register
            </button>
          </div>

          <GoogleButton />

          <div className="mb-4 flex items-center gap-2.5">
            <div className="h-px flex-1 bg-border-pink-light" />
            <span className="text-xs text-strikethrough">or</span>
            <div className="h-px flex-1 bg-border-pink-light" />
          </div>

          {mode === "login" ? (
            <form onSubmit={loginForm.handleSubmit(onLogin)}>
              <div className="mb-4.5 flex flex-col gap-3">
                <Input placeholder="Phone number or email" {...loginForm.register("identifier")} error={loginForm.formState.errors.identifier?.message} />
                <Input type="password" placeholder="Password" {...loginForm.register("password")} error={loginForm.formState.errors.password?.message} />
              </div>
              <div className="mb-4.5 text-right">
                <Link href="/forgot-password" className="text-xs font-bold">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" variant="primary" className="w-full">
                Log In
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegister)}>
              <div className="mb-4.5 flex flex-col gap-3">
                <Input placeholder="Full name" {...registerForm.register("name")} error={registerForm.formState.errors.name?.message} />
                <Input placeholder="Phone number" {...registerForm.register("phone")} error={registerForm.formState.errors.phone?.message} />
                <Input type="email" placeholder="Email" {...registerForm.register("email")} error={registerForm.formState.errors.email?.message} />
                <Input type="password" placeholder="Create password" {...registerForm.register("password")} error={registerForm.formState.errors.password?.message} />
              </div>
              <Button type="submit" variant="primary" className="mb-4.5 w-full">
                Create Account
              </Button>
            </form>
          )}

          <div className="mb-4 h-px bg-border-pink-light" />
          <Link
            href="/checkout"
            className="block rounded-full bg-input-fill py-3 text-center text-sm font-bold text-ink"
          >
            Continue as Guest
          </Link>
        </div>
      </main>
    </>
  );
}
