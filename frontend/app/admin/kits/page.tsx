"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminKits, deleteKit, setKitActive } from "@/lib/api/admin/kits";
import { formatPrice } from "@/lib/format";
import type { Kit } from "@/lib/types";

export default function AdminKitsPage() {
  const [kits, setKits] = useState<Kit[]>([]);

  function refresh() {
    getAdminKits().then((res) => {
      if (res.success) setKits(res.data);
    });
  }

  useEffect(refresh, []);

  async function handleToggle(kit: Kit) {
    const res = await setKitActive(kit.id, !kit.isActive);
    if (res.success) refresh();
  }

  async function handleDelete(kit: Kit) {
    const res = await deleteKit(kit.id);
    if (res.success) {
      toast.success(`${kit.name} deleted`);
      refresh();
    }
  }

  return (
    <AdminShell>
      <div className="mb-4.5 flex flex-wrap items-center justify-between gap-2.5">
        <h1 className="text-[22px] font-extrabold">Kits</h1>
        <Link href="/admin/kits/new" className="rounded-[10px] bg-rose px-5 py-2.5 text-[13.5px] font-bold text-white">
          + Add Kit
        </Link>
      </div>

      <div className="overflow-hidden overflow-x-auto rounded-2xl border border-admin-border bg-white">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-admin-border text-[12px] font-bold uppercase tracking-wide text-muted-light">
              <th className="px-3 py-2.5">Kit</th>
              <th className="px-3 py-2.5">Base Price</th>
              <th className="px-3 py-2.5">Slots</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {kits.map((k) => (
              <tr key={k.id} className="border-b border-admin-row-border">
                <td className="px-3 py-2.5 font-bold">{k.name}</td>
                <td className="px-3 py-2.5 font-bold text-rose">{formatPrice(k.basePrice)}</td>
                <td className="px-3 py-2.5 text-muted">{k.slots.length}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(k)}
                      className={`relative h-[22px] w-10 rounded-full transition-colors ${k.isActive ? "bg-rose" : "bg-disabled-bg"}`}
                    >
                      <span
                        className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-all ${
                          k.isActive ? "left-[20px]" : "left-0.5"
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-bold ${k.isActive ? "text-success-text" : "text-muted-light"}`}>
                      {k.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-2">
                    <Link href={`/admin/kits/${k.id}/edit`} className="rounded-lg bg-surface-pink-light px-3.5 py-1.5 text-xs font-bold text-rose">
                      Edit
                    </Link>
                    <button type="button" onClick={() => handleDelete(k)} className="rounded-lg bg-danger-bg px-3.5 py-1.5 text-xs font-bold text-danger-text">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {kits.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted-light">No kits yet.</p>}
      </div>
    </AdminShell>
  );
}
