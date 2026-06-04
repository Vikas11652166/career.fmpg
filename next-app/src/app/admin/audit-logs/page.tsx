import { Suspense } from 'react';
import AuditLogsTable from '@/components/admin/AuditLogsTable';
import { getAuditLogsAction } from '@/app/actions/admin';

export const metadata = { title: 'Audit Logs | FMPG Admin' };

export default async function AuditLogsPage() {
  const res = await getAuditLogsAction();

  return (
    <main className="min-h-screen p-6 bg-transparent">
      <Suspense fallback={<div className="text-slate-500 text-sm animate-pulse">Loading audit logs…</div>}>
        <AuditLogsTable initialLogs={res.success && res.data ? JSON.parse(JSON.stringify(res.data)) : []} />
      </Suspense>
    </main>
  );
}
