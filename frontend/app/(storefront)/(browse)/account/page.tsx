"use client";

import Link from "next/link";
import { Package, MapPin, User as UserIcon } from "lucide-react";
import { RequireAuth } from "@/components/account/RequireAuth";
import { useAuthStore } from "@/store/authStore";

const LINKS = [
  { href: "/account/orders", label: "My Orders", desc: "Track and review your past orders", Icon: Package },
  { href: "/account/addresses", label: "My Addresses", desc: "Manage delivery addresses", Icon: MapPin },
  { href: "/account/profile", label: "My Profile", desc: "Update your details & password", Icon: UserIcon },
];

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountOverview />
    </RequireAuth>
  );
}

function AccountOverview() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-[1000px] px-4 pt-5 pb-14 sm:px-8 sm:pt-8">
      <div className="mb-8 flex items-center gap-3.5">
        <div className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full bg-surface-pink-light text-lg font-extrabold text-rose">
          {initials}
        </div>
        <div>
          <h1 className="text-xl font-extrabold">{user.name}</h1>
          <p className="m-0 text-[13px] text-muted-light">
            {user.phone}
            {user.email ? ` · ${user.email}` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        {LINKS.map(({ href, label, desc, Icon }) => (
          <Link key={href} href={href} className="block rounded-[20px] border border-border-pink-light bg-white p-6 text-ink">
            <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-pink-light">
              <Icon size={21} className="text-rose" strokeWidth={1.8} />
            </div>
            <h2 className="mb-1 text-base font-bold">{label}</h2>
            <p className="m-0 text-[13px] text-muted-light">{desc}</p>
          </Link>
        ))}
      </div>

      <button type="button" onClick={logout} className="mt-7 text-[13.5px] font-bold text-muted-light">
        Log Out
      </button>
    </div>
  );
}
