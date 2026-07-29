import { v2 as cloudinary } from "cloudinary";
import { config } from "../config.js";

if (config.cloudinary.enabled) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

// Streams an in-memory file buffer to Cloudinary with a signed server-side
// request (the API secret never reaches the browser — plan 6.1). When
// Cloudinary is unconfigured, returns a deterministic placeholder URL so the
// admin flow is testable without credentials. `resourceType` selects
// Cloudinary's image vs video pipeline — same account, same credentials,
// just a different asset type (product demo clips, hero banner videos).
export async function uploadMedia(
  buffer: Buffer,
  filename: string,
  resourceType: "image" | "video" = "image",
): Promise<string> {
  if (!config.cloudinary.enabled) {
    return resourceType === "video"
      ? `https://placehold.co/600x400?text=${encodeURIComponent(filename)}+(video+placeholder)`
      : `https://placehold.co/600x600?text=${encodeURIComponent(filename)}`;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "zeroplus", resource_type: resourceType },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}

// Back-compat alias — most call sites only ever upload images.
export const uploadImage = (buffer: Buffer, filename: string) => uploadMedia(buffer, filename, "image");
