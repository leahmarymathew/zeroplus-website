"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/store/adminAuthStore";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/kits", label: "Kits" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/reports", label: "Reports" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAdminAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    router.push("/admin/login");
  }

  return (
    <nav className="sticky top-0 flex min-h-screen w-[220px] flex-none flex-col border-r border-admin-border bg-white p-3.5">
      <div className="mb-3 flex items-center gap-2 border-b border-border-pink-light px-2 pb-5">
        <Image src="/logo.png" alt="Zeroplus" width={1628} height={1236} className="h-[30px] w-auto" />
        <span className="text-xs font-extrabold tracking-wide text-muted-light">ADMIN</span>
      </div>
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mb-0.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-bold ${
              active ? "bg-surface-pink-light text-rose" : "text-muted"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <div className="flex-1" />
      <button type="button" onClick={handleLogout} className="rounded-[10px] px-3 py-2.5 text-left text-[13px] font-bold text-muted-light">
        Log Out
      </button>
    </nav>
  );
}
