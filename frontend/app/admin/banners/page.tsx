"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminBanners, addBanner, updateBanner, removeBanner } from "@/lib/api/admin/banners";
import { uploadImage, uploadVideo } from "@/lib/api/uploads";
import type { Banner } from "@/lib/mock/banners";

const STATUS_STYLES: Record<Banner["status"], string> = {
  ACTIVE: "bg-success-bg text-success-text",
  SCHEDULED: "bg-warning-bg text-warning-text",
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const targetIdRef = useRef<string | null>(null);

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

  function pickImage(id: string) {
    targetIdRef.current = id;
    imageInputRef.current?.click();
  }
  function pickVideo(id: string) {
    targetIdRef.current = id;
    videoInputRef.current?.click();
  }

  async function handleImageFile(file: File | undefined) {
    const id = targetIdRef.current;
    if (!file || !id) return;
    setUploadingId(id);
    const uploaded = await uploadImage(file);
    if (uploaded.success) {
      const res = await updateBanner(id, { imageUrl: uploaded.data.url });
      if (res.success) refresh();
      else toast.error(res.error.message);
    } else {
      toast.error(uploaded.error.message);
    }
    setUploadingId(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function handleVideoFile(file: File | undefined) {
    const id = targetIdRef.current;
    if (!file || !id) return;
    setUploadingId(id);
    const uploaded = await uploadVideo(file);
    if (uploaded.success) {
      const res = await updateBanner(id, { videoUrl: uploaded.data.url });
      if (res.success) refresh();
      else toast.error(res.error.message);
    } else {
      toast.error(uploaded.error.message);
    }
    setUploadingId(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
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
        Controls only the rotating hero banner at the top of the homepage — not general site imagery. A slide shows
        its video if one is set, otherwise its image. Slides rotate in this order.
      </p>

      {/* Shared hidden inputs — the ref set right before opening the picker
          tells the change handler which banner it's replacing media for. */}
      <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleImageFile(e.target.files?.[0])} />
      <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => handleVideoFile(e.target.files?.[0])} />

      <div className="flex max-w-[820px] flex-col gap-3">
        {banners.map((b) => (
          <div key={b.id} className="flex items-center gap-3.5 rounded-2xl border border-admin-border bg-white p-3">
            <span className="cursor-grab text-lg text-strikethrough">⠿</span>
            <div className="h-[50px] w-[90px] flex-none overflow-hidden rounded-lg bg-surface-pink-light">
              {b.videoUrl ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={b.videoUrl} muted className="h-full w-full object-cover" />
              ) : b.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 text-[11.5px] font-extrabold uppercase tracking-wide text-rose">{b.slotLabel}</div>
              <div className="text-[13.5px] font-bold">{b.title}</div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[b.status]}`}>{b.status === "ACTIVE" ? "Active" : "Scheduled"}</span>
            <button
              type="button"
              onClick={() => pickImage(b.id)}
              disabled={uploadingId === b.id}
              className="rounded-lg bg-surface-pink-light px-3.5 py-1.5 text-xs font-bold text-rose disabled:opacity-60"
            >
              {uploadingId === b.id ? "Uploading…" : "Replace Image"}
            </button>
            <button
              type="button"
              onClick={() => pickVideo(b.id)}
              disabled={uploadingId === b.id}
              className="rounded-lg bg-surface-pink-light px-3.5 py-1.5 text-xs font-bold text-rose disabled:opacity-60"
            >
              {uploadingId === b.id ? "Uploading…" : "Replace Video"}
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
