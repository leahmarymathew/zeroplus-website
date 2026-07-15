export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-admin-bg text-ink">{children}</div>;
}
