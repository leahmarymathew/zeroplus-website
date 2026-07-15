"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { RequireAuth } from "@/components/account/RequireAuth";
import { useAuthStore } from "@/store/authStore";
import { useAddressStore } from "@/store/addressStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Address } from "@/lib/types";

const addressSchema = z.object({
  label: z.string().min(1, "Give this address a label"),
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  line1: z.string().min(3, "Enter your house / street / area"),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Enter your state"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});
type AddressForm = z.infer<typeof addressSchema>;

export default function AddressesPage() {
  return (
    <RequireAuth>
      <AddressesContent />
    </RequireAuth>
  );
}

function AddressesContent() {
  const user = useAuthStore((s) => s.user);
  const addresses = useAddressStore((s) => s.addresses);
  const addAddress = useAddressStore((s) => s.addAddress);
  const updateAddress = useAddressStore((s) => s.updateAddress);
  const removeAddress = useAddressStore((s) => s.removeAddress);

  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddressForm>({ resolver: zodResolver(addressSchema) });

  function openAdd() {
    reset({ label: "", phone: "", line1: "", city: "", state: "", pincode: "" });
    setMode("add");
  }

  function openEdit(a: Address) {
    reset({ label: a.label ?? "", phone: a.phone, line1: a.line1, city: a.city, state: a.state, pincode: a.pincode });
    setEditingId(a.id);
    setMode("edit");
  }

  function onSubmit(values: AddressForm) {
    if (mode === "edit" && editingId) {
      updateAddress(editingId, { ...values, label: values.label, line2: null, isDefault: addresses.find((a) => a.id === editingId)?.isDefault ?? false });
      toast.success("Address updated");
    } else {
      addAddress({ ...values, userId: user!.id, line2: null, isDefault: false });
      toast.success("Address added");
    }
    setMode("list");
  }

  return (
    <div className="mx-auto max-w-[1000px] px-4 pt-5 pb-14 sm:px-8 sm:pt-8">
      <div className="mb-1.5 text-[13px] text-muted-light">
        <Link href="/account">Account</Link> / <span className="text-ink">My Addresses</span>
      </div>
      <h1 className="mb-5.5 text-2xl font-extrabold sm:text-[26px]">My Addresses</h1>

      {mode === "list" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5">
          {addresses.map((a) => (
            <div key={a.id} className="rounded-[18px] border border-border-pink-light bg-white p-4.5">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[13.5px] font-bold">{a.label}</span>
                {a.isDefault && <span className="rounded-full bg-surface-pink-light px-2.5 py-0.5 text-[11px] font-bold text-rose">Default</span>}
              </div>
              <p className="mb-3 text-[13px] leading-relaxed text-muted">
                {a.line1}, {a.city}, {a.state} {a.pincode} · {a.phone}
              </p>
              <div className="flex gap-3.5 text-xs font-bold">
                <button type="button" onClick={() => openEdit(a)} className="text-rose">
                  Edit
                </button>
                <button type="button" onClick={() => removeAddress(a.id)} className="text-strikethrough">
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={openAdd}
            className="min-h-[110px] rounded-[18px] border-[1.5px] border-dashed border-border-pink text-[13.5px] font-bold text-rose"
          >
            + Add New Address
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-[420px] rounded-[18px] border border-border-pink-light bg-white p-5">
          <h2 className="mb-3.5 text-[15px] font-bold">{mode === "add" ? "Add New Address" : "Edit Address"}</h2>
          <div className="flex flex-col gap-3">
            <Input placeholder="Label (e.g. Home, Work)" {...register("label")} error={errors.label?.message} />
            <Input placeholder="Phone number" {...register("phone")} error={errors.phone?.message} />
            <Input placeholder="House / Street / Area" {...register("line1")} error={errors.line1?.message} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="City" {...register("city")} error={errors.city?.message} />
              <Input placeholder="Pincode" {...register("pincode")} error={errors.pincode?.message} />
            </div>
            <Input placeholder="State" {...register("state")} error={errors.state?.message} />
            <Button type="submit" variant="primary">
              Save Address
            </Button>
            <Button type="button" variant="secondary" onClick={() => setMode("list")}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
