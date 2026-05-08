import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  title: "FMPG Careers | The Future of Property Management",
  description: "Join the FMPG team and build the future of modern living.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-[#fcfcfc] text-[#0a0a0a] font-sans antialiased">
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <ToastContainer 
            position="bottom-right"
            theme="light"
            toastClassName="!rounded-3xl !p-6 !shadow-2xl border border-gray-100"
          />
        </AuthProvider>
      </body>
    </html>
  );
}
