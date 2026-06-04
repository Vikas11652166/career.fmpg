import { Suspense } from 'react';
import EmployeeManagement from '@/components/admin/EmployeeManagement';
import { getEmployeesAction } from '@/app/actions/admin';

export const metadata = { title: 'Employee Management | FMPG Admin' };

export default async function EmployeePage() {
  const res = await getEmployeesAction({ page: 1, limit: 10 });
  return (
    <main className="min-h-screen p-6 bg-transparent">
      <Suspense fallback={<div className="text-slate-500 text-sm animate-pulse">Loading...</div>}>
        <EmployeeManagement initialData={res.success && res.data ? JSON.parse(JSON.stringify(res.data)) : null} />
      </Suspense>
    </main>
  );
}
