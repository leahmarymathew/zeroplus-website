// Mirrors backend/src/lib/ageTags.ts — see docs/category-tag-plan.md for the
// full ladder and rationale. Kept in sync manually; the backend validates the
// same fixed list via zod, so a mismatch here would just get rejected there.
export const AGE_TAGS = [
  "Premature",
  "Newborn (0-2 weeks)",
  "2-4 weeks",
  "1-3 Months",
  "3-6 Months",
  "6-9 Months",
  "9-12 Months",
  "12-18 Months",
  "18-24 Months",
] as const;
