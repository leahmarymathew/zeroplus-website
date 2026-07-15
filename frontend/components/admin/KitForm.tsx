"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createKit, updateKit } from "@/lib/api/admin/kits";
import { getAdminProducts } from "@/lib/api/admin/products";
import type { Kit, Product } from "@/lib/types";

interface OptionRow {
  key: string;
  productVariantId: string;
  priceAdjustment: string;
}
interface SlotRow {
  key: string;
  label: string;
  options: OptionRow[];
}

function slotRowsFrom(kit?: Kit): SlotRow[] {
  if (!kit) return [{ key: crypto.randomUUID(), label: "", options: [] }];
  return kit.slots.map((s) => ({
    key: s.id,
    label: s.label,
    options: s.options.map((o) => ({ key: o.id, productVariantId: o.productVariantId, priceAdjustment: o.priceAdjustment ? String(o.priceAdjustment) : "" })),
  }));
}

export function KitForm({ kit }: { kit?: Kit }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState(kit?.name ?? "");
  const [description, setDescription] = useState(kit?.description ?? "");
  const [basePrice, setBasePrice] = useState(kit ? String(kit.basePrice) : "");
  const [slots, setSlots] = useState<SlotRow[]>(slotRowsFrom(kit));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminProducts({ sort: "name" }).then((res) => {
      if (res.success) setProducts(res.data);
    });
  }, []);

  const variantOptions = products.flatMap((p) =>
    p.variants.map((v) => ({
      productVariantId: v.id,
      label: `${p.name} — ${v.label}`,
      productName: p.name,
      variantLabel: v.label,
    }))
  );

  function updateSlot(key: string, patch: Partial<SlotRow>) {
    setSlots((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function addSlot() {
    setSlots((rows) => [...rows, { key: crypto.randomUUID(), label: "", options: [] }]);
  }
  function removeSlot(key: string) {
    setSlots((rows) => rows.filter((r) => r.key !== key));
  }
  function moveSlot(key: string, dir: -1 | 1) {
    setSlots((rows) => {
      const idx = rows.findIndex((r) => r.key === key);
      const next = idx + dir;
      if (next < 0 || next >= rows.length) return rows;
      const copy = [...rows];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  }
  function addOption(slotKey: string) {
    updateSlot(slotKey, {
      options: [
        ...(slots.find((s) => s.key === slotKey)?.options ?? []),
        { key: crypto.randomUUID(), productVariantId: variantOptions[0]?.productVariantId ?? "", priceAdjustment: "" },
      ],
    });
  }
  function removeOption(slotKey: string, optKey: string) {
    const slot = slots.find((s) => s.key === slotKey);
    if (!slot) return;
    updateSlot(slotKey, { options: slot.options.filter((o) => o.key !== optKey) });
  }
  function updateOption(slotKey: string, optKey: string, patch: Partial<OptionRow>) {
    const slot = slots.find((s) => s.key === slotKey);
    if (!slot) return;
    updateSlot(slotKey, { options: slot.options.map((o) => (o.key === optKey ? { ...o, ...patch } : o)) });
  }

  async function handleSave() {
    if (!name.trim() || !basePrice) {
      toast.error("Kit name and base price are required");
      return;
    }
    if (slots.length === 0 || slots.some((s) => !s.label.trim() || s.options.length === 0)) {
      toast.error("Every slot needs a label and at least one option");
      return;
    }

    setSaving(true);
    const input = {
      name: name.trim(),
      description: description.trim(),
      basePrice: Number(basePrice) || 0,
      imageUrl: kit?.imageUrl ?? null,
      isActive: kit?.isActive ?? true,
      slots: slots.map((s) => ({
        label: s.label.trim(),
        options: s.options.map((o) => {
          const match = variantOptions.find((v) => v.productVariantId === o.productVariantId);
          return {
            productVariantId: o.productVariantId,
            productName: match?.productName ?? "",
            variantLabel: match?.variantLabel ?? "",
            priceAdjustment: o.priceAdjustment ? Number(o.priceAdjustment) : 0,
          };
        }),
      })),
    };

    const res = kit ? await updateKit(kit.id, input) : await createKit(input);
    setSaving(false);
    if (res.success) {
      toast.success(kit ? "Kit updated" : "Kit created");
      router.push("/admin/kits");
    } else {
      toast.error(res.error.message);
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3.5 rounded-2xl border border-admin-border bg-white p-5">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-bold">Kit Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13.5px] outline-none focus:border-rose"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-bold">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13.5px] outline-none focus:border-rose"
            />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-bold">Base Price (₹)</label>
              <input
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13.5px] outline-none focus:border-rose"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-bold">Hero Image</label>
              <div className="flex h-[42px] items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-border-pink text-[12.5px] font-bold text-rose">
                + Upload
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold">Slots</h2>
          <button type="button" onClick={addSlot} className="rounded-[10px] bg-rose px-4 py-2 text-xs font-bold text-white">
            + Add Slot
          </button>
        </div>

        {slots.map((slot) => (
          <div key={slot.key} className="rounded-2xl border border-admin-border bg-white p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="cursor-grab text-base text-strikethrough">⠿</span>
              <input
                placeholder="e.g. Choose a diaper pack"
                value={slot.label}
                onChange={(e) => updateSlot(slot.key, { label: e.target.value })}
                className="flex-1 rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2 text-[13.5px] font-bold outline-none"
              />
              <button type="button" onClick={() => moveSlot(slot.key, -1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-input-fill text-muted-light">
                ↑
              </button>
              <button type="button" onClick={() => moveSlot(slot.key, 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-input-fill text-muted-light">
                ↓
              </button>
              <button type="button" onClick={() => removeSlot(slot.key)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger-bg text-danger-text">
                ×
              </button>
            </div>

            <div className="mb-2.5 flex flex-col gap-2">
              {slot.options.map((opt) => (
                <div key={opt.key} className="grid grid-cols-[2fr_1fr_auto] items-center gap-2 rounded-[10px] bg-input-fill p-2">
                  <select
                    value={opt.productVariantId}
                    onChange={(e) => updateOption(slot.key, opt.key, { productVariantId: e.target.value })}
                    className="rounded-lg border-[1.5px] border-border-pink px-2.5 py-2 text-[12.5px] outline-none"
                  >
                    {variantOptions.map((v) => (
                      <option key={v.productVariantId} value={v.productVariantId}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="+₹ price adj."
                    value={opt.priceAdjustment}
                    onChange={(e) => updateOption(slot.key, opt.key, { priceAdjustment: e.target.value.replace(/\D/g, "") })}
                    className="rounded-lg border-[1.5px] border-border-pink px-2.5 py-2 text-[12.5px] outline-none"
                  />
                  <button type="button" onClick={() => removeOption(slot.key, opt.key)} className="text-lg text-strikethrough">
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => addOption(slot.key)} className="rounded-lg bg-surface-pink-light px-3.5 py-1.5 text-xs font-bold text-rose">
              + Add Option
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 rounded-2xl border border-admin-border bg-white p-4.5">
        <button type="button" onClick={handleSave} disabled={saving} className="rounded-[10px] bg-rose py-3 text-sm font-bold text-white disabled:opacity-60">
          {saving ? "Saving…" : "Save Kit"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/kits")}
          className="rounded-[10px] border-[1.5px] border-admin-border bg-white py-2.5 text-[13.5px] font-bold text-muted-light"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
