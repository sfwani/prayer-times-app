import type { Metadata, Viewport } from "next";
import { Roboto } from 'next/font/google';
import "./globals.css";

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
});

export const viewport: Viewport = {
  initialScale: 0.6,
  minimumScale: 0.6,
  maximumScale: 5.0,
  width: 'device-width',
  userScalable: true,
}

export const metadata: Metadata = {
  title: "Prayer Times App",
  description: "Islamic prayer times application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.className}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
