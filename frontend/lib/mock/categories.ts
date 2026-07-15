import type { Category } from "@/lib/types";

// Placeholder catalog structure — matches the Category shape in Section 5
// exactly. Real names/images come from the store owner (Section 15.3).
export const MOCK_CATEGORIES: Category[] = [
  { id: "cat_diapers", name: "Diapers", slug: "diapers", parentId: null, imageUrl: null },
  { id: "cat_feeding", name: "Feeding", slug: "feeding", parentId: null, imageUrl: null },
  { id: "cat_clothing", name: "Clothing", slug: "clothing", parentId: null, imageUrl: null },
  { id: "cat_skincare", name: "Skincare", slug: "skincare", parentId: null, imageUrl: null },
  { id: "cat_toys", name: "Toys", slug: "toys", parentId: null, imageUrl: null },
];
