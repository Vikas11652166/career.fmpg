import { Suspense } from "react";
import UserDirectoryPanel from "@/components/admin/UserDirectoryPanel";
import { getCandidatesAction } from "@/app/actions/admin";
import { getMeAction } from "@/app/actions/auth";

export const metadata = { title: "User Directory | FMPG Admin" };

export default async function AdminUsersPage() {
  const [candRes, meRes] = await Promise.all([
    getCandidatesAction({ page: 1, limit: 10 }),
    getMeAction()
  ]);

  const initialData = candRes.success && candRes.data ? JSON.parse(JSON.stringify(candRes.data)) : null;
  const userRole = meRes.success && meRes.data ? meRes.data.role : "admin";

  return (
    <main className="min-h-screen p-6 bg-transparent">
      <Suspense fallback={<div className="text-slate-500 text-sm animate-pulse">Loading applicant user database...</div>}>
        <UserDirectoryPanel 
          initialData={initialData} 
          currentUserRole={userRole}
        />
      </Suspense>
    </main>
  );
}
