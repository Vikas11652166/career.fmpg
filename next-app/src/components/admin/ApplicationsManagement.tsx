"use client";

import { useState, useCallback, Fragment } from "react";
import {
  Search, Filter, RefreshCw, FileText, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, Star, Briefcase, User, Download,
  Eye, Edit2, AlertCircle, Award, Building2
} from "lucide-react";
import { toast } from "sonner";
import { getAllApplicationsAction, updateApplicationStatusAction } from "@/app/actions/admin";

interface ApplicationData {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  isReferred: boolean;
  referrerName?: string;
  resumeUrl?: string;
  skills?: string[];
  jobId?: {
    _id: string;
    title: string;
    company: string;
    location: string;
    department: string;
    type: string;
  };
  createdAt: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  total: number;
}

interface InitialData {
  applications: ApplicationData[];
  pagination: PaginationData;
  statusSummary: Record<string, number>;
}

interface Props {
  initialData: InitialData | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: "Pending",    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",    icon: <Clock className="w-3 h-3" /> },
  reviewing:  { label: "Reviewing",  color: "bg-blue-500/20 text-blue-300 border-blue-500/30",          icon: <Eye className="w-3 h-3" /> },
  shortlisted:{ label: "Shortlisted",color: "bg-emerald-100/50 text-emerald-500 border-emerald-600/30",    icon: <Star className="w-3 h-3" /> },
  offered:    { label: "Offered",    color: "bg-emerald-100/50 text-violet-300 border-emerald-600/30",    icon: <Award className="w-3 h-3" /> },
  hired:      { label: "Hired",      color: "bg-green-500/20 text-green-300 border-green-500/30",       icon: <CheckCircle className="w-3 h-3" /> },
  rejected:   { label: "Rejected",   color: "bg-red-500/20 text-red-300 border-red-500/30",             icon: <XCircle className="w-3 h-3" /> }
};

const NEXT_STATUSES: Record<string, string[]> = {
  pending:     ["reviewing", "shortlisted", "rejected"],
  reviewing:   ["shortlisted", "rejected"],
  shortlisted: ["offered", "rejected"],
  offered:     ["hired", "rejected"],
  hired:       [],
  rejected:    ["reviewing"]
};

