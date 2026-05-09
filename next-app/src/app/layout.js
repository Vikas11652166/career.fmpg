import "./globals.css";
import { Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import ToastProvider from "@/components/layout/ToastProvider";

export const metadata = {
  title: "FMPG Careers | The Future of Property Management",
  description: "Join the FMPG team and build the future of modern living.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#fcfcfc] text-[#0a0a0a] font-sans antialiased">
        {/* <AuthProvider> */}
          {/* <Suspense fallback={null}> */}
            {/* <Navbar /> */}
          {/* </Suspense> */}
          <main className="min-h-screen">
            {children}
          </main>
          {/* <ToastProvider /> */}
        {/* </AuthProvider> */}
      </body>
    </html>
  );
}
