"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createProduct, updateProduct } from "@/lib/api/admin/products";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { VideoUploader } from "@/components/admin/VideoUploader";
import { AGE_TAGS } from "@/lib/ageTags";
import type { Category, Product } from "@/lib/types";

const CERT_OPTIONS = ["Dermatologically Tested", "Hypoallergenic", "BPA Free", "Cruelty Free", "Fragrance Free"];

interface VariantRow {
  key: string;
  label: string;
  price: string;
  compareAtPrice: string;
  stockQty: string;
}

function variantRowsFrom(product?: Product): VariantRow[] {
  if (!product) return [{ key: crypto.randomUUID(), label: "", price: "", compareAtPrice: "", stockQty: "" }];
  return product.variants.map((v) => ({
    key: v.id,
    label: v.label,
    price: String(v.price),
    compareAtPrice: v.compareAtPrice != null ? String(v.compareAtPrice) : "",
    stockQty: String(v.stockQty),
  }));
}

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [safetyInfo, setSafetyInfo] = useState(product?.safetyInfo ?? "");
  const [ownerHighlight, setOwnerHighlight] = useState(product?.ownerHighlight ?? "");
  const [certifications, setCertifications] = useState<Set<string>>(new Set(product?.certifications ?? []));
  const [ageTags, setAgeTags] = useState<Set<string>>(new Set(product?.ageTags ?? []));
  const [variants, setVariants] = useState<VariantRow[]>(variantRowsFrom(product));
  const [images, setImages] = useState<string[]>(
    [...(product?.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder).map((img) => img.url)
  );
  const [videoUrl, setVideoUrl] = useState<string | null>(product?.videoUrl ?? null);
  const [saving, setSaving] = useState(false);

  function toggleCert(cert: string) {
    setCertifications((prev) => {
      const next = new Set(prev);
      if (next.has(cert)) next.delete(cert);
      else next.add(cert);
      return next;
    });
  }

  function toggleAgeTag(tag: string) {
    setAgeTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function updateVariant(key: string, patch: Partial<VariantRow>) {
    setVariants((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function addVariant() {
    setVariants((rows) => [...rows, { key: crypto.randomUUID(), label: "", price: "", compareAtPrice: "", stockQty: "" }]);
  }
  function removeVariant(key: string) {
    setVariants((rows) => rows.filter((r) => r.key !== key));
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (variants.length === 0 || variants.some((v) => !v.label.trim() || !v.price)) {
      toast.error("Every variant needs a size/color label and a price");
      return;
    }

    setSaving(true);
    const input = {
      name: name.trim(),
      description: description.trim(),
      categoryId,
      brand: brand.trim() || null,
      safetyInfo: safetyInfo.trim() || null,
      certifications: Array.from(certifications),
      ageTags: Array.from(ageTags),
      ownerHighlight: ownerHighlight.trim() || null,
      isActive: product?.isActive ?? true,
      videoUrl,
      images: images.map((url, i) => ({ url, sortOrder: i })),
      variants: variants.map((v) => ({
        label: v.label.trim(),
        price: Number(v.price) || 0,
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        stockQty: Number(v.stockQty) || 0,
        sku: `SKU-${(product?.id ?? name).toUpperCase().replace(/[^A-Z0-9]+/g, "")}-${v.label.toUpperCase().replace(/[^A-Z0-9]+/g, "")}`,
      })),
    };

    const res = product ? await updateProduct(product.id, input) : await createProduct(input);
    setSaving(false);
    if (res.success) {
      toast.success(product ? "Product updated" : "Product created");
      router.push("/admin/products");
    } else {
      toast.error(res.error.message);
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-3.5 rounded-2xl border border-admin-border bg-white p-5">
        <div>
          <label className="mb-1.5 block text-[12.5px] font-bold">Product Name</label>
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
        <ImageUploader value={images} onChange={setImages} />
        <VideoUploader value={videoUrl} onChange={setVideoUrl} />
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-bold">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13.5px] outline-none focus:border-rose"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-bold">Brand</label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13.5px] outline-none focus:border-rose"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[12.5px] font-bold">Safety Info</label>
          <textarea
            value={safetyInfo}
            onChange={(e) => setSafetyInfo(e.target.value)}
            rows={2}
            className="w-full resize-y rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13.5px] outline-none focus:border-rose"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[12.5px] font-bold">Variants</label>
            <button type="button" onClick={addVariant} className="rounded-lg bg-surface-pink-light px-3 py-1.5 text-xs font-bold text-rose">
              + Add Variant
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {variants.map((v) => (
              <div key={v.key} className="grid grid-cols-[1fr_0.8fr_0.8fr_0.8fr_auto_auto] items-center gap-2 rounded-[10px] bg-input-fill p-2">
                <input
                  placeholder="Size/Color"
                  value={v.label}
                  onChange={(e) => updateVariant(v.key, { label: e.target.value })}
                  className="rounded-lg border-[1.5px] border-border-pink px-2.5 py-2 text-[12.5px] outline-none"
                />
                <input
                  placeholder="Price"
                  value={v.price}
                  onChange={(e) => updateVariant(v.key, { price: e.target.value.replace(/\D/g, "") })}
                  className="rounded-lg border-[1.5px] border-border-pink px-2.5 py-2 text-[12.5px] outline-none"
                />
                <input
                  placeholder="Compare-at"
                  value={v.compareAtPrice}
                  onChange={(e) => updateVariant(v.key, { compareAtPrice: e.target.value.replace(/\D/g, "") })}
                  className="rounded-lg border-[1.5px] border-border-pink px-2.5 py-2 text-[12.5px] outline-none"
                />
                <input
                  placeholder="Stock"
                  value={v.stockQty}
                  onChange={(e) => updateVariant(v.key, { stockQty: e.target.value.replace(/\D/g, "") })}
                  className="rounded-lg border-[1.5px] border-border-pink px-2.5 py-2 text-[12.5px] outline-none"
                />
                {/* Sold out is not stored separately — it just means stock 0.
                    Ticking zeroes this variant; unticking clears the box so the
                    real restock count gets typed in rather than guessed. */}
                <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-[11.5px] font-bold text-muted">
                  <input
                    type="checkbox"
                    checked={v.stockQty !== "" && Number(v.stockQty) === 0}
                    onChange={(e) => updateVariant(v.key, { stockQty: e.target.checked ? "0" : "" })}
                    className="h-3.5 w-3.5 cursor-pointer accent-rose"
                  />
                  Sold out
                </label>
                <button type="button" onClick={() => removeVariant(v.key)} className="text-lg text-strikethrough">
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-light">
            Compare-at price is optional — set it only when the variant is on sale, to show a struck-through original
            price on the storefront.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-[12.5px] font-bold">Certifications</label>
          <div className="flex flex-wrap gap-2">
            {CERT_OPTIONS.map((cert) => {
              const on = certifications.has(cert);
              return (
                <button
                  key={cert}
                  type="button"
                  onClick={() => toggleCert(cert)}
                  className={`rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-bold ${
                    on ? "border-success-text bg-success-bg text-success-text-dark" : "border-admin-border bg-input-fill text-muted"
                  }`}
                >
                  {cert}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-light">
            Select any that apply — shown as small badges on the product page. Different from the highlight badge below.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-[12.5px] font-bold">Age / Stage Tags</label>
          <div className="flex flex-wrap gap-2">
            {AGE_TAGS.map((tag) => {
              const on = ageTags.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleAgeTag(tag)}
                  className={`rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-bold ${
                    on ? "border-rose bg-surface-pink-light text-rose" : "border-admin-border bg-input-fill text-muted"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-light">
            Select every stage this product suits — a newborn diaper pack might span several. Used for the age filter on
            the storefront.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border-[1.5px] border-dashed border-warning-text/50 bg-warning-bg p-4.5">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-[13px] font-extrabold text-warning-text">Highlight Badge</span>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-warning-text">Optional</span>
          </div>
          <p className="mb-2.5 text-xs leading-relaxed text-muted">
            Leave blank for most products. Only set this for a seasonal or featured callout — it shows as a small
            badge next to the product photo (e.g. &ldquo;Best for rainy season&rdquo;).
          </p>
          <input
            placeholder="e.g. Best for rainy season"
            value={ownerHighlight}
            onChange={(e) => setOwnerHighlight(e.target.value)}
            className="w-full rounded-[10px] border-[1.5px] border-warning-text/40 bg-white px-3.5 py-2.5 text-[13.5px] outline-none"
          />
        </div>
        <div className="flex flex-col gap-2.5 rounded-2xl border border-admin-border bg-white p-4.5">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-[10px] bg-rose py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Product"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="rounded-[10px] border-[1.5px] border-admin-border bg-white py-2.5 text-[13.5px] font-bold text-muted-light"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
