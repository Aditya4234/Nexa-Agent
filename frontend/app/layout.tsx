import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://nexaagent.app"),
  title: {
    default: "NexaAgent — Agentic AI Workspace",
    template: "%s · NexaAgent",
  },
  description:
    "Create autonomous agents, give them goals, provide knowledge and tools, monitor their execution, and automate complex multi-step tasks.",
  keywords: ["ai agents", "autonomous agents", "agentic ai", "workflow automation", "llm", "ai workspace"],
  authors: [{ name: "NexaAgent" }],
  openGraph: {
    type: "website",
    siteName: "NexaAgent",
    title: "NexaAgent — Agentic AI Workspace",
    description:
      "Create autonomous agents, give them goals, connect knowledge and tools, and automate complex multi-step tasks.",
    url: "https://nexaagent.app",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "NexaAgent" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NexaAgent — Agentic AI Workspace",
    description:
      "Create autonomous agents, give them goals, connect knowledge and tools, and automate complex multi-step tasks.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-[100dvh] overflow-hidden antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}