import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Manrope,
  JetBrains_Mono,
} from "next/font/google";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import { PublicShell } from "@/components/layout/PublicShell";
import { CustomCursor } from "@/components/ui/CustomCursor";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://amaljithnair.com"),
  title: "Amaljith Nair — AI/ML Researcher",
  description: "Interdisciplinary research exploring artificial intelligence, medical systems, and computational intelligence.",
  keywords: [
    "AI",
    "ML",
    "Research",
    "SRM IST",
    "MedTech",
    "Intelligent Systems",
    "Computational Geometry",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Amaljith Nair — AI/ML Researcher",
    description: "Interdisciplinary research exploring artificial intelligence, medical systems, and computational intelligence.",
    url: "https://amaljithnair.com",
    type: "website",
    siteName: "Amaljith.com",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Amaljith Nair — AI/ML Researcher",
    description: "Interdisciplinary research exploring artificial intelligence, medical systems, and computational intelligence.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Amaljith Nair",
    url: "https://amaljithnair.com",
    jobTitle: "AI/ML Researcher",
    description: "Interdisciplinary researcher exploring AI, medical systems, and computational intelligence.",
    affiliation: {
      "@type": "Organization",
      "name": "SRM Institute of Science and Technology"
    },
    sameAs: [
      "https://github.com/AMALJITH-T",
      "https://www.linkedin.com/in/amaljith-thadathil/"
    ]
  };

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${manrope.variable} ${jetbrains.variable}`}
    >
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <CustomCursor />
        <SmoothScrollProvider>
          <PublicShell>{children}</PublicShell>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
