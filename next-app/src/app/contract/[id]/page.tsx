import React from "react";
import { notFound, redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import OfferLetter from "@/models/offerLetter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ContractSignForm from "@/components/dashboard/ContractSignForm";
import { getMeAction } from "@/app/actions/auth";
import { getOfferForAcceptanceAction } from "@/app/actions/contracts";

export default async function ContractSigningPage({ params }: { params: { id: string } }) {
  // 1. Authenticate candidate
  const meRes = await getMeAction();
  if (!meRes.success || !meRes.data) {
    redirect("/login");
  }

  // 2. Await params and fetch the offer
  const { id } = await params;
  const offerRes = await getOfferForAcceptanceAction(id);

  if (!offerRes.success || !offerRes.data) {
    // If not found or not pending
    return (
      <div className="flex flex-col min-h-screen bg-muted/20">
        <Navbar />
        <section className="flex-grow max-w-xl mx-auto flex flex-col justify-center items-center gap-4 text-center px-6">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl font-bold">
            ⚠
          </div>
          <h2 className="font-heading text-lg font-bold text-foreground">Offer Letter Unserviceable</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {offerRes.message || "This offer has either already been signed/processed, has expired, or is invalid in our system. Please check your candidate dashboard."}
          </p>
          <a
            href="/dashboard"
            className="mt-2.5 h-11 px-6 rounded-2xl bg-primary text-white hover:bg-primary-hover text-xs font-bold uppercase tracking-wider shadow-md flex items-center justify-center transition-colors"
          >
            My Dashboard
          </a>
        </section>
        <Footer />
      </div>
    );
  }

  const offer = offerRes.data;

  // 3. Prevent candidates from signing other candidates' offer letters
  if (offer.email !== meRes.data.email) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/20">
        <Navbar />
        <section className="flex-grow max-w-xl mx-auto flex flex-col justify-center items-center gap-4 text-center px-6">
          <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center text-xl font-bold">
            ✕
          </div>
          <h2 className="font-heading text-lg font-bold text-foreground">Access Denied</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You are logged in as <strong>{meRes.data.email}</strong>, but this employment contract was issued specifically for <strong>{offer.email}</strong>.
          </p>
          <a
            href="/dashboard"
            className="mt-2.5 h-11 px-6 rounded-2xl bg-primary text-white hover:bg-primary-hover text-xs font-bold uppercase tracking-wider shadow-md flex items-center justify-center transition-colors"
          >
            My Dashboard
          </a>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Navbar />
      
      {/* Signing Wizard Container */}
      <section className="flex-grow max-w-7xl mx-auto px-6 md:px-12 py-16">
        <ContractSignForm offer={offer} />
      </section>

      <Footer />
    </div>
  );
}
