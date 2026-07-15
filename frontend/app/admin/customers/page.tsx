"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminCustomers } from "@/lib/api/admin/customers";
import type { AdminCustomer } from "@/lib/mock/customers";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function run() {
      const res = await getAdminCustomers(search || undefined);
      if (res.success) setCustomers(res.data);
    }
    run();
  }, [search]);

  return (
    <AdminShell>
      <h1 className="mb-4 text-[22px] font-extrabold">Customers</h1>
      <input
        type="text"
        placeholder="Search name, phone, or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 block w-full max-w-[340px] rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13px] outline-none"
      />
      <div className="overflow-hidden overflow-x-auto rounded-2xl border border-admin-border bg-white">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-admin-border text-[12px] font-bold uppercase tracking-wide text-muted-light">
              <th className="px-3 py-2.5">Name</th>
              <th className="px-3 py-2.5">Phone</th>
              <th className="px-3 py-2.5">Email</th>
              <th className="px-3 py-2.5">Orders</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-admin-row-border">
                <td className="px-3 py-2.5">
                  <Link href={`/admin/customers/${c.id}`} className="font-bold text-ink">
                    {c.name}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-muted">{c.phone}</td>
                <td className="px-3 py-2.5 text-muted">{c.email ?? "—"}</td>
                <td className="px-3 py-2.5 font-bold text-rose">{c.orderCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted-light">No customers match this search.</p>}
      </div>
    </AdminShell>
  );
}
