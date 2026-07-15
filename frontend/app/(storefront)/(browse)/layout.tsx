import { Header } from "@/components/layout/Header";

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header variant="full" />
      <main className="flex-1">{children}</main>
    </>
  );
}
