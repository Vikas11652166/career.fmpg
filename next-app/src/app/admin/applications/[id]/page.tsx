import React, { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getMeAction } from "@/app/actions/auth";
import { getApplicationDetailAction } from "@/app/actions/admin";
import ApplicationReview from "@/components/admin/ApplicationReview";

export const metadata = {
  title: "Candidate Profile Review | FMPG Admin",
  description: "Secure panel for evaluating candidate applications, managing interview remarks, and drafting onboarding agreements.",
};

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function AdminApplicationDetailPage({ params }: PageProps) {
  // 1. Route security guard: ensure user is logged in as admin, super-admin, or employee
  const authRes = await getMeAction();
  if (!authRes.success || !["admin", "super-admin", "employee"].includes(authRes.data?.role)) {
    redirect("/login?redirect=/admin/dashboard");
  }

  // 2. Resolve dynamic route ID parameter
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // 3. Fetch candidate application details
  const res = await getApplicationDetailAction(id);
  if (!res.success || !res.data) {
    notFound();
  }

  const application = res.data;

  return (
    <main className="min-h-screen bg-transparent">
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center text-slate-700 font-bold bg-[#fafbfc]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
              Assembling candidate profile review...
            </div>
          </div>
        }
      >
        <ApplicationReview application={application} />
      </Suspense>
    </main>
  );
}
