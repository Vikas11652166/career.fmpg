import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FMPG Careers - Join Our High-Performance PG Living Team",
  description: "Explore career opportunities, internship vacancies, and professional growth paths at FMPG, Hoshiarpur's premier paying guest and luxury living accommodation network.",
  keywords: ["FMPG", "Careers", "Jobs", "FindMyPG", "Flock Hostels", "UIET Hoshiarpur", "Property Management Jobs"],
  authors: [{ name: "FMPG Team", url: "https://fmpg.in" }],
  openGraph: {
    title: "FMPG Careers Portal",
    description: "Build the future of hassle-free premium student and professional living at FMPG.",
    url: "https://fmpg.in",
    siteName: "FMPG Careers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FMPG Careers - Join Our Team",
    description: "Launch your career with FMPG, the modern standard in paying guest accommodations.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground">
        <main className="flex-grow flex flex-col">
          {children}
        </main>
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              borderRadius: '1rem',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }} 
        />
      </body>
    </html>
  );
}
