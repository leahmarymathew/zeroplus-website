"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
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

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAdminAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    router.push("/admin/login");
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} aria-hidden="true" />}

      <nav
        className={`fixed inset-y-0 left-0 z-40 flex w-[220px] flex-none flex-col border-r border-admin-border bg-white p-3.5 transition-transform duration-[200ms] md:sticky md:top-0 md:z-auto md:min-h-screen md:translate-x-[0px] ${
          open ? "translate-x-[0px]" : "translate-x-[-220px]"
        }`}
      >
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-border-pink-light px-2 pb-5">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Zeroplus" width={1478} height={719} className="h-10 w-auto" />
            <span className="text-xs font-extrabold tracking-wide text-muted-light">ADMIN</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-muted-light md:hidden"
          >
            <X size={20} />
          </button>
        </div>
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
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
    </>
  );
}
