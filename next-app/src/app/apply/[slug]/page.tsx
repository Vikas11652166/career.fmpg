import React from "react";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ApplyForm from "@/components/jobs/ApplyForm";
import { getJobBySlugAction } from "@/app/actions/jobs";

export const dynamic = "force-dynamic";

export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getJobBySlugAction(slug);

  if (!res.success || !res.data) {
    notFound();
  }

  const job = res.data;

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Navbar />
      
      {/* Application Container */}
      <section className="flex-grow max-w-7xl mx-auto px-6 md:px-12 py-16">
        <ApplyForm job={job} />
      </section>

      <Footer />
    </div>
  );
}
