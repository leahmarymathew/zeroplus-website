// The fixed age-stage tag ladder — see docs/category-tag-plan.md. A product
// can carry several at once (multi-select), so this backs a String[] column
// rather than a single enum value.
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

export type AgeTag = (typeof AGE_TAGS)[number];
