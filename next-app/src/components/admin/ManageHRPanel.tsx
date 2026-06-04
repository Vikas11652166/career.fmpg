"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  UserPlus, 
  Settings, 
  Eye, 
  BookOpen, 
  Clock, 
  User, 
  Check, 
  Briefcase,
  AlertTriangle,
  RefreshCw,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { 
  getAllHRsAction, 
  promoteToHRAction, 
  revokeHRAction, 
  updateHRPermissionsAction, 
  getHRAuditLogsAction, 
  getAvailableJobsForHRAction 
} from "@/app/actions/hr";

interface HRUser {
  _id: string;
  name: string;
  email: string;
  employeeId?: string;
  department: string;
  role: string;
  status: string;
  permissions: {
    canGenerateCertificate: boolean;
    canGenerateOfferLetter: boolean;
    canCreateJob: boolean;
    canViewApplicants: boolean;
    canManageReviews: boolean;
    canManageEmployees: boolean;
    canManageRecommendations: boolean;
    canAccessDashboard: boolean;
  };
  assignedJobs: string[];
}

interface HRAuditLog {
  _id: string;
  actor: {
    _id: string;
    name: string;
    email: string;
  } | null;
  actorRole: string;
  action: "UPDATE_PERMISSIONS" | "ASSIGN" | "REVOKE";
  resourceId: {
    _id: string;
    name: string;
    email: string;
  } | null;
  changes: any;
  createdAt: string;
}

interface AvailableJob {
  _id: string;
  title: string;
  company: string;
  location: string;
}

interface ManageHRPanelProps {
  initialHRs: HRUser[];
  initialJobs: AvailableJob[];
  initialLogs: HRAuditLog[];
}

