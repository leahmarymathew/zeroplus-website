import { Router } from "express";
import multer from "multer";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { ok } from "../lib/respond.js";
import { ApiError } from "../lib/errors.js";
import { uploadImage } from "../lib/cloudinary.js";

export const uploadsRouter = Router();

// In-memory storage (Railway/Render disks are ephemeral); 5MB cap; images only.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "INVALID_FILE_TYPE", "Only JPEG, PNG or WebP images are allowed"));
    }
  },
});

// POST /v1/uploads/image — admin only. Browser -> backend -> Cloudinary.
uploadsRouter.post("/image", requireAuth, requireAdmin, upload.single("file"), async (req, res) => {
  if (!req.file) throw new ApiError(400, "NO_FILE", "No file was uploaded");
  const url = await uploadImage(req.file.buffer, req.file.originalname);
  ok(res, { url }, undefined, 201);
});
