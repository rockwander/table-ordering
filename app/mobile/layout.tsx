export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simple layout - no sidebar, no navigation
  // Just the content
  return <>{children}</>;
}
