import type { Metadata, Viewport } from "next";
import { Cinzel, Crimson_Text } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-ui",
});

const crimsonText = Crimson_Text({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wyrdscribe.app"),
  title: {
    default: "Wyrdscribe",
    template: "%s · Wyrdscribe",
  },
  description:
    "A local-first gaming companion that remembers your playthrough — searches the wikis, cites its sources, keeps spoilers in check.",
  applicationName: "Wyrdscribe",
  authors: [{ name: "Andrew Flett" }],
  keywords: [
    "gaming companion",
    "RPG",
    "playthrough notes",
    "wiki search",
    "local-first",
  ],
  openGraph: {
    type: "website",
    siteName: "Wyrdscribe",
    title: "Wyrdscribe",
    description:
      "A local-first gaming companion that remembers your playthrough.",
    url: "https://wyrdscribe.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wyrdscribe",
    description:
      "A local-first gaming companion that remembers your playthrough.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0e0c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${crimsonText.variable} h-full overflow-hidden`}
    >
      <body className="h-[100dvh] overflow-hidden">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
