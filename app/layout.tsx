import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer"
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export const metadata: Metadata = {
  title: "SkyYield | Power The People's Network",
  description: "Deploy 6G hotspots and earn USD rewards for providing coverage to the world's first decentralized wireless network.",
  keywords: "SkyYield, 6G, hotspot, wireless network, decentralized, earn rewards, passive income",
  openGraph: {
    title: "SkyYield | Power The People's Network",
    description: "Deploy 6G hotspots and earn USD rewards for providing coverage.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#0EA5E9',
          colorBackground: '#1A1F3A',
          colorInputBackground: '#0A0F2C',
          colorInputText: '#FFFFFF',
          colorTextSecondary: '#94A3B8',
        },
      }}
    >
      <html lang="en">
        <body className="antialiased">
          <Navigation />
          <main>{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}