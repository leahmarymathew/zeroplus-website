"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { RequireAdminAuth } from "@/components/admin/RequireAdminAuth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

// Every protected /admin/* page (all but /admin/login) wraps its content
// in this — sidebar + auth gate, matching the Admin Sidebar shared
// component in the design export. Below the md breakpoint the sidebar
// becomes a slide-in drawer (fixed w-[220px] doesn't fit a phone screen
// alongside the already-wide admin tables), opened via the hamburger bar.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RequireAdminAuth>
      <div className="flex">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-admin-border bg-white px-4 py-3 md:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-ink"
            >
              <Menu size={22} />
            </button>
            <span className="text-xs font-extrabold tracking-wide text-muted-light">ADMIN</span>
          </header>
          <main className="p-5 sm:p-8">{children}</main>
        </div>
      </div>
    </RequireAdminAuth>
  );
}
