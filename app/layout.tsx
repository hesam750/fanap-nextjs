import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./provider";
import { Metadata } from "next";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "سیستم مدیریت مخازن",
  description: "سیستم مدیریت و نظارت بر مخازن سوخت و آب",
    generator: 'fanap.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable}  antialiased` }
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <Providers>
        {children}
        </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
