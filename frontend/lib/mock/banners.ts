// Banner isn't part of Section 5's data model — the plan doesn't formalize
// this entity or give it endpoints in Section 6.2, only describing the
// admin screen's behaviour (Section 2.2: homepage hero carousel only,
// each slot labelled with where it appears). Modelled locally for the
// admin Banners screen to function.
export interface Banner {
  id: string;
  slotLabel: string;
  title: string;
  imageUrl: string | null;
  status: "ACTIVE" | "SCHEDULED";
  sortOrder: number;
}

export const MOCK_BANNERS: Banner[] = [
  { id: "banner_1", slotLabel: "Homepage Hero — Slide 1", title: "Sample Banner — Diaper Sale", imageUrl: null, status: "ACTIVE", sortOrder: 0 },
  { id: "banner_2", slotLabel: "Homepage Hero — Slide 2", title: "Sample Banner — New Kits Launch", imageUrl: null, status: "ACTIVE", sortOrder: 1 },
  { id: "banner_3", slotLabel: "Homepage Hero — Slide 3", title: "Sample Banner — Skincare Bundle", imageUrl: null, status: "SCHEDULED", sortOrder: 2 },
];
