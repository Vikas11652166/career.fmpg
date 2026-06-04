import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifyOfferLetterAction } from "@/app/actions/contracts";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VerifyOfferCardClient from "./VerifyOfferCardClient";
import { ChevronLeft } from "lucide-react";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = await params;
  const res = await verifyOfferLetterAction(id);
  if (!res.success || !res.data) {
    return {
      title: "Invalid Offer Letter | FMPG Verification",
    };
  }

  return {
    title: `Verified Offer Letter - ${res.data.candidateName} | FMPG`,
    description: `Official digital credential issued by FMPG to verify employment offer details for ${res.data.candidateName}.`,
  };
}

export default async function VerifyOfferPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const res = await verifyOfferLetterAction(id);

  if (!res.success || !res.data) {
    notFound();
  }

  const offer = res.data;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 bg-grid-pattern relative">
        <div className="absolute top-20 left-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl mx-auto px-6 relative z-10">
          <Link
            href="/verify-offer"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors mb-8 group"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Verification
          </Link>

          <Suspense fallback={
            <div className="glass-panel border border-border/40 p-8 rounded-3xl text-center bg-card">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-xs text-muted-foreground font-semibold">Authenticating digital contract...</p>
            </div>
          }>
            <VerifyOfferCardClient initialOffer={offer} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
