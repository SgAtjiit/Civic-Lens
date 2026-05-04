import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ReportProvider } from "@/context/ReportContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CivicLens - Civic Reporting",
  description: "Report road damage and civic issues with AI-powered analysis. Help improve your community infrastructure.",
  keywords: ["civic reporting", "road damage", "pothole", "infrastructure", "AI analysis"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`} suppressHydrationWarning>
        <ReportProvider>
          <Navbar />
          <main className="pt-16 min-h-screen flex flex-col safe-bottom">
            {children}
          </main>
        </ReportProvider>
      </body>
    </html>
  );
}
