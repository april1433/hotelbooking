import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Grand Azure Hotel | Luxury Hotel & Suites",
    template: "%s | Grand Azure Hotel",
  },
  description:
    "Experience unparalleled luxury at Grand Azure Hotel. Premium rooms, world-class dining, spa & wellness, and seamless online reservations.",
  keywords: ["hotel", "luxury", "reservation", "suites", "spa", "booking"],
  authors: [{ name: "Grand Azure Hotel" }],
  openGraph: {
    type: "website",
    locale: "en_PH",
    title: "Grand Azure Hotel | Luxury Hotel & Suites",
    description: "Experience unparalleled luxury at Grand Azure Hotel.",
    siteName: "Grand Azure Hotel",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                fontFamily: "var(--font-inter)",
                borderRadius: "12px",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
