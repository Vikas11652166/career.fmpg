import { Suspense } from "react";
import ManageHRPanel from "@/components/admin/ManageHRPanel";
import { 
  getAllHRsAction, 
  getAvailableJobsForHRAction, 
  getHRAuditLogsAction 
} from "@/app/actions/hr";

export const metadata = { title: "HR Department Configurations | FMPG Admin" };

export default async function AdminManageHRPage() {
  const [hrsRes, jobsRes, logsRes] = await Promise.all([
    getAllHRsAction(),
    getAvailableJobsForHRAction(),
    getHRAuditLogsAction()
  ]);

  const hrs = JSON.parse(JSON.stringify(hrsRes.success && hrsRes.data ? hrsRes.data : []));
  const jobs = JSON.parse(JSON.stringify(jobsRes.success && jobsRes.data ? jobsRes.data : []));
  const logs = JSON.parse(JSON.stringify(logsRes.success && logsRes.data ? logsRes.data : []));

  return (
    <main className="min-h-screen p-6 bg-transparent">
      <Suspense fallback={<div className="text-slate-500 text-sm animate-pulse">Loading superadmin HR configurations...</div>}>
        <ManageHRPanel 
          initialHRs={hrs} 
          initialJobs={jobs} 
          initialLogs={logs}
        />
      </Suspense>
    </main>
  );
}
