import type { ApiResult } from "@/lib/types";
import { delay } from "./delay";
import { api, unwrap, USE_MOCKS } from "./client";

// POST /v1/uploads/image — admin only. Sends the file as multipart/form-data;
// the backend streams it to Cloudinary and returns the hosted URL. The admin
// token is attached by the client interceptor (isAdminPath covers /uploads).
export async function uploadImage(file: File): Promise<ApiResult<{ url: string }>> {
  if (!USE_MOCKS) {
    const form = new FormData();
    form.append("file", file);
    return unwrap<{ url: string }>(api.post("/uploads/image", form));
  }
  // Mock: hand back a local object URL so the form preview works offline.
  await delay(300);
  return { success: true, data: { url: URL.createObjectURL(file) } };
}
