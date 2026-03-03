import type { Metadata } from "next";
import { DM_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Moltbot - Your Own AI Assistant, Running 24/7",
  description: "Get a private Claude instance deployed on your own cloud server. Connected to all your channels. Managed entirely for you.",
  keywords: ["AI assistant", "Claude", "managed AI", "business automation", "personal AI"],
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/favicon-192.png",
  },
  openGraph: {
    title: "Moltbot - Your Own AI Assistant",
    description: "A private Claude instance on your own cloud server, running 24/7.",
    type: "website",
    url: "https://moltbot.ceo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-[family-name:var(--font-body)]">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
