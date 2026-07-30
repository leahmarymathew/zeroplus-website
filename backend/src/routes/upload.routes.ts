import { Router } from "express";
import multer from "multer";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { ok } from "../lib/respond.js";
import { ApiError } from "../lib/errors.js";
import { uploadMedia } from "../lib/cloudinary.js";

export const uploadsRouter = Router();

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

// In-memory storage (Railway/Render disks are ephemeral). 100MB cap covers a
// short product/hero video; images are a few hundred KB in practice and never
// approach it.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if ([...IMAGE_TYPES, ...VIDEO_TYPES].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "INVALID_FILE_TYPE", "Only JPEG/PNG/WebP images or MP4/WebM/MOV videos are allowed"));
    }
  },
});

// POST /v1/uploads/image — admin only. Browser -> backend -> Cloudinary.
// Despite the path (kept for compatibility with existing callers), this
// accepts both images and short videos — resourceType is inferred from the
// upload's mimetype, not the URL.
uploadsRouter.post("/image", requireAuth, requireAdmin, upload.single("file"), async (req, res) => {
  if (!req.file) throw new ApiError(400, "NO_FILE", "No file was uploaded");
  const resourceType = VIDEO_TYPES.includes(req.file.mimetype) ? "video" : "image";
  const url = await uploadMedia(req.file.buffer, req.file.originalname, resourceType);
  ok(res, { url }, undefined, 201);
});
