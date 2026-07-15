"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { KitForm } from "@/components/admin/KitForm";
import { getAdminKit } from "@/lib/api/admin/kits";
import type { Kit } from "@/lib/types";

export default function EditKitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [kit, setKit] = useState<Kit | null | undefined>(undefined);

  useEffect(() => {
    getAdminKit(id).then((res) => setKit(res.success ? res.data : null));
  }, [id]);

  return (
    <AdminShell>
      <div className="mb-4.5 flex items-center gap-3">
        <Link href="/admin/kits" className="text-[13.5px] font-bold text-muted-light">
          ← Back
        </Link>
        <h1 className="text-xl font-extrabold">Edit Kit</h1>
      </div>
      {kit === undefined && <p className="text-sm text-muted-light">Loading…</p>}
      {kit === null && <p className="text-sm text-danger-text">Kit not found.</p>}
      {kit && <KitForm kit={kit} />}
    </AdminShell>
  );
}
