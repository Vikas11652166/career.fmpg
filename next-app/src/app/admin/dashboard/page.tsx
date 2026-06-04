import React from "react";
import connectDB from "@/lib/mongodb";
import {
  getAdminDashboardMetrics,
  getEmployeesAction,
  getJobsAction,
  getAllRecommendationsAction,
  getAuditLogsAction
} from "@/app/actions/admin";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { redirect } from "next/navigation";
import { getMeAction } from "@/app/actions/auth";

export const metadata = {
  title: "HR Administration Console - FMPG Careers",
  description: "Secure administrative management console for jobs, onboarding, employees, and applications.",
};

export default async function AdminDashboardPage() {
  await connectDB();

  // Route security check: ensure user is an employee, admin, or super-admin
  const authRes = await getMeAction();
  if (!authRes.success || !["admin", "super-admin", "employee"].includes(authRes.data?.role)) {
    redirect("/login?redirect=/admin/dashboard");
  }

  // Execute direct DB fetches in parallel
  const [
    metricsRes,
    jobsRes,
    employeesRes,
    recsRes,
    logsRes
  ] = await Promise.all([
    getAdminDashboardMetrics(),
    getJobsAction(),
    getEmployeesAction({ page: 1, limit: 100 }),
    getAllRecommendationsAction(),
    getAuditLogsAction()
  ]);

  const initialMetrics = JSON.parse(JSON.stringify(metricsRes.success ? metricsRes.data : {
    metrics: { totalCandidates: 0, activeOpenings: 0, pendingContracts: 0, totalEmployees: 0 },
    statusCounts: { pending: 0, reviewing: 0, shortlisted: 0, rejected: 0, offered: 0, hired: 0 },
    recentLogs: []
  }));

  const initialJobs = JSON.parse(JSON.stringify(jobsRes.success ? jobsRes.data : []));
  
  const initialEmployees = JSON.parse(JSON.stringify(employeesRes.success ? employeesRes.data : {
    users: [],
    stats: { totalEmployees: 0, totalAdmins: 0, totalSuperAdmins: 0, activeStaff: 0, suspendedAccounts: 0, formerEmployees: 0 }
  }));

  const initialRecommendations = JSON.parse(JSON.stringify(recsRes.success ? recsRes.data : []));
  const initialAuditLogs = JSON.parse(JSON.stringify(logsRes.success ? logsRes.data : []));

  return (
    <div className="bg-background min-h-screen">
      <AdminDashboard
        initialMetrics={initialMetrics}
        initialJobs={initialJobs}
        initialEmployees={initialEmployees}
        initialRecommendations={initialRecommendations}
        initialAuditLogs={initialAuditLogs}
      />
    </div>
  );
}
