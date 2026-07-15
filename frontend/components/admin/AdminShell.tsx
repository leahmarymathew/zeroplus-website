import { RequireAdminAuth } from "@/components/admin/RequireAdminAuth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

// Every protected /admin/* page (all but /admin/login) wraps its content
// in this — sidebar + auth gate, matching the Admin Sidebar shared
// component in the design export.
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdminAuth>
      <div className="flex">
        <AdminSidebar />
        <main className="min-w-0 flex-1 p-5 sm:p-8">{children}</main>
      </div>
    </RequireAdminAuth>
  );
}
