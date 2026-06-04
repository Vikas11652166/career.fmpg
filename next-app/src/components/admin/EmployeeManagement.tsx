"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  UserMinus,
  Search,
  Filter,
  Upload,
  ChevronLeft,
  ChevronRight,
  Pencil,
  UserX,
  Eye,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Briefcase,
  Star,
  BarChart3,
  UserCog,
  FileSpreadsheet,
  RefreshCw,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import {
  getEmployeesAction,
  updateEmployeeAction,
  terminateEmployeeAction,
  bulkUploadEmployeesAction,
} from "@/app/actions/admin";

/* ─────────────────────────────── Types ─────────────────────────────── */

interface IPermissions {
  canGenerateCertificate: boolean;
  canGenerateOfferLetter: boolean;
  canCreateJob: boolean;
  canViewApplicants: boolean;
  canManageReviews: boolean;
  canManageEmployees: boolean;
  canManageRecommendations: boolean;
  canAccessDashboard: boolean;
}

interface IEmployee {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: "user" | "employee" | "admin" | "super-admin";
  status: "active" | "inactive" | "suspended" | "former";
  department?: string;
  position?: string;
  positionLevel?: string;
  employeeId?: string;
  reportingManager?: string;
  permissions: IPermissions;
  createdAt: string;
  terminatedAt?: string | null;
  terminationReason?: string | null;
}

interface IStats {
  totalEmployees: number;
  totalAdmins: number;
  totalSuperAdmins: number;
  activeStaff: number;
  suspendedAccounts: number;
  formerEmployees: number;
}

interface IPagination {
  currentPage: number;
  totalPages: number;
  total: number;
}

interface IInitialData {
  users: IEmployee[];
  pagination: IPagination;
  stats: IStats;
}

interface EmployeeManagementProps {
  initialData: IInitialData | null;
}

/* ─────────────────────────────── Helpers ─────────────────────────────── */

const ROLE_META: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  "super-admin": {
    label: "Super Admin",
    color:
      "bg-purple-500/20 text-purple-300 border border-purple-500/30 ring-1 ring-purple-500/20",
    icon: <Crown className="h-2.5 w-2.5" />,
  },
  admin: {
    label: "Admin",
    color:
      "bg-blue-500/20 text-blue-300 border border-blue-500/30 ring-1 ring-blue-500/20",
    icon: <ShieldCheck className="h-2.5 w-2.5" />,
  },
  employee: {
    label: "Employee",
    color:
      "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 ring-1 ring-emerald-500/20",
    icon: <Users className="h-2.5 w-2.5" />,
  },
  user: {
    label: "User",
    color:
      "bg-slate-500/20 text-slate-300 border border-slate-500/30 ring-1 ring-slate-500/20",
    icon: <Users className="h-2.5 w-2.5" />,
  },
};

const STATUS_META: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  active: {
    label: "Active",
    color: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  inactive: {
    label: "Inactive",
    color: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    dot: "bg-amber-400",
  },
  suspended: {
    label: "Suspended",
    color: "bg-red-500/15 text-red-300 border border-red-500/30",
    dot: "bg-red-400",
  },
  former: {
    label: "Former",
    color: "bg-slate-500/15 text-slate-300 border border-slate-500/30",
    dot: "bg-slate-400",
  },
};

