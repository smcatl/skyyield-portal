import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkyYield Partner Portal",
  description: "Partner management portal for SkyYield",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}