export function FacebookIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13 22v-9h3l.5-4H13V7c0-1.15.32-1.94 2-1.94H16.5V1.36C16.2 1.32 15.19 1.24 14 1.24 11.55 1.24 9.9 2.72 9.9 5.49V9H7v4h2.9v9H13z" />
    </svg>
  );
}