const POSITION_LEVELS = [
  "junior",
  "mid",
  "senior",
  "lead",
  "manager",
  "director",
  "vp",
  "c-level",
];

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role] ?? ROLE_META["user"];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${meta.color}`}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META["inactive"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${meta.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} animate-pulse`} />
      {meta.label}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-slate-50 border border-slate-200/60 p-5 hover:bg-slate-100/80 transition-all duration-300 group">
      <div
        className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 ${accent}`}
      />
      <div className="flex items-center justify-between mb-3">
        <div
          className={`h-9 w-9 rounded-xl flex items-center justify-center ${accent} bg-opacity-20`}
        >
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black text-slate-900 tabular-nums">{value}</p>
      <p className="text-[11px] font-semibold text-slate-900/40 mt-0.5 uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}

/* ─────────────────────────── Main Component ─────────────────────────── */

export default function EmployeeManagement({
  initialData,
}: EmployeeManagementProps) {
  /* ── State ── */
  const [employees, setEmployees] = useState<IEmployee[]>(
    initialData?.users ?? []
  );
  const [stats, setStats] = useState<IStats>(
    initialData?.stats ?? {
      totalEmployees: 0,
      totalAdmins: 0,
      totalSuperAdmins: 0,
      activeStaff: 0,
      suspendedAccounts: 0,
      formerEmployees: 0,
    }
  );
  const [pagination, setPagination] = useState<IPagination>(
    initialData?.pagination ?? { currentPage: 1, totalPages: 1, total: 0 }
  );

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Edit modal
  const [editEmployee, setEditEmployee] = useState<IEmployee | null>(null);
  const [editForm, setEditForm] = useState({
    role: "employee",
    status: "active",
    department: "",
    position: "",
    positionLevel: "junior",
    permissions: {
      canGenerateCertificate: false,
      canGenerateOfferLetter: false,
      canCreateJob: false,
      canViewApplicants: false,
      canManageReviews: false,
      canManageEmployees: false,
      canManageRecommendations: false,
      canAccessDashboard: false,
    },
  });
  const [isSaving, setIsSaving] = useState(false);

  // Terminate confirm
  const [terminateTarget, setTerminateTarget] = useState<IEmployee | null>(
    null
  );
  const [terminateReason, setTerminateReason] = useState("");
  const [isTerminating, setIsTerminating] = useState(false);

  // Bulk CSV upload
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCsvContent, setBulkCsvContent] = useState("");
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Data Fetch ── */
  const fetchEmployees = useCallback(
    async (page = currentPage) => {
      try {
        setIsLoading(true);
        const res = await getEmployeesAction({
          page,
          limit: 10,
          search,
          role: roleFilter,
          status: statusFilter,
        });
        if (res.success && res.data) {
          setEmployees(res.data.users);
          setStats(res.data.stats);
          setPagination(res.data.pagination);
          setCurrentPage(res.data.pagination.currentPage);
        } else {
          toast.error("Failed to fetch employees");
        }
      } catch {
        toast.error("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [search, roleFilter, statusFilter, currentPage]
  );

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1);
      fetchEmployees(1);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, statusFilter]);

  /* ── Edit Employee ── */
  const openEdit = (emp: IEmployee) => {
    setEditEmployee(emp);
    setEditForm({
      role: emp.role,
      status: emp.status,
      department: emp.department ?? "",
      position: emp.position ?? "",
      positionLevel: (emp.positionLevel ?? "junior").toLowerCase(),
      permissions: {
        canGenerateCertificate:
          emp.permissions?.canGenerateCertificate ?? false,
        canGenerateOfferLetter:
          emp.permissions?.canGenerateOfferLetter ?? false,
        canCreateJob: emp.permissions?.canCreateJob ?? false,
        canViewApplicants: emp.permissions?.canViewApplicants ?? false,
        canManageReviews: emp.permissions?.canManageReviews ?? false,
        canManageEmployees: emp.permissions?.canManageEmployees ?? false,
        canManageRecommendations:
          emp.permissions?.canManageRecommendations ?? false,
        canAccessDashboard: emp.permissions?.canAccessDashboard ?? false,
      },
    });
  };

  const handleSaveEdit = async () => {
    if (!editEmployee) return;
    try {
      setIsSaving(true);
      const res = await updateEmployeeAction(editEmployee._id, editForm);
      if (res.success) {
        toast.success(res.message ?? "Employee updated successfully");
        setEditEmployee(null);
        fetchEmployees(currentPage);
      } else {
        toast.error(res.message ?? "Failed to update employee");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Terminate Employee ── */
  const handleTerminate = async () => {
    if (!terminateTarget) return;
    try {
      setIsTerminating(true);
      const res = await terminateEmployeeAction(terminateTarget._id, {
        reason: terminateReason || "Termination of employment",
      });
      if (res.success) {
        toast.success(res.message ?? "Employee terminated");
        setTerminateTarget(null);
        setTerminateReason("");
        fetchEmployees(currentPage);
      } else {
        toast.error(res.message ?? "Failed to terminate employee");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsTerminating(false);
    }
  };

  /* ── Bulk CSV Upload ── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBulkCsvContent(ev.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = async () => {
    if (!bulkCsvContent.trim()) {
      toast.error("Please select or paste a CSV file first");
      return;
    }
    try {
      setIsBulkUploading(true);
      const lines = bulkCsvContent.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error("CSV must contain a header row and at least one data row");
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const rows = lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.trim());
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          obj[h] = cols[idx] ?? "";
        });
        return obj;
      });
      if (rows.length === 0) {
        toast.error("No valid rows found in CSV");
        return;
      }
      const res = await bulkUploadEmployeesAction(rows);
      if (res.success) {
        toast.success(res.message ?? "Bulk upload successful");
        setShowBulkModal(false);
        setBulkCsvContent("");
        fetchEmployees(1);
      } else {
        toast.error(res.message ?? "Bulk upload failed");
      }
    } catch {
      toast.error("CSV import failed");
    } finally {
      setIsBulkUploading(false);
    }
  };

  /* ── Pagination ── */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchEmployees(page);
  };

  /* ────────────────────────── Render ────────────────────────── */
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/5">
              <UserCog className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Employee &amp; Role Management
            </h1>
          </div>
          <p className="text-sm text-slate-900/40 font-medium ml-14">
            Manage staff accounts, roles, permissions, and organisational structure
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fetchEmployees(currentPage)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200/60 text-slate-900/60 hover:text-slate-900 hover:bg-white/[0.1] transition-all duration-200 text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-indigo-400 hover:to-violet-500 text-slate-900 text-xs font-bold shadow-lg shadow-emerald-500/5 transition-all duration-200"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Bulk CSV Upload
          </button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={<Users className="h-4 w-4 text-emerald-500" />}
          label="Total Employees"
          value={stats.totalEmployees}
          accent="bg-emerald-600"
        />
        <StatCard
          icon={<ShieldCheck className="h-4 w-4 text-blue-300" />}
          label="Total Admins"
          value={stats.totalAdmins + stats.totalSuperAdmins}
          accent="bg-amber-500"
        />
        <StatCard
          icon={<Star className="h-4 w-4 text-purple-300" />}
          label="Super Admins"
          value={stats.totalSuperAdmins}
          accent="bg-emerald-700"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-300" />}
          label="Active Staff"
          value={stats.activeStaff}
          accent="bg-emerald-500"
        />
        <StatCard
          icon={<ShieldAlert className="h-4 w-4 text-red-300" />}
          label="Suspended"
          value={stats.suspendedAccounts}
          accent="bg-red-500"
        />
        <StatCard
          icon={<UserMinus className="h-4 w-4 text-slate-300" />}
          label="Former"
          value={stats.formerEmployees}
          accent="bg-slate-500"
        />
      </div>

      {/* ── Filters Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-900/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, department…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200/60 text-slate-900 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-emerald-600/50 focus:bg-slate-200/50 transition-all duration-200"
          />
        </div>

        {/* Role filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-900/30 pointer-events-none" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-xl bg-slate-100 border border-slate-200/60 text-slate-900/70 text-xs font-semibold focus:outline-none focus:border-emerald-600/50 transition-all duration-200 appearance-none min-w-[140px] cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="super-admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="employee">Employee</option>
            <option value="user">User</option>
          </select>
        </div>

        {/* Status filter */}
        <div className="relative">
          <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-900/30 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-xl bg-slate-100 border border-slate-200/60 text-slate-900/70 text-xs font-semibold focus:outline-none focus:border-emerald-600/50 transition-all duration-200 appearance-none min-w-[140px] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="former">Former</option>
          </select>
        </div>

        {/* Result count */}
        <div className="ml-auto text-[11px] text-slate-900/30 font-semibold self-center shrink-0">
          {pagination.total} result{pagination.total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="rounded-2xl overflow-hidden border border-slate-200/60 backdrop-blur-xl bg-slate-50/50">
        {/* Table header */}
        <div className="grid grid-cols-[minmax(200px,2fr)_140px_150px_130px_120px_170px] px-5 py-3 bg-slate-50 border-b border-slate-200/60">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900/30">
            Name / Email
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900/30">
            Role
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900/30">
            Department
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900/30">
            Position
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900/30">
            Status
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900/30 text-right">
            Actions
          </span>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-slate-900/40">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <span className="text-sm font-semibold">
                Loading employees…
              </span>
            </div>
          </div>
        )}

        {/* Rows */}
        {!isLoading && employees.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users className="h-10 w-10 text-slate-900/10" />
            <p className="text-sm text-slate-900/30 font-semibold">
              No employees found
            </p>
            <p className="text-xs text-slate-900/20">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {!isLoading &&
          employees.map((emp, idx) => (
            <div
              key={emp._id}
              className={`grid grid-cols-[minmax(200px,2fr)_140px_150px_130px_120px_170px] px-5 py-3.5 items-center transition-all duration-150 hover:bg-slate-50 group ${
                idx !== employees.length - 1
                  ? "border-b border-slate-200/40"
                  : ""
              }`}
            >
              {/* Name / Email */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-slate-200/60 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-slate-900/80">
                    {emp.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-slate-900 truncate">
                    {emp.name}
                  </p>
                  <p className="text-[11px] text-slate-900/40 truncate font-medium">
                    {emp.email}
                  </p>
                  {emp.employeeId && (
                    <p className="text-[10px] text-emerald-600/70 font-mono">
                      {emp.employeeId}
                    </p>
                  )}
                </div>
              </div>

              {/* Role badge */}
              <div>
                <RoleBadge role={emp.role} />
              </div>

              {/* Department */}
              <div>
                {emp.department ? (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-slate-900/30 shrink-0" />
                    <span className="text-[12px] text-slate-900/70 font-medium truncate">
                      {emp.department}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-900/20 italic">
                    —
                  </span>
                )}
              </div>

              {/* Position */}
              <div>
                {emp.position ? (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3 text-slate-900/30 shrink-0" />
                      <span className="text-[12px] text-slate-900/70 font-medium truncate">
                        {emp.position}
                      </span>
                    </div>
                    {emp.positionLevel && (
                      <span className="text-[10px] text-slate-900/30 pl-4 capitalize">
                        {emp.positionLevel}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-900/20 italic">—</span>
                )}
              </div>

              {/* Status badge */}
              <div>
                <StatusBadge status={emp.status} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 justify-end">
                {/* View profile */}
                <button
                  title="View Profile"
                  className="h-7 w-7 rounded-lg bg-slate-100 border border-slate-200/60 text-slate-900/40 hover:text-slate-900 hover:bg-white/[0.12] flex items-center justify-center transition-all duration-150"
                  onClick={() =>
                    toast.info(`Profile: ${emp.name} (${emp.email})`)
                  }
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>

                {/* Edit */}
                <button
                  title="Edit Employee"
                  className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-600/20 text-emerald-600 hover:bg-emerald-600/25 hover:text-emerald-500 flex items-center justify-center transition-all duration-150"
                  onClick={() => openEdit(emp)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>

                {/* Terminate */}
                <button
                  title="Terminate Contract"
                  disabled={emp.status === "former"}
                  className="h-7 w-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/25 hover:text-red-300 flex items-center justify-center transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => {
                    setTerminateTarget(emp);
                    setTerminateReason("");
                  }}
                >
                  <UserX className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-900/30 font-semibold">
            Page {pagination.currentPage} of {pagination.totalPages} &nbsp;·&nbsp;{" "}
            {pagination.total} total
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1 || isLoading}
              onClick={() => handlePageChange(currentPage - 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200/60 text-slate-900/50 hover:text-slate-900 hover:bg-white/[0.1] text-xs font-bold transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>

            {Array.from({ length: Math.min(pagination.totalPages, 7) }).map(
              (_, i) => {
                let page: number;
                if (pagination.totalPages <= 7) {
                  page = i + 1;
                } else if (currentPage <= 4) {
                  page = i + 1;
                } else if (currentPage >= pagination.totalPages - 3) {
                  page = pagination.totalPages - 6 + i;
                } else {
                  page = currentPage - 3 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`h-7 w-7 rounded-lg text-xs font-bold transition-all duration-150 ${
                      page === currentPage
                        ? "bg-emerald-600 text-slate-900 shadow-lg shadow-emerald-500/5"
                        : "bg-slate-100 border border-slate-200/60 text-slate-900/40 hover:text-slate-900 hover:bg-white/[0.1]"
                    }`}
                  >
                    {page}
                  </button>
                );
              }
            )}

            <button
              disabled={currentPage >= pagination.totalPages || isLoading}
              onClick={() => handlePageChange(currentPage + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200/60 text-slate-900/50 hover:text-slate-900 hover:bg-white/[0.1] text-xs font-bold transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ EDIT EMPLOYEE MODAL ════════════════ */}
      {editEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditEmployee(null);
          }}
        >
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200/60 shadow-2xl shadow-slate-900/10 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-slate-50/30 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-100/50 border border-emerald-600/30 flex items-center justify-center">
                  <Pencil className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Edit Employee
                  </h3>
                  <p className="text-[11px] text-slate-900/40">
                    {editEmployee.name} &middot; {editEmployee.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditEmployee(null)}
                className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200/60 text-slate-900/40 hover:text-slate-900 flex items-center justify-center transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form body */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              {/* Row 1: Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-900/40 block mb-2">
                    Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600/60 transition-all appearance-none"
                  >
                    <option value="user">User</option>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                    <option value="super-admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-900/40 block mb-2">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600/60 transition-all appearance-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="former">Former</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Department & Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-900/40 block mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) =>
                      setEditForm({ ...editForm, department: e.target.value })
                    }
                    placeholder="e.g. Engineering, HR, Operations"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-emerald-600/60 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-900/40 block mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    value={editForm.position}
                    onChange={(e) =>
                      setEditForm({ ...editForm, position: e.target.value })
                    }
                    placeholder="e.g. Software Engineer, HR Lead"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-emerald-600/60 transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Position Level */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-900/40 block mb-2">
                  Position Level
                </label>
                <select
                  value={editForm.positionLevel}
                  onChange={(e) =>
                    setEditForm({ ...editForm, positionLevel: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600/60 transition-all appearance-none"
                >
                  {POSITION_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl} className="capitalize">
                      {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Permissions grid */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-900/40 block mb-3">
                  Permissions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    Object.entries(editForm.permissions) as [
                      keyof IPermissions,
                      boolean
                    ][]
                  ).map(([key, val]) => {
                    const label = key
                      .replace(/^can/, "")
                      .replace(/([A-Z])/g, " $1")
                      .trim();
                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                          val
                            ? "bg-emerald-50 border-emerald-600/30 text-white"
                            : "bg-slate-50/50 border-slate-200/60 text-slate-900/50 hover:border-slate-200"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                            val
                              ? "bg-emerald-600 border-emerald-600"
                              : "border-white/20 bg-slate-100"
                          }`}
                        >
                          {val && (
                            <svg
                              className="h-2.5 w-2.5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold capitalize">
                          {label}
                        </span>
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              permissions: {
                                ...editForm.permissions,
                                [key]: e.target.checked,
                              },
                            })
                          }
                          className="sr-only"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200/60 bg-slate-50/30 shrink-0">
              <button
                onClick={() => setEditEmployee(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-900/60 hover:text-slate-900 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-indigo-400 hover:to-violet-500 text-slate-900 text-xs font-bold shadow-lg shadow-emerald-500/5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {isSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ TERMINATE CONFIRM MODAL ════════════════ */}
      {terminateTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTerminateTarget(null);
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#1f0a0a] to-[#2a0f0f] border border-red-500/20 shadow-2xl shadow-slate-900/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-red-500/10 bg-red-500/[0.04]">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                </div>
                <h3 className="text-sm font-black text-white">
                  Confirm Termination
                </h3>
              </div>
              <button
                onClick={() => setTerminateTarget(null)}
                className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200/60 text-slate-900/40 hover:text-slate-900 flex items-center justify-center transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-900/70 leading-relaxed">
                You are about to terminate the employment contract of{" "}
                <span className="font-bold text-white">
                  {terminateTarget.name}
                </span>{" "}
                ({terminateTarget.email}). This will revoke all dashboard
                access and mark their account as{" "}
                <span className="text-red-400 font-bold">Former</span>.
              </p>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-900/40 block mb-2">
                  Termination Reason
                </label>
                <textarea
                  rows={3}
                  value={terminateReason}
                  onChange={(e) => setTerminateReason(e.target.value)}
                  placeholder="Enter reason for termination (optional)…"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-red-500/20 text-slate-900 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-red-500/50 transition-all resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-red-500/10 bg-red-500/[0.02]">
              <button
                onClick={() => setTerminateTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-900/60 hover:text-slate-900 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminate}
                disabled={isTerminating}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-slate-900 text-xs font-bold shadow-lg shadow-red-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isTerminating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserX className="h-3.5 w-3.5" />
                )}
                {isTerminating ? "Processing…" : "Terminate Contract"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ BULK CSV UPLOAD MODAL ════════════════ */}
      {showBulkModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBulkModal(false);
          }}
        >
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200/60 shadow-2xl shadow-slate-900/10 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-slate-50/30 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-100/50 border border-emerald-600/30 flex items-center justify-center">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Bulk Employee CSV Upload
                  </h3>
                  <p className="text-[11px] text-slate-900/40">
                    Import or update multiple employee profiles at once
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200/60 text-slate-900/40 hover:text-slate-900 flex items-center justify-center transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* CSV format hint */}
              <div className="rounded-xl bg-emerald-600/[0.07] border border-emerald-600/20 p-4">
                <p className="text-[11px] font-bold text-emerald-500 mb-1">
                  Expected CSV Format:
                </p>
                <code className="text-[10px] text-slate-900/50 font-mono">
                  name,email,phoneNumber,role,department,position
                </code>
                <p className="text-[10px] text-slate-900/30 mt-1.5">
                  Role values: <code className="text-emerald-600">user</code>,{" "}
                  <code className="text-emerald-600">employee</code>,{" "}
                  <code className="text-emerald-600">admin</code>,{" "}
                  <code className="text-emerald-600">super-admin</code>. Existing
                  users (by email) will be updated.
                </p>
              </div>

              {/* File picker */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 border border-dashed border-slate-200 text-slate-900/50 hover:text-slate-900 hover:border-emerald-600/50 text-xs font-semibold transition-all w-full justify-center"
                >
                  <Upload className="h-4 w-4" />
                  Click to browse &amp; select CSV file
                </button>
              </div>

              {/* Or paste area */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-900/40 block mb-2">
                  Or paste CSV content here
                </label>
                <textarea
                  rows={8}
                  value={bulkCsvContent}
                  onChange={(e) => setBulkCsvContent(e.target.value)}
                  placeholder={`name,email,phoneNumber,role,department,position\nJohn Doe,john@fmpg.com,9876543210,employee,Engineering,SDE\nJane Smith,jane@fmpg.com,9876543211,admin,HR,HR Lead`}
                  className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-900 placeholder-slate-400 text-xs font-mono focus:outline-none focus:border-emerald-600/50 transition-all resize-none"
                />
              </div>

              {bulkCsvContent && (
                <div className="rounded-xl bg-emerald-500/[0.07] border border-emerald-500/20 p-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <p className="text-[11px] text-emerald-300 font-semibold">
                    CSV data loaded &middot;{" "}
                    {bulkCsvContent.split("\n").filter((l) => l.trim()).length -
                      1}{" "}
                    data row(s) detected
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200/60 bg-slate-50/30 shrink-0">
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkCsvContent("");
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-900/60 hover:text-slate-900 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpload}
                disabled={isBulkUploading || !bulkCsvContent.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-violet-400 hover:to-indigo-500 text-slate-900 text-xs font-bold shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {isBulkUploading ? "Importing…" : "Import Employees"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
