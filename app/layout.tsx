import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { JoyrideProvider } from "@/contexts/JoyrideContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BEEXPERT",
  description:
    // "Platform bimbingan belajar berbasis AI yang dirancang untuk siswa SMA yang memungkinkan siswa untuk memasukkan pertanyaan melalui suara dan gambar secara langsung.",
    "An AI-based tutoring platform designed for high school students that allows them to ask questions directly through voice and images.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <JoyrideProvider>
            {children}
            <Toaster richColors position="top-center" />
            <Analytics />
            <SpeedInsights />
          </JoyrideProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
