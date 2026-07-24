import type { Metadata } from "next";
import { Bree_Serif } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import EmotionRegistry from "@/components/EmotionRegistry";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

const breeSerif = Bree_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bree-serif',
});

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
    <html lang="en" className={breeSerif.variable}>
      <body>
        <EmotionRegistry>
          <ThemeProvider>
            <LanguageProvider>
              <CartProvider>{children}</CartProvider>
            </LanguageProvider>
          </ThemeProvider>
        </EmotionRegistry>
      </body>
    </html>
  );
}
