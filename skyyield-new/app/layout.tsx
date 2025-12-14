import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

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
    <html lang="en">
      <body className="antialiased">
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
