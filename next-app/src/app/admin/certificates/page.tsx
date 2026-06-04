import React, { Suspense } from "react";
import CertificatesPanel from "@/components/admin/CertificatesPanel";

export const metadata = {
  title: "Certification & Credentials | FMPG Admin",
  description: "Security panel for issuing completion achievements and drafting formal portrait employment offer contracts.",
};

export default function CertificatesPage() {
  return (
    <main className="min-h-screen pb-16 bg-transparent">
      <Suspense fallback={
        <div className="flex h-[400px] items-center justify-center text-slate-700 font-bold">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
            Loading credential panels...
          </div>
        </div>
      }>
        <CertificatesPanel />
      </Suspense>
    </main>
  );
}