export default function ApplicationsManagement({ initialData }: Props) {
  const [applications, setApplications] = useState<ApplicationData[]>(initialData?.applications || []);
  const [pagination, setPagination] = useState<PaginationData>(
    initialData?.pagination || { currentPage: 1, totalPages: 1, total: 0 }
  );
  const [statusSummary, setStatusSummary] = useState<Record<string, number>>(
    initialData?.statusSummary || {}
  );
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  const loadApplications = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getAllApplicationsAction({
        page,
        limit: 20,
        search: search || undefined,
        status: filterStatus || undefined
      });
      if (res.success && (res as any).data) {
        const d = (res as any).data;
        setApplications(d.applications);
        setPagination(d.pagination);
        setStatusSummary(d.statusSummary);
      } else {
        toast.error("Failed to load applications");
      }
    } catch {
      toast.error("Network error loading applications");
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  const handleStatusUpdate = async (appId: string, newStatus: string) => {
    setUpdatingId(appId);
    try {
      const res = await updateApplicationStatusAction(appId, newStatus);
      if (res.success) {
        toast.success(res.message);
        setApplications(prev =>
          prev.map(a => a._id === appId ? { ...a, status: newStatus } : a)
        );
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch {
      toast.error("Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadApplications(1);
  };

  const totalApps = pagination.total;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Applications Management</h1>
          <p className="text-slate-900/50 mt-1 text-sm">
            Review and manage all {totalApps.toLocaleString()} candidate applications
          </p>
        </div>
        <button
          onClick={() => loadApplications(pagination.currentPage)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-900 text-sm border border-slate-200/60 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Status Summary Pills */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <button
            key={status}
            onClick={() => {
              setFilterStatus(filterStatus === status ? "" : status);
              setTimeout(() => loadApplications(1), 0);
            }}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
              filterStatus === status
                ? "bg-white/15 border-emerald-600/50 scale-105"
                : "bg-slate-100/50 border-slate-200/60 hover:bg-white/10"
            }`}
          >
            <span className="text-2xl font-bold text-white">
              {statusSummary[status] || 0}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.color}`}>
              {cfg.icon}
              {cfg.label}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full bg-white/10 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 placeholder:text-slate-900/40 text-sm focus:outline-none focus:border-emerald-600/60 focus:ring-1 focus:ring-violet-500/30 backdrop-blur-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setTimeout(() => loadApplications(1), 0); }}
          className="bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-emerald-600/60 backdrop-blur-sm min-w-[140px]"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([v, c]) => (
            <option key={v} value={v}>{c.label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-indigo-500 text-slate-900 text-sm font-medium rounded-xl transition-all"
        >
          Search
        </button>
      </form>

      {/* Applications Table */}
      <div className="bg-slate-100/50 backdrop-blur-xl rounded-2xl border border-slate-200/60 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600" />
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <FileText className="w-12 h-12 text-slate-900/20" />
            <p className="text-slate-900/50 text-lg">No applications found</p>
            <p className="text-slate-900/30 text-sm">Try adjusting filters or search terms</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/60">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-900/40 uppercase tracking-wider">Candidate</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-900/40 uppercase tracking-wider">Job</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-900/40 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-900/40 uppercase tracking-wider">Referral</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-900/40 uppercase tracking-wider">Applied</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-900/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app, idx) => (
                  <Fragment key={app._id}>
                    <tr
                      className={`border-b border-white/5 transition-colors cursor-pointer ${
                        expandedApp === app._id ? "bg-slate-200/40" : "hover:bg-slate-100/50"
                      } ${idx % 2 === 0 ? "" : "bg-slate-50/30"}`}
                      onClick={() => setExpandedApp(expandedApp === app._id ? null : app._id)}
                    >
                      {/* Candidate */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center text-slate-900 text-sm font-semibold flex-shrink-0">
                            {app.fullName?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-slate-900 text-sm font-medium">{app.fullName}</p>
                            <p className="text-slate-900/40 text-xs">{app.email}</p>
                          </div>
                        </div>
                      </td>
                      {/* Job */}
                      <td className="px-5 py-3.5">
                        {app.jobId ? (
                          <div>
                            <p className="text-slate-900 text-sm font-medium">{app.jobId.title}</p>
                            <p className="text-slate-900/40 text-xs flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {app.jobId.department} · {app.jobId.type}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-900/30 text-xs">No job linked</span>
                        )}
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[app.status]?.color || "bg-white/10 text-slate-900/60 border-slate-200/60"}`}>
                          {STATUS_CONFIG[app.status]?.icon}
                          {STATUS_CONFIG[app.status]?.label || app.status}
                        </span>
                      </td>
                      {/* Referral */}
                      <td className="px-5 py-3.5">
                        {app.isReferred ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium">
                            <Star className="w-3 h-3 fill-amber-300" />
                            Referred
                          </span>
                        ) : (
                          <span className="text-slate-900/30 text-xs">—</span>
                        )}
                      </td>
                      {/* Applied */}
                      <td className="px-5 py-3.5">
                        <span className="text-slate-900/50 text-xs">
                          {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          {app.resumeUrl && (
                            <a
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-900/60 hover:text-slate-900 transition-all"
                              title="View Resume"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <a
                            href={`/admin/applications/${app._id}`}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-900/60 hover:text-slate-900 transition-all"
                            title="Full Review"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded row */}
                    {expandedApp === app._id && (
                      <tr key={`${app._id}-expanded`} className="bg-slate-50">
                        <td colSpan={6} className="px-5 pb-4 pt-2">
                          <div className="flex flex-wrap gap-3 items-center">
                            <span className="text-slate-900/50 text-sm font-medium">Update Status:</span>
                            {(NEXT_STATUSES[app.status] || []).map(nextStatus => (
                              <button
                                key={nextStatus}
                                onClick={() => handleStatusUpdate(app._id, nextStatus)}
                                disabled={updatingId === app._id}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:scale-105 disabled:opacity-50 ${STATUS_CONFIG[nextStatus]?.color}`}
                              >
                                {updatingId === app._id ? (
                                  <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Updating...</span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    {STATUS_CONFIG[nextStatus]?.icon}
                                    Mark {STATUS_CONFIG[nextStatus]?.label}
                                  </span>
                                )}
                              </button>
                            ))}
                            {app.skills && app.skills.length > 0 && (
                              <div className="flex items-center gap-2 ml-auto">
                                <span className="text-slate-900/40 text-xs">Skills:</span>
                                <div className="flex flex-wrap gap-1">
                                  {app.skills.slice(0, 5).map((skill, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded bg-white/10 text-slate-900/70 text-xs">{skill}</span>
                                  ))}
                                  {app.skills.length > 5 && (
                                    <span className="px-2 py-0.5 rounded bg-white/10 text-slate-900/40 text-xs">+{app.skills.length - 5} more</span>
                                  )}
                                </div>
                              </div>
                            )}
                            {app.isReferred && app.referrerName && (
                              <div className="flex items-center gap-1 text-amber-300 text-xs">
                                <Star className="w-3 h-3 fill-amber-300" />
                                Referred by: <span className="font-medium">{app.referrerName}</span>
                              </div>
                            )}
                            <a
                              href={`/admin/applications/${app._id}`}
                              className="ml-auto px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-indigo-500 text-slate-900 text-xs font-medium rounded-lg transition-all"
                            >
                              Full Review →
                            </a>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-slate-900/40 text-sm">
            Showing {((pagination.currentPage - 1) * 20) + 1}–{Math.min(pagination.currentPage * 20, pagination.total)} of {pagination.total} applications
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadApplications(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || loading}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-900 text-sm px-3">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button
              onClick={() => loadApplications(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