export default function ManageHRPanel({ initialHRs, initialJobs, initialLogs }: ManageHRPanelProps) {
  const [hrs, setHrs] = useState<HRUser[]>(initialHRs);
  const [jobs, setJobs] = useState<AvailableJob[]>(initialJobs);
  const [logs, setLogs] = useState<HRAuditLog[]>(initialLogs);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"directory" | "logs">("directory");

  // Promote HR State
  const [newHREmail, setNewHREmail] = useState("");
  const [promoting, setPromoting] = useState(false);

  // Edit Permissions State
  const [selectedHR, setSelectedHR] = useState<HRUser | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [permissions, setPermissions] = useState<HRUser["permissions"]>({
    canGenerateCertificate: false,
    canGenerateOfferLetter: false,
    canCreateJob: false,
    canViewApplicants: false,
    canManageReviews: false,
    canManageEmployees: false,
    canManageRecommendations: false,
    canAccessDashboard: false
  });
  const [assignedJobs, setAssignedJobs] = useState<string[]>([]);
  const [updatingPerms, setUpdatingPerms] = useState(false);

  const refreshAll = async () => {
    setLoading(true);
    try {
      const [hrsRes, jobsRes, logsRes] = await Promise.all([
        getAllHRsAction(),
        getAvailableJobsForHRAction(),
        getHRAuditLogsAction()
      ]);

      if (hrsRes.success) setHrs(hrsRes.data ?? []);
      if (jobsRes.success) setJobs(jobsRes.data ?? []);
      if (logsRes.success) setLogs(logsRes.data ?? []);
    } catch (err) {
      toast.error("Failed to refresh HR management workspace");
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHREmail.trim()) {
      toast.error("Please enter a valid user email");
      return;
    }

    setPromoting(true);
    try {
      const res = await promoteToHRAction({
        email: newHREmail.trim(),
        permissions: {
          canAccessDashboard: true,
          canViewApplicants: true
        }
      });

      if (res.success) {
        toast.success(res.message);
        setNewHREmail("");
        refreshAll();
      } else {
        toast.error(res.message || "Failed to promote user");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during promotion");
    } finally {
      setPromoting(false);
    }
  };

  const handleOpenConfig = (hr: HRUser) => {
    setSelectedHR(hr);
    setPermissions({
      canGenerateCertificate: hr.permissions?.canGenerateCertificate || false,
      canGenerateOfferLetter: hr.permissions?.canGenerateOfferLetter || false,
      canCreateJob: hr.permissions?.canCreateJob || false,
      canViewApplicants: hr.permissions?.canViewApplicants || false,
      canManageReviews: hr.permissions?.canManageReviews || false,
      canManageEmployees: hr.permissions?.canManageEmployees || false,
      canManageRecommendations: hr.permissions?.canManageRecommendations || false,
      canAccessDashboard: hr.permissions?.canAccessDashboard || false
    });
    setAssignedJobs(hr.assignedJobs || []);
    setShowConfigModal(true);
  };

  const handleTogglePermission = (key: keyof HRUser["permissions"]) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleJob = (jobId: string) => {
    setAssignedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId) 
        : [...prev, jobId]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedHR) return;
    setUpdatingPerms(true);
    try {
      const res = await updateHRPermissionsAction(selectedHR._id, permissions, assignedJobs);
      if (res.success) {
        toast.success("HR settings and boundaries saved successfully.");
        setShowConfigModal(false);
        refreshAll();
      } else {
        toast.error(res.message || "Failed to update permissions");
      }
    } catch (err: any) {
      toast.error(err.message || "Error updating configurations");
    } finally {
      setUpdatingPerms(false);
    }
  };

  const handleRevoke = async (hrId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to revoke all HR privileges from ${name}? This resets their department and clears access bounds.`)) {
      return;
    }

    try {
      const res = await revokeHRAction(hrId);
      if (res.success) {
        toast.success(res.message);
        refreshAll();
      } else {
        toast.error(res.message || "Failed to revoke access");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke privileges");
    }
  };

  const formatDiff = (log: HRAuditLog) => {
    const changes = log.changes;
    if (!changes) return "No details recorded";

    if (log.action === "ASSIGN") {
      return `Promoted to HR Department. Employee ID assigned automatically.`;
    }

    if (log.action === "REVOKE") {
      return `Revoked HR privileges. Access keys cleared. Demoted to General Admin.`;
    }

    if (log.action === "UPDATE_PERMISSIONS") {
      const keys = [];
      if (changes.from?.permissions && changes.to?.permissions) {
        const fromP = changes.from.permissions;
        const toP = changes.to.permissions;
        for (const k in toP) {
          if (fromP[k] !== toP[k]) {
            keys.push(`${k}: ${fromP[k]} ➔ ${toP[k]}`);
          }
        }
      }
      if (changes.from?.assignedJobs && changes.to?.assignedJobs) {
        const fJobs = changes.from.assignedJobs.length;
        const tJobs = changes.to.assignedJobs.length;
        if (fJobs !== tJobs) {
          keys.push(`Bound Job Count: ${fJobs} ➔ ${tJobs}`);
        }
      }
      return keys.length > 0 ? keys.join(", ") : "Saved without explicit changes.";
    }

    return JSON.stringify(changes);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
            HR Staff <span className="text-primary">Configuration</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Super-Admin control center for HR permissions, recruitment bounds, and staff visibility.
          </p>
        </div>
        <button
          onClick={refreshAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-300 border border-white/5 disabled:opacity-50 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Workspace
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/5 gap-6 text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">
        <button
          onClick={() => setActiveTab("directory")}
          className={`pb-3 relative transition-colors ${
            activeTab === "directory" ? "text-primary font-black" : "hover:text-slate-350 cursor-pointer"
          }`}
        >
          HR Staff Directory
          {activeTab === "directory" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 relative transition-colors ${
            activeTab === "logs" ? "text-primary font-black" : "hover:text-slate-350 cursor-pointer"
          }`}
        >
          System Audit Trail
          {activeTab === "logs" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {activeTab === "directory" ? (
        <div className="space-y-6">
          {/* Promote New HR Form */}
          <div className="bg-slate-100/50 border border-slate-200/60 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" /> Promote User to HR Department
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter the email address of a registered user to add them to the HR staff directory with core privileges.
            </p>

            <form onSubmit={handlePromote} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="registered-user@company.com"
                value={newHREmail}
                onChange={(e) => setNewHREmail(e.target.value)}
                required
                className="flex-1 bg-card border border-slate-200/60 rounded-xl px-4 py-3 text-slate-100 text-xs focus:border-primary outline-none placeholder:text-slate-700"
              />
              <button
                type="submit"
                disabled={promoting}
                className="px-6 py-3 bg-primary hover:bg-primary/95 text-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {promoting ? "Promoting..." : "Add to HR department"}
              </button>
            </form>
          </div>

          {/* HR Staff Directory */}
          {hrs.length === 0 ? (
            <div className="py-16 bg-slate-100/50 border border-slate-200/60 rounded-2xl p-8 text-center backdrop-blur-xl">
              <Users className="h-10 w-10 text-slate-600 mx-auto mb-4" />
              <h3 className="font-heading text-lg font-bold text-slate-900 mb-1">No HR Staff Registered</h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                Add users to the HR staff directory using the promotional workspace above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {hrs.map((hr) => (
                <div 
                  key={hr._id} 
                  className="bg-slate-100/50 border border-slate-200/60 hover:border-white/15 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 border border-primary/20 text-primary font-bold text-sm rounded-xl flex items-center justify-center">
                          {hr.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{hr.name}</h4>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mt-0.5">
                            ID: {hr.employeeId || "Pending Setup"}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
                        HR Department
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-4">{hr.email}</p>

                    {/* Permissions Grid indicator */}
                    <div className="bg-card/40 border border-white/5 rounded-2xl p-4 mb-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-3 border-b border-white/5 pb-1.5">
                        Assigned Permissions
                      </span>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                        <div className="flex items-center gap-2">
                          {hr.permissions?.canAccessDashboard ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <ShieldAlert className="h-3.5 w-3.5 text-slate-650" />
                          )}
                          <span className={hr.permissions?.canAccessDashboard ? "text-slate-300" : "text-slate-600"}>Dashboard Console</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {hr.permissions?.canViewApplicants ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <ShieldAlert className="h-3.5 w-3.5 text-slate-650" />
                          )}
                          <span className={hr.permissions?.canViewApplicants ? "text-slate-300" : "text-slate-600"}>View Candidates</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {hr.permissions?.canGenerateOfferLetter ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <ShieldAlert className="h-3.5 w-3.5 text-slate-650" />
                          )}
                          <span className={hr.permissions?.canGenerateOfferLetter ? "text-slate-300" : "text-slate-600"}>Offer Letters</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {hr.permissions?.canGenerateCertificate ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <ShieldAlert className="h-3.5 w-3.5 text-slate-650" />
                          )}
                          <span className={hr.permissions?.canGenerateCertificate ? "text-slate-300" : "text-slate-600"}>Issue Credentials</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {hr.permissions?.canCreateJob ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <ShieldAlert className="h-3.5 w-3.5 text-slate-650" />
                          )}
                          <span className={hr.permissions?.canCreateJob ? "text-slate-300" : "text-slate-600"}>Job Postings</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {hr.permissions?.canManageReviews ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <ShieldAlert className="h-3.5 w-3.5 text-slate-650" />
                          )}
                          <span className={hr.permissions?.canManageReviews ? "text-slate-300" : "text-slate-600"}>Testimonials</span>
                        </div>
                      </div>
                    </div>

                    {/* Bound jobs indicator */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-4 bg-card/20 border border-white/5 rounded-2xl px-4 py-2.5">
                      <Briefcase className="h-4.5 w-4.5 text-slate-500" />
                      <span>
                        Recruitment Boundary:{" "}
                        <span className="text-slate-300 font-bold">
                          {hr.assignedJobs?.length > 0 
                            ? `${hr.assignedJobs.length} Bound Job${hr.assignedJobs.length > 1 ? "s" : ""}` 
                            : "Unlimited (Full Scope)"
                          }
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
                    <button
                      onClick={() => handleOpenConfig(hr)}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-white/5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Settings className="h-3.5 w-3.5" /> Adjust Boundaries
                    </button>
                    <button
                      onClick={() => handleRevoke(hr._id, hr.name)}
                      className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-450 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center transition-colors cursor-pointer"
                      title="Revoke Privileges"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* System Audit logs view */
        <div className="bg-slate-100/50 border border-slate-200/60 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
          {logs.length === 0 ? (
            <div className="py-16 text-center text-slate-400">No shifts or changes recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-slate-100/50">
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4 text-left">Timestamp</th>
                    <th className="px-6 py-4 text-left">Actor</th>
                    <th className="px-6 py-4 text-left">Action</th>
                    <th className="px-6 py-4 text-left">Subject User</th>
                    <th className="px-6 py-4 text-left">Change Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-350">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-[10px]">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-white">{log.actor?.name || "System"}</span>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest">{log.actorRole}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          log.action === "ASSIGN" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : log.action === "REVOKE"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-600/20"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-200">{log.resourceId?.name || "N/A"}</span>
                        <span className="text-[10px] text-slate-500 block">{log.resourceId?.email}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                        {formatDiff(log)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Adjust Boundaries / Permissions Modal */}
      {showConfigModal && selectedHR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-card/80 backdrop-blur-sm">
          <div className="bg-card border border-slate-200/60 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">
                  Department boundaries
                </span>
                <h3 className="font-heading text-lg font-black text-white">
                  Configure boundaries: {selectedHR.name}
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="h-8 w-8 rounded-full border border-white/5 flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-slate-900 transition-all cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Permissions Checklist */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" /> System Access Permissions
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(Object.keys(permissions) as Array<keyof HRUser["permissions"]>).map((key) => {
                    const label = key
                      .replace(/can([A-Z])/, "$1")
                      .replace(/([A-Z])/g, " $1")
                      .trim();
                    
                    return (
                      <div 
                        key={key} 
                        onClick={() => handleTogglePermission(key)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 cursor-pointer ${
                          permissions[key] 
                            ? "bg-primary/5 border-primary/20 text-white" 
                            : "bg-card border-white/5 text-slate-400 hover:border-slate-200/60"
                        }`}
                      >
                        <span className="text-xs font-semibold">{label}</span>
                        <div className={`h-5 w-5 rounded-lg flex items-center justify-center border transition-all ${
                          permissions[key] 
                            ? "bg-primary border-primary text-white" 
                            : "border-slate-800 bg-card"
                        }`}>
                          {permissions[key] && <Check className="h-3.5 w-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Job Visibility Bounds */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-primary" /> Recruitment Scope Limits
                </h4>
                <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                  Restrict this HR specialist's visibility to candidate applications for specific jobs. Leave all unchecked for unlimited organizational access.
                </p>

                {jobs.length === 0 ? (
                  <div className="text-xs text-slate-650 p-4 border border-white/5 rounded-2xl bg-card/20 text-center">
                    No active job listings published.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2 border border-white/5 rounded-2xl p-4 bg-card/40">
                    {jobs.map((job) => {
                      const isChecked = assignedJobs.includes(job._id);
                      return (
                        <div 
                          key={job._id}
                          onClick={() => handleToggleJob(job._id)}
                          className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                            isChecked ? "bg-slate-100/50 text-white" : "text-slate-400 hover:bg-slate-50/30"
                          }`}
                        >
                          <div className="text-[11px]">
                            <span className="font-bold">{job.title}</span>
                            <span className="text-[9px] text-slate-500 block">{job.location} • {job.company}</span>
                          </div>
                          <div className={`h-4.5 w-4.5 rounded flex items-center justify-center border transition-all ${
                            isChecked ? "bg-primary border-primary text-white" : "border-slate-800"
                          }`}>
                            {isChecked && <Check className="h-3 w-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-2 items-start bg-card/20 border border-white/5 rounded-xl p-3 text-[10px] text-slate-500">
                <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  These boundaries apply immediately. Changing access keys will log a trace under system audit trails.
                </p>
              </div>
            </div>

            <div className="p-6 bg-card/50 border-t border-white/5 flex justify-end gap-3 rounded-b-3xl">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-350 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border border-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={updatingPerms}
                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {updatingPerms ? "Saving..." : "Apply Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
