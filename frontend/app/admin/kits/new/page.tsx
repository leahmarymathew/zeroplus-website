import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { KitForm } from "@/components/admin/KitForm";

export default function NewKitPage() {
  return (
    <AdminShell>
      <div className="mb-4.5 flex items-center gap-3">
        <Link href="/admin/kits" className="text-[13.5px] font-bold text-muted-light">
          ← Back
        </Link>
        <h1 className="text-xl font-extrabold">Add Kit</h1>
      </div>
      <KitForm />
    </AdminShell>
  );
}
