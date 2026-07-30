"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminBanners, addBanner, removeBanner, updateBanner } from "@/lib/api/admin/banners";
import { uploadImage } from "@/lib/api/uploads";
import type { Banner } from "@/lib/mock/banners";

const STATUS_STYLES: Record<Banner["status"], string> = {
  ACTIVE: "bg-success-bg text-success-text",
  SCHEDULED: "bg-warning-bg text-warning-text",
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  function refresh() {
    getAdminBanners().then((res) => {
      if (res.success) setBanners(res.data);
    });
  }

  useEffect(refresh, []);

  async function handleAdd() {
    const res = await addBanner("New slide — untitled");
    if (res.success) refresh();
  }

  async function handleRemove(banner: Banner) {
    const res = await removeBanner(banner.id);
    if (res.success) {
      toast.success("Slide removed");
      refresh();
    }
  }

  async function handleReplaceImage(banner: Banner, file: File | undefined) {
    if (!file) return;
    setUploadingId(banner.id);
    const uploadRes = await uploadImage(file);
    if (!uploadRes.success) {
      setUploadingId(null);
      toast.error(uploadRes.error.message);
      return;
    }
    const res = await updateBanner(banner.id, { imageUrl: uploadRes.data.url });
    setUploadingId(null);
    const input = fileInputs.current[banner.id];
    if (input) input.value = "";
    if (res.success) {
      toast.success("Slide image updated");
      refresh();
    } else {
      toast.error(res.error.message);
    }
  }

  return (
    <AdminShell>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2.5">
        <h1 className="text-[22px] font-extrabold">Homepage Hero Banners</h1>
        <button type="button" onClick={handleAdd} className="rounded-[10px] bg-rose px-5 py-2.5 text-[13.5px] font-bold text-white">
          + Add Slide
        </button>
      </div>
      <p className="mb-4.5 text-[13px] text-muted-light">
        Controls only the rotating hero banner at the top of the homepage — not general site imagery. Slides rotate
        in this order.
      </p>

      <div className="flex max-w-[680px] flex-col gap-3">
        {banners.map((b) => (
          <div key={b.id} className="flex items-center gap-3.5 rounded-2xl border border-admin-border bg-white p-3">
            <span className="cursor-grab text-lg text-strikethrough">⠿</span>
            {b.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.imageUrl} alt="" className="h-[50px] w-[90px] flex-none rounded-lg object-cover" />
            ) : (
              <div className="h-[50px] w-[90px] flex-none rounded-lg bg-surface-pink-light" />
            )}
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 text-[11.5px] font-extrabold uppercase tracking-wide text-rose">{b.slotLabel}</div>
              <div className="text-[13.5px] font-bold">{b.title}</div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[b.status]}`}>{b.status === "ACTIVE" ? "Active" : "Scheduled"}</span>
            <input
              ref={(el) => { fileInputs.current[b.id] = el; }}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleReplaceImage(b, e.target.files?.[0])}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputs.current[b.id]?.click()}
              disabled={uploadingId === b.id}
              className="rounded-lg bg-surface-pink-light px-3.5 py-1.5 text-xs font-bold text-rose disabled:opacity-60"
            >
              {uploadingId === b.id ? "Uploading…" : "Replace Image"}
            </button>
            <button type="button" onClick={() => handleRemove(b)} className="text-lg text-strikethrough">
              ×
            </button>
          </div>
        ))}
        {banners.length === 0 && <p className="text-sm text-muted-light">No slides yet — add one to get started.</p>}
      </div>
    </AdminShell>
  );
}
