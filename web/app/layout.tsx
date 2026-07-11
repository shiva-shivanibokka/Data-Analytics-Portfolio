import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Olist Marketplace Analytics",
  description:
    "An interactive analytics dashboard on the real Olist Brazilian e-commerce dataset — ~100k orders. Charts precomputed by a Python pipeline; the explorer queries a Parquet file live in your browser with DuckDB-WASM.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
