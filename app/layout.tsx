import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import EmotionRegistry from "@/components/EmotionRegistry";
import { CartProvider } from "@/contexts/CartContext";

export const metadata: Metadata = {
  title: "Ramani's Cafe",
  description: "Premium South Indian Cafe - Table Ordering System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ramani's Cafe",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <EmotionRegistry>
          <ThemeProvider>
            <CartProvider>{children}</CartProvider>
          </ThemeProvider>
        </EmotionRegistry>
      </body>
    </html>
  );
}
