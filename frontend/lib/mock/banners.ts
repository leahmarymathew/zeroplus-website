import type { Banner } from "@/lib/types";

export type { Banner };

export const MOCK_BANNERS: Banner[] = [
  { id: "banner_1", slotLabel: "Homepage Hero — Slide 1", title: "Sample Banner — Diaper Sale", imageUrl: null, videoUrl: null, status: "ACTIVE", sortOrder: 0 },
  { id: "banner_2", slotLabel: "Homepage Hero — Slide 2", title: "Sample Banner — New Kits Launch", imageUrl: null, videoUrl: null, status: "ACTIVE", sortOrder: 1 },
  { id: "banner_3", slotLabel: "Homepage Hero — Slide 3", title: "Sample Banner — Skincare Bundle", imageUrl: null, videoUrl: null, status: "SCHEDULED", sortOrder: 2 },
];
