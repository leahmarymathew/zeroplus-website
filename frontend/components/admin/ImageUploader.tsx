"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { uploadImage } from "@/lib/api/uploads";

// Cover + gallery photo uploader. Holds an ordered list of hosted image URLs;
// the first is the product's cover. Uploads go through POST /v1/uploads/image
// (Cloudinary) via lib/api/uploads — the admin token is attached automatically.
export function ImageUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const res = await uploadImage(file);
      if (res.success) uploaded.push(res.data.url);
      else toast.error(res.error.message);
    }
    setUploading(false);
    if (uploaded.length) onChange([...value, ...uploaded]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function makeCover(index: number) {
    if (index === 0) return;
    const next = [...value];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-[12.5px] font-bold">Photos</label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg bg-surface-pink-light px-3 py-1.5 text-xs font-bold text-rose disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "+ Upload Photos"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {value.length === 0 ? (
        <p className="rounded-[10px] bg-input-fill px-3.5 py-4 text-center text-[12px] text-muted-light">
          No photos yet. Upload a cover photo and a few gallery shots.
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {value.map((url, i) => (
            <div key={url + i} className="group relative aspect-square overflow-hidden rounded-[10px] border border-admin-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-rose px-2 py-0.5 text-[9px] font-bold text-white">Cover</span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/45 px-1.5 py-1 opacity-0 transition group-hover:opacity-100">
                {i !== 0 && (
                  <button type="button" onClick={() => makeCover(i)} className="text-[10px] font-bold text-white">
                    Make cover
                  </button>
                )}
                <button type="button" onClick={() => removeAt(i)} className="ml-auto text-[10px] font-bold text-white">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-1.5 text-[11px] text-muted-light">
        The first photo is the cover shown in listings. Hover a photo to reorder or remove it.
      </p>
    </div>
  );
}
