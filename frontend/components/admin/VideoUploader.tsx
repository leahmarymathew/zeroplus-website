"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { uploadVideo } from "@/lib/api/uploads";

// Single optional video slot — most products won't have one. Separate from
// ImageUploader's multi-photo gallery: one file, one preview, one "Remove".
export function VideoUploader({
  value,
  onChange,
  label = "Video",
  hint = "Optional — a short demo or unboxing clip. Most products won't have one.",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const res = await uploadVideo(file);
    setUploading(false);
    if (res.success) onChange(res.data.url);
    else toast.error(res.error.message);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-[12.5px] font-bold">{label}</label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg bg-surface-pink-light px-3 py-1.5 text-xs font-bold text-rose disabled:opacity-60"
        >
          {uploading ? "Uploading…" : value ? "Replace Video" : "+ Upload Video"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
        />
      </div>

      {value ? (
        <div className="relative overflow-hidden rounded-[10px] border border-admin-border">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={value} controls className="max-h-[220px] w-full bg-black" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white"
          >
            Remove
          </button>
        </div>
      ) : (
        <p className="rounded-[10px] bg-input-fill px-3.5 py-4 text-center text-[12px] text-muted-light">
          No video uploaded.
        </p>
      )}
      <p className="mt-1.5 text-[11px] text-muted-light">{hint}</p>
    </div>
  );
}
