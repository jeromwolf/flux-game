import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flux AI - Next-Gen Gaming Platform",
  description: "Experience the future of gaming with AI-powered mechanics",
  keywords: ["AI", "gaming", "mobile", "puzzle", "arcade", "casual"],
  authors: [{ name: "Kelly" }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-black text-white`}>{children}</body>
    </html>
  );
}