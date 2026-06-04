import { Suspense } from "react";
import ReviewModerationPanel from "@/components/admin/ReviewModerationPanel";
import { getAllReviewsAction } from "@/app/actions/admin";

export const metadata = { title: "Review Moderation | FMPG Admin" };

export default async function AdminReviewsPage() {
  // Pre-fetch pending reviews initially
  const res = await getAllReviewsAction({ page: 1, limit: 10, status: "" });

  return (
    <main className="min-h-screen p-6 bg-transparent">
      <Suspense fallback={<div className="text-slate-500 text-sm animate-pulse">Loading testimonials feedback dashboard...</div>}>
        <ReviewModerationPanel initialData={res.success && res.data ? JSON.parse(JSON.stringify(res.data)) : null} />
      </Suspense>
    </main>
  );
}
