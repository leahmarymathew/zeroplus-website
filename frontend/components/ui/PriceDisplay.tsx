import { discountPercent, formatPrice } from "@/lib/format";

interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number | null;
  size?: "sm" | "md" | "lg";
  showDiscountBadge?: boolean;
}

const priceSize: Record<NonNullable<PriceDisplayProps["size"]>, string> = {
  sm: "text-[15px]",
  md: "text-xl",
  lg: "text-2xl",
};

const compareSize: Record<NonNullable<PriceDisplayProps["size"]>, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-[15px]",
};

export function PriceDisplay({ price, compareAtPrice, size = "sm", showDiscountBadge = false }: PriceDisplayProps) {
  const hasDiscount = !!compareAtPrice && compareAtPrice > price;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className={`font-extrabold text-rose ${priceSize[size]}`}>{formatPrice(price)}</span>
      {hasDiscount && (
        <>
          <span className={`text-strikethrough line-through ${compareSize[size]}`}>
            {formatPrice(compareAtPrice!)}
          </span>
          {showDiscountBadge && (
            <span className="rounded-full bg-ink px-2.5 py-[3px] text-[11px] font-bold text-white">
              {discountPercent(price, compareAtPrice!)}% OFF
            </span>
          )}
        </>
      )}
    </div>
  );
}
