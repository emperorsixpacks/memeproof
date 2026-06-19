import type { Metadata } from "next";
import { Providers } from "@/lib/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "MemProof — Verifiable Agent Memory Vault",
  description: "Trustless AI agent memory auditing on Stellar × Walrus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
