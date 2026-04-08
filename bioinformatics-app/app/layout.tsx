import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BioGenome Analytics | Professional Sequence Analysis Suite",
  description:
    "Advanced bioinformatics platform for DNA, RNA, and protein sequence analysis powered by Biopython",
  keywords: [
    "bioinformatics",
    "DNA analysis",
    "sequence analysis",
    "genomics",
    "restriction enzymes",
  ],
  authors: [{ name: "BioGenome Analytics" }],
  metadataBase: new URL("https://biogenome-analytics.com"),
  openGraph: {
    title: "BioGenome Analytics | Professional Sequence Analysis Suite",
    description:
      "Advanced bioinformatics platform for DNA, RNA, and protein sequence analysis",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {/* Animated background */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          {/* Gradient orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "4s" }}
          />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {children}
      </body>
    </html>
  );
}
