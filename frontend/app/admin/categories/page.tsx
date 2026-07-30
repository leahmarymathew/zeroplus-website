"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminCategories, createCategory, updateCategory, type AdminCategory } from "@/lib/api/admin/categories";
import { uploadImage } from "@/lib/api/uploads";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function refresh() {
    getAdminCategories().then((res) => {
      if (res.success) setCategories(res.data);
    });
  }

  useEffect(refresh, []);

  function startEdit(c: AdminCategory) {
    setEditingId(c.id);
    setName(c.name);
    setImageUrl(c.imageUrl);
  }
  function cancelEdit() {
    setEditingId(null);
    setName("");
    setImageUrl(null);
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const res = await uploadImage(file);
    setUploading(false);
    if (res.success) setImageUrl(res.data.url);
    else toast.error(res.error.message);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setSaving(true);
    const res = editingId
      ? await updateCategory(editingId, { name: name.trim(), imageUrl })
      : await createCategory({ name: name.trim(), imageUrl });
    setSaving(false);
    if (res.success) {
      toast.success(editingId ? "Category updated" : "Category added");
      cancelEdit();
      refresh();
    } else {
      toast.error(res.error.message);
    }
  }

  return (
    <AdminShell>
      <h1 className="mb-4.5 text-[22px] font-extrabold">Categories</h1>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_1.4fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-admin-border bg-white p-4.5">
          <div className="mb-3 text-[13.5px] font-bold">{editingId ? "Edit Category" : "Add Category"}</div>
          <div className="flex flex-col gap-2.5">
            <input
              type="text"
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13.5px] outline-none focus:border-rose"
            />
            <div>
              <label className="mb-1.5 block text-[12.5px] font-bold">Category Image</label>
              <div className="flex items-center gap-3">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="" className="h-16 w-16 flex-none rounded-xl object-cover" />
                ) : (
                  <div className="h-16 w-16 flex-none rounded-xl bg-surface-pink-light" />
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex h-16 flex-1 items-center justify-center rounded-xl border-[1.5px] border-dashed border-border-pink text-[12.5px] font-bold text-rose disabled:opacity-60"
                >
                  {uploading ? "Uploading…" : "+ Upload"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                  className="hidden"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-light">Used as the tile image for this category on the homepage.</p>
            </div>
            <button type="submit" disabled={saving} className="rounded-[10px] bg-rose py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60">
              {saving ? "Saving…" : editingId ? "Save Changes" : "Add Category"}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="rounded-[10px] border-[1.5px] border-admin-border py-2 text-[13px] font-bold text-muted-light">
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="overflow-hidden overflow-x-auto rounded-2xl border border-admin-border bg-white">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-admin-border text-[12px] font-bold uppercase tracking-wide text-muted-light">
                <th className="px-3 py-2.5">Image</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5"># Products</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-admin-row-border">
                  <td className="px-3 py-2.5">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
                    ) : (
                      <div className="h-9 w-9 rounded-lg bg-surface-pink-light" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-bold">{c.name}</td>
                  <td className="px-3 py-2.5 text-muted">{c.productCount}</td>
                  <td className="px-3 py-2.5">
                    <button type="button" onClick={() => startEdit(c)} className="rounded-lg bg-surface-pink-light px-3.5 py-1.5 text-xs font-bold text-rose">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
