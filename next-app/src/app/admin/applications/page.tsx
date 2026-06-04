import { Suspense } from "react";
import ApplicationsManagement from "@/components/admin/ApplicationsManagement";
import { getAllApplicationsAction } from "@/app/actions/admin";

export const metadata = {
  title: "All Applications | FMPG Admin",
  description: "Manage and review all candidate applications in the FMPG HR Portal"
};

export default async function AdminApplicationsPage() {
  const res = await getAllApplicationsAction({ page: 1, limit: 20 });

  return (
    <main className="min-h-screen p-6 bg-transparent">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600" />
          </div>
        }
      >
        <ApplicationsManagement initialData={res.success ? (res as any).data : null} />
      </Suspense>
    </main>
  );
}
