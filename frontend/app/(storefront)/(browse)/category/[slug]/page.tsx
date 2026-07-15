import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory } from "@/lib/api/categories";
import { getProducts } from "@/lib/api/products";
import { ProductCardInteractive } from "@/components/storefront/ProductCardInteractive";

// No design file for this screen — built to match Shop's grid/breadcrumb
// shell, scoped down to a single category instead of Shop's full filter panel.
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categoryRes = await getCategory(slug);
  if (!categoryRes.success) notFound();
  const category = categoryRes.data;

  const productsRes = await getProducts({ category: category.id, limit: 60 });
  const products = productsRes.success ? productsRes.data : [];

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-5 pb-14 sm:px-8 sm:pt-8">
      <div className="mb-1.5 text-[13px] text-muted-light">
        <Link href="/">Home</Link> / <Link href="/shop">Shop</Link> / <span className="text-ink">{category.name}</span>
      </div>
      <h1 className="mb-5 text-2xl font-extrabold sm:text-[30px]">{category.name}</h1>

      {products.length === 0 ? (
        <p className="py-10 text-center text-muted">No products in this category yet.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          {products.map((p) => (
            <ProductCardInteractive key={p.id} product={p} showAddToCart />
          ))}
        </div>
      )}
    </div>
  );
}
