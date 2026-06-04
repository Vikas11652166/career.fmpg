"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { getAuditLogsAction } from "@/app/actions/admin";
import {
  RefreshCw,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Shield,
  Clock,
  Filter,
  X,
  FileText,
  Calendar,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuditActor {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuditResource {
  _id: string;
  name?: string;
  email?: string;
}

interface AuditLog {
  _id: string;
  actor: AuditActor | null;
  action: string;
  resourceEntity: string;
  resourceId: AuditResource | null;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

interface Props {
  initialLogs: AuditLog[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ACTION_TYPES = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "REVOKE",
  "UPDATE_PERMISSIONS",
  "STATUS_CHANGE",
  "ISSUE",
] as const;

type ActionType = (typeof ACTION_TYPES)[number];

const ACTION_STYLES: Record<
  ActionType,
  { label: string; bg: string; text: string; dot: string }
> = {
  CREATE: {
    label: "Create",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  UPDATE: {
    label: "Update",
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  DELETE: {
    label: "Delete",
    bg: "bg-red-500/15",
    text: "text-red-400",
    dot: "bg-red-400",
  },
  REVOKE: {
    label: "Revoke",
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    dot: "bg-orange-400",
  },
  UPDATE_PERMISSIONS: {
    label: "Permissions",
    bg: "bg-purple-500/15",
    text: "text-purple-400",
    dot: "bg-purple-400",
  },
  STATUS_CHANGE: {
    label: "Status",
    bg: "bg-yellow-500/15",
    text: "text-yellow-400",
    dot: "bg-yellow-400",
  },
  ISSUE: {
    label: "Issue",
    bg: "bg-emerald-600/15",
    text: "text-emerald-600",
    dot: "bg-indigo-400",
  },
};

const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  "super-admin": { bg: "bg-red-500/20", text: "text-red-300" },
  admin: { bg: "bg-purple-500/20", text: "text-purple-300" },
  employee: { bg: "bg-blue-500/20", text: "text-blue-300" },
  user: { bg: "bg-slate-500/20", text: "text-slate-300" },
};

const PAGE_SIZE = 20;

// ─── Utility Functions ────────────────────────────────────────────────────────

function formatRelative(isoDate: string): string {
  const now = Date.now();
  const diff = now - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function formatAbsolute(isoDate: string): string {
  return new Date(isoDate).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatRoleLabel(role: string): string {
  return role
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function escapeCSV(val: unknown): string {
  const str = val == null ? "" : String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCSV(logs: AuditLog[]) {
  const headers = [
    "Timestamp",
    "Actor Name",
    "Actor Email",
    "Actor Role",
    "Action",
    "Resource Entity",
    "Resource Name/Email",
    "Changes",
  ];
  const rows = logs.map((log) => [
    formatAbsolute(log.createdAt),
    log.actor?.name ?? "System",
    log.actor?.email ?? "—",
    log.actor?.role ?? "—",
    log.action,
    log.resourceEntity ?? "—",
    log.resourceId?.name ?? log.resourceId?.email ?? "—",
    log.changes ? JSON.stringify(log.changes) : "—",
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const style = ACTION_STYLES[action as ActionType] ?? {
    label: action,
    bg: "bg-slate-500/15",
    text: "text-slate-400",
    dot: "bg-slate-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${style.bg} ${style.text} border border-white/5`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`} />
      {style.label}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const style = ROLE_STYLES[role] ?? { bg: "bg-slate-500/20", text: "text-slate-300" };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-widest ${style.bg} ${style.text}`}
    >
      {formatRoleLabel(role)}
    </span>
  );
}

function Tooltip({ children, tip }: { children: React.ReactNode; tip: string }) {
  return (
    <span className="group relative inline-block">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover:block min-w-max max-w-xs px-3 py-1.5 rounded-lg bg-[#1e1e40] border border-slate-200/60 text-slate-900/80 text-xs shadow-xl whitespace-nowrap">
        {tip}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1e1e40]" />
      </span>
    </span>
  );
}

function DiffViewer({ changes }: { changes: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false);

  if (!changes) {
    return <span className="text-slate-900/30 text-xs italic">No changes</span>;
  }

  const prettified = JSON.stringify(changes, null, 2);
  const hasFrom = "from" in changes;
  const hasTo = "to" in changes;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100/50 hover:bg-white/10 text-slate-900/60 hover:text-slate-900/90 border border-slate-200/60 hover:border-white/20 transition-all duration-150"
      >
        <FileText className="w-3 h-3" />
        View Diff
        {open ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-slate-200/60 bg-[#0a0a1e]/80 backdrop-blur-sm overflow-hidden">
          {hasFrom && hasTo ? (
            <div className="grid grid-cols-2 divide-x divide-white/10">
              {/* Old */}
              <div className="p-3">
                <p className="text-[10px] font-semibold text-red-400/80 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                  Before
                </p>
                <pre className="text-[11px] text-red-300/70 leading-relaxed whitespace-pre-wrap break-words font-mono overflow-auto max-h-48">
                  {JSON.stringify(changes.from, null, 2)}
                </pre>
              </div>
              {/* New */}
              <div className="p-3">
                <p className="text-[10px] font-semibold text-emerald-400/80 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  After
                </p>
                <pre className="text-[11px] text-emerald-300/70 leading-relaxed whitespace-pre-wrap break-words font-mono overflow-auto max-h-48">
                  {JSON.stringify(changes.to, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-3">
              <pre className="text-[11px] text-blue-300/70 leading-relaxed whitespace-pre-wrap break-words font-mono overflow-auto max-h-64">
                {prettified}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-20 h-20 rounded-2xl bg-slate-100/50 border border-slate-200/60 flex items-center justify-center">
        <Shield className="w-9 h-9 text-slate-900/20" />
      </div>
      <p className="text-slate-900/40 text-sm font-medium">No audit logs found</p>
      <p className="text-slate-900/25 text-xs max-w-xs text-center">
        Audit logs will appear here once admin actions are performed within the system.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuditLogsTable({ initialLogs }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [actorSearch, setActorSearch] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Pagination
  const [page, setPage] = useState<number>(1);

  // ── Derived: filtered logs ─────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    let result = logs;

    if (actionFilter !== "all") {
      result = result.filter((l) => l.action === actionFilter);
    }

    if (actorSearch.trim()) {
      const q = actorSearch.toLowerCase();
      result = result.filter(
        (l) =>
          l.actor?.name?.toLowerCase().includes(q) ||
          l.actor?.email?.toLowerCase().includes(q)
      );
    }

    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      result = result.filter((l) => new Date(l.createdAt).getTime() >= from);
    }

    if (dateTo) {
      // Include the full "to" day
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((l) => new Date(l.createdAt).getTime() <= to.getTime());
    }

    return result;
  }, [logs, actionFilter, actorSearch, dateFrom, dateTo]);

  // ── Derived: paginated slice ───────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = useMemo(
    () => filteredLogs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredLogs, safePage]
  );

  // Reset to page 1 when filters change
  const handleFilterChange = useCallback(
    (fn: () => void) => {
      fn();
      setPage(1);
    },
    []
  );

  // ── Refresh ────────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      const res = await getAuditLogsAction();
      if (res.success && res.data) {
        setLogs(res.data as AuditLog[]);
      }
    });
  }, []);

  // ── Clear filters ──────────────────────────────────────────────────────────
  const hasActiveFilters =
    actionFilter !== "all" || actorSearch.trim() !== "" || dateFrom !== "" || dateTo !== "";

  const clearFilters = () => {
    setActionFilter("all");
    setActorSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/30 to-indigo-500/20 border border-emerald-600/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-violet-300" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Logs</h1>
          </div>
          <p className="text-slate-900/40 text-sm pl-12">
            Complete tamper-evident history of all admin actions
          </p>
        </div>

        <div className="flex items-center gap-2 pl-12 sm:pl-0">
          {/* Export CSV */}
          <button
            onClick={() => downloadCSV(filteredLogs)}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-900/70 bg-slate-100/50 hover:bg-white/10 border border-slate-200/60 hover:border-white/20 transition-all duration-150 disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            {isPending ? "Refreshing…" : "Refresh"}
          </button>

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 border ${
              showFilters || hasActiveFilters
                ? "bg-emerald-100/50 text-violet-300 border-emerald-600/30"
                : "text-slate-900/60 bg-slate-100/50 border-slate-200/60 hover:bg-white/10 hover:border-white/20"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-slate-900 text-[9px] font-bold flex items-center justify-center ml-0.5">
                !
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Filter Panel ── */}
      {showFilters && (
        <div className="relative rounded-2xl border border-slate-200/60 bg-slate-50/50 backdrop-blur-sm p-4 space-y-4">
          {/* Close */}
          <button
            onClick={() => setShowFilters(false)}
            className="absolute top-3 right-3 text-slate-900/30 hover:text-slate-900/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Action filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-900/40 uppercase tracking-widest">
                Action Type
              </label>
              <select
                value={actionFilter}
                onChange={(e) =>
                  handleFilterChange(() => setActionFilter(e.target.value))
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-100/50 border border-slate-200/60 text-slate-900/80 text-sm appearance-none focus:outline-none focus:border-emerald-600/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
              >
                <option value="all">All Actions</option>
                {ACTION_TYPES.map((a) => (
                  <option key={a} value={a}>
                    {ACTION_STYLES[a].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Actor search */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-900/40 uppercase tracking-widest">
                Actor Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-900/30 pointer-events-none" />
                <input
                  type="text"
                  value={actorSearch}
                  onChange={(e) =>
                    handleFilterChange(() => setActorSearch(e.target.value))
                  }
                  placeholder="Name or email…"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-100/50 border border-slate-200/60 text-slate-900/80 text-sm placeholder:text-slate-900/25 focus:outline-none focus:border-emerald-600/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>

            {/* Date from */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-900/40 uppercase tracking-widest flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) =>
                  handleFilterChange(() => setDateFrom(e.target.value))
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-100/50 border border-slate-200/60 text-slate-900/70 text-sm focus:outline-none focus:border-emerald-600/50 focus:ring-1 focus:ring-violet-500/20 transition-all [color-scheme:dark]"
              />
            </div>

            {/* Date to */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-900/40 uppercase tracking-widest flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) =>
                  handleFilterChange(() => setDateTo(e.target.value))
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-100/50 border border-slate-200/60 text-slate-900/70 text-sm focus:outline-none focus:border-emerald-600/50 focus:ring-1 focus:ring-violet-500/20 transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <p className="text-slate-900/40 text-xs">
                Showing{" "}
                <span className="text-slate-900/70 font-semibold">{filteredLogs.length}</span>{" "}
                of{" "}
                <span className="text-slate-900/70 font-semibold">{logs.length}</span> logs
              </p>
              <button
                onClick={clearFilters}
                className="text-xs text-emerald-600 hover:text-violet-300 font-medium transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(
          [
            { label: "Total Events", value: logs.length, color: "text-white" },
            {
              label: "Filtered",
              value: filteredLogs.length,
              color: "text-violet-300",
            },
            {
              label: "Page",
              value: `${safePage} / ${totalPages}`,
              color: "text-blue-300",
            },
            {
              label: "Per Page",
              value: PAGE_SIZE,
              color: "text-emerald-300",
            },
          ] as const
        ).map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl bg-slate-50/50 border border-white/8 px-4 py-3"
          >
            <p className="text-[11px] text-slate-900/35 uppercase tracking-widest mb-0.5">
              {label}
            </p>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-slate-200/60 bg-slate-50/30 backdrop-blur-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              {/* Sticky header */}
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#0d0d25]/90 backdrop-blur-md border-b border-slate-200/60">
                  {[
                    "Timestamp",
                    "Actor",
                    "Action",
                    "Resource",
                    "Changes",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-slate-900/40 uppercase tracking-widest whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.04]">
                {pageSlice.map((log, idx) => (
                  <tr
                    key={log._id}
                    className={`group transition-colors duration-100 hover:bg-slate-100 ${
                      idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]"
                    }`}
                  >
                    {/* ── Timestamp ── */}
                    <td className="px-4 py-3.5 whitespace-nowrap align-top">
                      <Tooltip tip={formatAbsolute(log.createdAt)}>
                        <div className="flex items-center gap-1.5 text-slate-900/60 text-xs cursor-default">
                          <Clock className="w-3 h-3 text-slate-900/30 shrink-0" />
                          <span className="font-medium text-slate-900/80">
                            {formatRelative(log.createdAt)}
                          </span>
                        </div>
                      </Tooltip>
                      <p className="text-[10px] text-slate-900/30 mt-0.5 pl-4">
                        {new Date(log.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </td>

                    {/* ── Actor ── */}
                    <td className="px-4 py-3.5 align-top">
                      {log.actor ? (
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900/90 leading-none">
                            {log.actor.name}
                          </p>
                          <p className="text-[11px] text-slate-900/40 leading-none">
                            {log.actor.email}
                          </p>
                          <RoleBadge role={log.actor.role} />
                        </div>
                      ) : (
                        <span className="text-slate-900/30 text-xs italic">System</span>
                      )}
                    </td>

                    {/* ── Action ── */}
                    <td className="px-4 py-3.5 align-top">
                      <ActionBadge action={log.action} />
                    </td>

                    {/* ── Resource ── */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100/50 border border-white/8 text-[11px] font-mono text-slate-900/50 uppercase tracking-wider">
                          {log.resourceEntity ?? "—"}
                        </span>
                        {log.resourceId && (
                          <p className="text-xs text-slate-900/60 leading-none mt-1">
                            {log.resourceId.name ?? log.resourceId.email ?? log.resourceId._id}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* ── Changes ── */}
                    <td className="px-4 py-3.5 align-top max-w-xs">
                      <DiffViewer changes={log.changes as Record<string, unknown> | null} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-slate-900/35 text-xs">
            Showing{" "}
            <span className="text-slate-900/60 font-medium">
              {(safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, filteredLogs.length)}
            </span>{" "}
            of{" "}
            <span className="text-slate-900/60 font-medium">{filteredLogs.length}</span>{" "}
            results
          </p>

          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-2 rounded-lg text-slate-900/50 hover:text-slate-900 hover:bg-slate-200/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - safePage) <= 2
              )
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-slate-900/20 text-sm">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                      p === safePage
                        ? "bg-emerald-600/30 text-violet-300 border border-emerald-600/40"
                        : "text-slate-900/40 hover:text-slate-900 hover:bg-slate-200/40"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-2 rounded-lg text-slate-900/50 hover:text-slate-900 hover:bg-slate-200/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
