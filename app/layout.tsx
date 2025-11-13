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
}