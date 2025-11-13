import type { Metadata } from "next";
import AuthProvider from "./providers";

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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}# Portal deployment Thu Nov 13 00:10:19 EST 2025
