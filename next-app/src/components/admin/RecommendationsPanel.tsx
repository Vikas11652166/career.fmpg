"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Bot,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Loader2,
  ChevronDown,
  Star,
  Briefcase,
  Mail,
  Building2,
  IdCard,
  MessageSquare,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  SlidersHorizontal,
  Zap,
  BarChart3,
} from "lucide-react";
import {
  getAllRecommendationsAction,
  updateRecommendationStatusAction,
  getJobsAction,
  getAIRecommendationsAction,
} from "@/app/actions/admin";
import { updateApplicationStatusAction } from "@/app/actions/applications";
import { toast } from "sonner";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type RecommendationStatus = "pending" | "reviewed" | "selected" | "rejected";
type ApplicationStatus = "pending" | "reviewing" | "shortlisted" | "rejected" | "offered" | "hired";

interface Recommender {
  _id: string;
  name: string;
  email: string;
  employeeId?: string;
  department?: string;
  position?: string;
}

interface RecommendedUser {
  _id: string;
  name: string;
  email: string;
  status?: string;
}

interface JobRef {
  _id: string;
  title: string;
  department?: string;
  location?: string;
}

interface Recommendation {
  _id: string;
  recommender: Recommender | null;
  recommendedUser: RecommendedUser | null;
  recommendedUserName: string;
  recommendedUserEmail: string;
  jobId: JobRef | null;
  status: RecommendationStatus;
  recommendationMessage?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Job {
  _id: string;
  title: string;
  department?: string;
  location?: string;
  isActive?: boolean;
}

interface AIMatch {
  applicationId: string;
  fullName: string;
  email: string;
  phone?: string;
  status: ApplicationStatus;
  score: number;
  reasons: string[];
  resumeUrl?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Helper utilities
// ─────────────────────────────────────────────

function getStatusBadge(status: RecommendationStatus) {
  const cfg: Record<RecommendationStatus, { label: string; classes: string }> = {
    pending: {
      label: "Pending",
      classes:
        "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-amber-500/10",
    },
    reviewed: {
      label: "Reviewed",
      classes:
        "bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-blue-500/10",
    },
    selected: {
      label: "Selected",
      classes:
        "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-emerald-500/10",
    },
    rejected: {
      label: "Rejected",
      classes:
        "bg-red-500/15 text-red-300 border border-red-500/30 shadow-red-500/10",
    },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${c.classes}`}
    >
      {c.label}
    </span>
  );
}

function getScoreColor(score: number) {
  if (score >= 70) return { bar: "bg-emerald-500", text: "text-emerald-300", glow: "shadow-emerald-500/30" };
  if (score >= 40) return { bar: "bg-amber-500", text: "text-amber-300", glow: "shadow-amber-500/30" };
  return { bar: "bg-red-500", text: "text-red-300", glow: "shadow-red-500/30" };
}

function getAppStatusColor(status: ApplicationStatus) {
  const map: Record<string, string> = {
    pending: "text-amber-300 bg-amber-500/10 border-amber-500/25",
    reviewing: "text-blue-300 bg-blue-500/10 border-blue-500/25",
    shortlisted: "text-violet-300 bg-emerald-600/10 border-emerald-600/25",
    rejected: "text-red-300 bg-red-500/10 border-red-500/25",
    offered: "text-teal-300 bg-teal-500/10 border-teal-500/25",
    hired: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
  };
  return map[status] || map.pending;
}

// ─────────────────────────────────────────────
// Confirmation Dialog
// ─────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass?: string;
  onConfirm: (notes: string) => void;
  onCancel: () => void;
  showNotes?: boolean;
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmClass = "bg-indigo-600 hover:bg-emerald-600",
  onConfirm,
  onCancel,
  showNotes = true,
}: ConfirmDialogProps) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) setNotes("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/60 bg-[#141428]/95 backdrop-blur-xl shadow-2xl shadow-slate-900/10 p-6 space-y-4">
        <h3 className="text-base font-black text-white">{title}</h3>
        <p className="text-sm text-slate-900/60 leading-relaxed">{description}</p>
        {showNotes && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-900/40">
              Admin Notes (optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add review notes or comments..."
              className="w-full px-3 py-2 bg-slate-100/50 border border-slate-200/60 rounded-xl text-xs text-slate-900 placeholder:text-slate-900/30 focus:outline-none focus:border-emerald-600/50 resize-none transition"
            />
          </div>
        )}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100/50 border border-slate-200/60 text-slate-900/70 hover:bg-white/10 hover:text-slate-900 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(notes)}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 transition ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AI Status Update Modal
// ─────────────────────────────────────────────

interface StatusUpdateModalProps {
  open: boolean;
  candidateName: string;
  currentStatus: ApplicationStatus;
  onConfirm: (newStatus: ApplicationStatus, comments: string) => void;
  onCancel: () => void;
}

const APP_STATUSES: ApplicationStatus[] = [
  "pending",
  "reviewing",
  "shortlisted",
  "rejected",
  "offered",
  "hired",
];

function StatusUpdateModal({
  open,
  candidateName,
  currentStatus,
  onConfirm,
  onCancel,
}: StatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(currentStatus);
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedStatus(currentStatus);
      setComments("");
    }
  }, [open, currentStatus]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/60 bg-[#141428]/95 backdrop-blur-xl shadow-2xl shadow-slate-900/10 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-emerald-600/30 flex items-center justify-center">
            <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Update Application Status</h3>
            <p className="text-[10px] text-slate-900/50">{candidateName}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-900/40">New Status</label>
          <div className="grid grid-cols-3 gap-2">
            {APP_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition capitalize ${
                  selectedStatus === s
                    ? "bg-indigo-600 border-emerald-600 text-white"
                    : "bg-slate-100/50 border-slate-200/60 text-slate-900/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-900/40">
            Comments (optional)
          </label>
          <textarea
            rows={2}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Brief notes about this status change..."
            className="w-full px-3 py-2 bg-slate-100/50 border border-slate-200/60 rounded-xl text-xs text-slate-900 placeholder:text-slate-900/30 focus:outline-none focus:border-emerald-600/50 resize-none transition"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100/50 border border-slate-200/60 text-slate-900/70 hover:bg-white/10 hover:text-slate-900 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedStatus, comments)}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-emerald-600 text-slate-900 transition"
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Referral Card
// ─────────────────────────────────────────────

interface ReferralCardProps {
  rec: Recommendation;
  onAction: (id: string, status: "reviewed" | "selected" | "rejected", notes?: string) => Promise<void>;
  loadingId: string | null;
}

function ReferralCard({ rec, onAction, loadingId }: ReferralCardProps) {
  const [dialog, setDialog] = useState<{
    open: boolean;
    action: "reviewed" | "selected" | "rejected";
    title: string;
    description: string;
    confirmLabel: string;
    confirmClass: string;
  } | null>(null);

  const isLoading = loadingId === rec._id;

  const handleAction = (
    action: "reviewed" | "selected" | "rejected",
    title: string,
    description: string,
    confirmLabel: string,
    confirmClass: string
  ) => {
    setDialog({ open: true, action, title, description, confirmLabel, confirmClass });
  };

  const handleConfirm = async (notes: string) => {
    if (!dialog) return;
    setDialog(null);
    await onAction(rec._id, dialog.action, notes);
  };

  return (
    <>
      {dialog?.open && (
        <ConfirmDialog
          open={dialog.open}
          title={dialog.title}
          description={dialog.description}
          confirmLabel={dialog.confirmLabel}
          confirmClass={dialog.confirmClass}
          onConfirm={handleConfirm}
          onCancel={() => setDialog(null)}
          showNotes={true}
        />
      )}

      <div className="relative group rounded-2xl border border-slate-200/60 bg-slate-50 backdrop-blur-sm hover:bg-slate-100/80 hover:border-white/20 transition-all duration-300 overflow-hidden">
        {/* Left accent bar based on status */}
        <div
          className={`absolute left-0 inset-y-0 w-0.5 ${
            rec.status === "selected"
              ? "bg-emerald-500"
              : rec.status === "reviewed"
              ? "bg-blue-500"
              : rec.status === "rejected"
              ? "bg-red-500"
              : "bg-amber-500"
          }`}
        />

        <div className="p-5 pl-6 space-y-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-slate-900 truncate">
                  {rec.recommendedUserName || rec.recommendedUser?.name || "Unknown Candidate"}
                </h3>
                {getStatusBadge(rec.status)}
              </div>
              <p className="text-[11px] text-slate-900/50 mt-0.5 flex items-center gap-1.5">
                <Mail className="h-3 w-3 shrink-0" />
                {rec.recommendedUserEmail || rec.recommendedUser?.email || "—"}
              </p>
            </div>
            <span className="text-[10px] text-slate-900/30 font-medium shrink-0">
              {new Date(rec.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Referred By */}
            {rec.recommender && (
              <div className="rounded-xl bg-emerald-600/8 border border-emerald-600/15 p-3 space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/70">
                  Referred By
                </p>
                <p className="text-xs font-bold text-white">{rec.recommender.name}</p>
                <p className="text-[10px] text-slate-900/50 flex items-center gap-1">
                  <Mail className="h-2.5 w-2.5" />
                  {rec.recommender.email}
                </p>
                {rec.recommender.employeeId && (
                  <p className="text-[10px] text-slate-900/40 flex items-center gap-1">
                    <IdCard className="h-2.5 w-2.5" />
                    EMP-{rec.recommender.employeeId}
                  </p>
                )}
                {rec.recommender.department && (
                  <p className="text-[10px] text-slate-900/40 flex items-center gap-1">
                    <Building2 className="h-2.5 w-2.5" />
                    {rec.recommender.department}
                  </p>
                )}
              </div>
            )}

            {/* Job Position */}
            {rec.jobId && (
              <div className="rounded-xl bg-emerald-600/8 border border-emerald-600/15 p-3 space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/70">
                  Job Position
                </p>
                <p className="text-xs font-bold text-white">{rec.jobId.title}</p>
                {rec.jobId.department && (
                  <p className="text-[10px] text-slate-900/40">{rec.jobId.department}</p>
                )}
                {rec.jobId.location && (
                  <p className="text-[10px] text-slate-900/40">{rec.jobId.location}</p>
                )}
              </div>
            )}

            {/* Recommendation Message */}
            {rec.recommendationMessage && (
              <div className="rounded-xl bg-slate-100/50 border border-slate-200/60 p-3 space-y-0.5 sm:col-span-2 lg:col-span-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-900/40 flex items-center gap-1">
                  <MessageSquare className="h-2.5 w-2.5" /> Message
                </p>
                <p className="text-[11px] text-slate-900/60 leading-relaxed line-clamp-3">
                  {rec.recommendationMessage}
                </p>
              </div>
            )}
          </div>

          {/* Admin Notes */}
          {rec.adminNotes && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-white/4 border border-white/8">
              <AlertCircle className="h-3.5 w-3.5 text-slate-900/30 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-900/50 leading-relaxed">
                <span className="font-bold text-slate-900/40">Admin Notes: </span>
                {rec.adminNotes}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {rec.status !== "rejected" && (
            <div className="flex flex-wrap gap-2 pt-1">
              {rec.status === "pending" && (
                <>
                  <button
                    disabled={isLoading}
                    onClick={() =>
                      handleAction(
                        "selected",
                        "Approve & Select Candidate",
                        `Are you sure you want to select ${rec.recommendedUserName || "this candidate"}? This will create/link an application for them.`,
                        "Approve & Select",
                        "bg-emerald-600 hover:bg-emerald-500"
                      )
                    }
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 hover:border-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    Approve / Select
                  </button>
                  <button
                    disabled={isLoading}
                    onClick={() =>
                      handleAction(
                        "reviewed",
                        "Mark as Reviewed",
                        `Mark this referral from ${rec.recommender?.name || "employee"} as reviewed. You can add notes.`,
                        "Mark Reviewed",
                        "bg-blue-600 hover:bg-blue-500"
                      )
                    }
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 hover:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Eye className="h-3 w-3" />
                    Review
                  </button>
                  <button
                    disabled={isLoading}
                    onClick={() =>
                      handleAction(
                        "rejected",
                        "Reject Referral",
                        `Reject the referral for ${rec.recommendedUserName || "this candidate"}? This action cannot be undone.`,
                        "Confirm Reject",
                        "bg-red-600 hover:bg-red-500"
                      )
                    }
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30 hover:border-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="h-3 w-3" />
                    Reject
                  </button>
                </>
              )}
              {rec.status === "reviewed" && (
                <>
                  <button
                    disabled={isLoading}
                    onClick={() =>
                      handleAction(
                        "selected",
                        "Select This Candidate",
                        `Proceed to select ${rec.recommendedUserName || "this candidate"} after review? An application will be created or linked.`,
                        "Yes, Select",
                        "bg-emerald-600 hover:bg-emerald-500"
                      )
                    }
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 hover:border-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    Select Candidate
                  </button>
                  <button
                    disabled={isLoading}
                    onClick={() =>
                      handleAction(
                        "rejected",
                        "Reject After Review",
                        `Reject ${rec.recommendedUserName || "this candidate"} after review?`,
                        "Confirm Reject",
                        "bg-red-600 hover:bg-red-500"
                      )
                    }
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30 hover:border-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="h-3 w-3" />
                    Reject
                  </button>
                </>
              )}
            </div>
          )}
          {rec.status === "rejected" && (
            <p className="text-[10px] text-red-400/70 italic">
              This referral has been rejected and no further actions are available.
            </p>
          )}
          {rec.status === "selected" && (
            <p className="text-[10px] text-emerald-400/70 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Candidate selected — application created/linked automatically.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// AI Match Card
// ─────────────────────────────────────────────

interface AIMatchCardProps {
  match: AIMatch;
  rank: number;
  onUpdateStatus: (match: AIMatch) => void;
}

function AIMatchCard({ match, rank, onUpdateStatus }: AIMatchCardProps) {
  const colors = getScoreColor(match.score);

  return (
    <div className="relative rounded-2xl border border-slate-200/60 bg-slate-50 backdrop-blur-sm hover:bg-slate-100/80 hover:border-white/20 transition-all duration-300 overflow-hidden">
      {/* Rank badge */}
      <div
        className={`absolute top-4 right-4 h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black ${
          rank === 1
            ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
            : rank === 2
            ? "bg-white/10 border border-white/20 text-slate-900/60"
            : rank === 3
            ? "bg-orange-500/15 border border-orange-500/30 text-orange-400"
            : "bg-slate-100/50 border border-slate-200/60 text-slate-900/40"
        }`}
      >
        #{rank}
      </div>

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3 pr-12">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-emerald-600/25 flex items-center justify-center shrink-0">
            <span className="text-sm font-black text-emerald-600">
              {(match.fullName || "?").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-slate-900 truncate">{match.fullName}</h3>
            <p className="text-[11px] text-slate-900/50 flex items-center gap-1.5 mt-0.5">
              <Mail className="h-3 w-3 shrink-0" />
              {match.email}
            </p>
            <span
              className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide ${getAppStatusColor(
                match.status
              )}`}
            >
              {match.status}
            </span>
          </div>
        </div>

        {/* Score bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3 text-slate-900/40" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900/40">
                AI Match Score
              </span>
            </div>
            <span className={`text-lg font-black tabular-nums ${colors.text}`}>
              {match.score}
              <span className="text-xs text-slate-900/30 font-medium">/100</span>
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full ${colors.bar} shadow-sm ${colors.glow} transition-all duration-700`}
              style={{ width: `${match.score}%` }}
            />
          </div>
          <p className="text-[9px] text-slate-900/30">
            {match.score >= 70
              ? "Strong match — highly recommended"
              : match.score >= 40
              ? "Moderate match — worth reviewing"
              : "Weak match — may not meet requirements"}
          </p>
        </div>

        {/* Match Reasons */}
        {match.reasons && match.reasons.length > 0 && (
          <div className="rounded-xl bg-white/4 border border-white/8 p-3 space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-900/40 flex items-center gap-1">
              <Zap className="h-2.5 w-2.5 text-amber-400" />
              Match Reasons
            </p>
            <ul className="space-y-1">
              {match.reasons.map((r, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-1.5 text-[11px] text-slate-900/60 leading-relaxed"
                >
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-600/60 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {match.resumeUrl ? (
            <a
              href={match.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100/50 border border-slate-200/60 text-slate-900/60 hover:bg-white/10 hover:text-slate-900 hover:border-white/20 transition-all"
            >
              <ExternalLink className="h-3 w-3" />
              View Resume
            </a>
          ) : (
            <span className="text-[10px] text-slate-900/25 italic">No resume uploaded</span>
          )}
          <button
            onClick={() => onUpdateStatus(match)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-600/25 border border-emerald-600/35 text-emerald-500 hover:bg-emerald-700/40 hover:border-emerald-600/55 transition-all"
          >
            <SlidersHorizontal className="h-3 w-3" />
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main RecommendationsPanel Component
// ─────────────────────────────────────────────

export default function RecommendationsPanel() {
  const [activeTab, setActiveTab] = useState<"referrals" | "ai">("referrals");

  // ── Referrals tab state ──────────────────
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // ── AI tab state ─────────────────────────
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [aiMatches, setAiMatches] = useState<AIMatch[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [statusUpdateModal, setStatusUpdateModal] = useState<{
    open: boolean;
    match: AIMatch | null;
  }>({ open: false, match: null });
  const [updatingAppStatus, setUpdatingAppStatus] = useState(false);

  // ── Stats (derived) ──────────────────────
  const stats = {
    total: recommendations.length,
    pending: recommendations.filter((r) => r.status === "pending").length,
    reviewed: recommendations.filter((r) => r.status === "reviewed").length,
    selected: recommendations.filter((r) => r.status === "selected").length,
    rejected: recommendations.filter((r) => r.status === "rejected").length,
  };

  // Load referrals
  const loadRecommendations = useCallback(async (filterStatus?: string) => {
    try {
      setLoadingRecs(true);
      const res = await getAllRecommendationsAction(filterStatus || undefined);
      if (res.success && res.data) {
        setRecommendations(res.data as Recommendation[]);
      } else {
        setRecommendations([]);
      }
    } catch {
      toast.error("Failed to load referrals");
      setRecommendations([]);
    } finally {
      setLoadingRecs(false);
    }
  }, []);

  // Load jobs list
  const loadJobs = useCallback(async () => {
    try {
      setJobsLoading(true);
      const res = await getJobsAction();
      if (res.success && res.data) {
        setJobs(res.data as Job[]);
      }
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
    loadJobs();
  }, [loadRecommendations, loadJobs]);

  // Re-fetch when status filter changes
  useEffect(() => {
    loadRecommendations(statusFilter);
  }, [statusFilter, loadRecommendations]);

  // Run AI matching when job selected
  const handleJobSelect = async (jobId: string) => {
    setSelectedJobId(jobId);
    setAiMatches([]);
    if (!jobId) return;
    try {
      setLoadingAI(true);
      const res = await getAIRecommendationsAction(jobId);
      if (res.success && res.data) {
        setAiMatches(res.data as AIMatch[]);
        if (res.data.length === 0) {
          toast.info("No candidates found for this job yet");
        }
      } else {
        toast.error(res.message || "AI matching failed");
        setAiMatches([]);
      }
    } catch {
      toast.error("AI matching engine error");
      setAiMatches([]);
    } finally {
      setLoadingAI(false);
    }
  };

  // Handle referral status update
  const handleUpdateRecStatus = async (
    id: string,
    status: "reviewed" | "selected" | "rejected",
    notes?: string
  ) => {
    try {
      setActionLoadingId(id);
      const res = await updateRecommendationStatusAction(id, status, notes);
      if (res.success) {
        toast.success(res.message || `Status updated to ${status}`);
        await loadRecommendations(statusFilter);
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch {
      toast.error("Operation failed. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle AI match — application status update
  const handleAppStatusUpdate = async (
    newStatus: ApplicationStatus,
    comments: string
  ) => {
    const match = statusUpdateModal.match;
    if (!match) return;
    try {
      setUpdatingAppStatus(true);
      const res = await updateApplicationStatusAction(match.applicationId, newStatus, comments);
      if (res.success) {
        toast.success(res.message || "Application status updated");
        // Optimistically update local state
        setAiMatches((prev) =>
          prev.map((m) =>
            m.applicationId === match.applicationId ? { ...m, status: newStatus } : m
          )
        );
        setStatusUpdateModal({ open: false, match: null });
      } else {
        toast.error(res.message || "Failed to update application status");
      }
    } catch {
      toast.error("Status update failed");
    } finally {
      setUpdatingAppStatus(false);
    }
  };

  // Filter recommendations by search
  const filteredRecs = recommendations.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.recommendedUserName || "").toLowerCase().includes(q) ||
      (r.recommendedUserEmail || "").toLowerCase().includes(q) ||
      (r.recommender?.name || "").toLowerCase().includes(q) ||
      (r.recommender?.email || "").toLowerCase().includes(q) ||
      (r.jobId?.title || "").toLowerCase().includes(q)
    );
  });

  const selectedJob = jobs.find((j) => j._id === selectedJobId);

  return (
    <>
      {/* Status Update Modal */}
      {statusUpdateModal.open && statusUpdateModal.match && (
        <StatusUpdateModal
          open={statusUpdateModal.open}
          candidateName={statusUpdateModal.match.fullName}
          currentStatus={statusUpdateModal.match.status}
          onConfirm={(newStatus, comments) => handleAppStatusUpdate(newStatus, comments)}
          onCancel={() => setStatusUpdateModal({ open: false, match: null })}
        />
      )}

      <div className="space-y-6 max-w-7xl mx-auto">
        {/* ── Page Header ─────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-indigo-600/25 border border-emerald-600/35 flex items-center justify-center">
                <Star className="h-4 w-4 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                AI Recommendations &amp;{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                  Referral Management
                </span>
              </h1>
            </div>
            <p className="text-sm text-slate-900/40 pl-11.5">
              Manage employee referrals and run AI-powered candidate matching across job openings
            </p>
          </div>
          <button
            onClick={() => {
              loadRecommendations(statusFilter);
              if (selectedJobId) handleJobSelect(selectedJobId);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100/50 border border-slate-200/60 text-slate-900/60 hover:bg-white/10 hover:text-slate-900 transition-all shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Data
          </button>
        </div>

        {/* ── Stats Row ─────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Referrals", value: stats.total, color: "text-white", bg: "bg-slate-100/50 border-slate-200/60" },
            { label: "Pending Review", value: stats.pending, color: "text-amber-300", bg: "bg-amber-500/8 border-amber-500/20" },
            { label: "Selected", value: stats.selected, color: "text-emerald-300", bg: "bg-emerald-500/8 border-emerald-500/20" },
            { label: "Rejected", value: stats.rejected, color: "text-red-300", bg: "bg-red-500/8 border-red-500/20" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-2xl border ${bg} backdrop-blur-sm p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-900/40">{label}</p>
              <p className={`text-3xl font-black tabular-nums mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ──────────────────────────────────── */}
        <div className="border-b border-slate-200/60">
          <div className="flex gap-0">
            {(
              [
                { key: "referrals", label: "Employee Referrals", icon: Users },
                { key: "ai", label: "AI Job Matching", icon: Bot },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-bold transition-colors ${
                  activeTab === key
                    ? "text-emerald-600"
                    : "text-slate-900/40 hover:text-slate-900/70"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {activeTab === key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            TAB 1: EMPLOYEE REFERRALS
        ═══════════════════════════════════════════ */}
        {activeTab === "referrals" && (
          <div className="space-y-5">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-900/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, job title..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border border-slate-200/60 rounded-xl text-sm text-slate-900 placeholder:text-slate-900/30 focus:outline-none focus:border-emerald-600/50 focus:bg-slate-200/40 transition"
                />
              </div>
              {/* Status Filter */}
              <div className="relative sm:w-48">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-900/30" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-100/50 border border-slate-200/60 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-600/50 transition appearance-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-900/30 pointer-events-none" />
              </div>
            </div>

            {/* Content */}
            {loadingRecs ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                <p className="text-sm text-slate-900/40">Loading referrals...</p>
              </div>
            ) : filteredRecs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="h-16 w-16 rounded-2xl bg-slate-100/50 border border-slate-200/60 flex items-center justify-center">
                  <Users className="h-7 w-7 text-slate-900/20" />
                </div>
                <p className="text-base font-bold text-slate-900/40">No referrals found</p>
                <p className="text-sm text-slate-900/25 text-center max-w-sm">
                  {searchQuery || statusFilter
                    ? "No referrals match your current filters. Try adjusting your search."
                    : "No employee referrals have been submitted yet."}
                </p>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-slate-900/35 font-medium">
                  Showing {filteredRecs.length} of {recommendations.length} referral
                  {recommendations.length !== 1 ? "s" : ""}
                </p>
                <div className="space-y-4">
                  {filteredRecs.map((rec) => (
                    <ReferralCard
                      key={rec._id}
                      rec={rec}
                      onAction={handleUpdateRecStatus}
                      loadingId={actionLoadingId}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TAB 2: AI JOB MATCHING
        ═══════════════════════════════════════════ */}
        {activeTab === "ai" && (
          <div className="space-y-5">
            {/* Job Selector */}
            <div className="rounded-2xl border border-emerald-600/20 bg-emerald-600/5 backdrop-blur-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-black text-white">Select Job Opening</h2>
                <span className="text-[10px] text-emerald-600/60 font-medium ml-1">
                  — AI will rank all applicants for the chosen role
                </span>
              </div>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-900/30" />
                <select
                  value={selectedJobId}
                  onChange={(e) => handleJobSelect(e.target.value)}
                  disabled={jobsLoading}
                  className="w-full pl-10 pr-10 py-3 bg-slate-100/50 border border-slate-200/60 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-600/50 transition appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {jobsLoading ? "Loading jobs..." : "— Choose a job opening —"}
                  </option>
                  {jobs.map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.title}
                      {job.department ? ` · ${job.department}` : ""}
                      {job.isActive === false ? " (Archived)" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-900/30 pointer-events-none" />
              </div>
              {selectedJob && (
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {selectedJob.department && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-600/10 border border-emerald-600/20 text-violet-300 font-medium">
                      {selectedJob.department}
                    </span>
                  )}
                  {selectedJob.location && (
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-medium">
                      {selectedJob.location}
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-full border font-medium ${
                      selectedJob.isActive !== false
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                        : "bg-red-500/10 border-red-500/20 text-red-300"
                    }`}
                  >
                    {selectedJob.isActive !== false ? "Active" : "Archived"}
                  </span>
                </div>
              )}
            </div>

            {/* AI Results */}
            {!selectedJobId && !loadingAI && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="relative">
                  <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-emerald-700/20 border border-emerald-600/25 flex items-center justify-center">
                    <Bot className="h-9 w-9 text-emerald-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Zap className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="text-center space-y-1.5 max-w-md">
                  <p className="text-base font-black text-white">AI Matching Engine Ready</p>
                  <p className="text-sm text-slate-900/40 leading-relaxed">
                    Select a job opening above to analyse all applicants using our semantic
                    heuristics engine. Candidates will be ranked by skill match, keyword
                    overlap, experience, and referral status.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center text-[10px]">
                  {["Skill Matching (40pts)", "Keyword Overlap (30pts)", "Experience (15pts)", "Referral Boost (15pts)"].map(
                    (label) => (
                      <span
                        key={label}
                        className="px-3 py-1.5 rounded-full bg-slate-100/50 border border-slate-200/60 text-slate-900/50 font-medium"
                      >
                        {label}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {loadingAI && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-600/20 border border-emerald-600/30 flex items-center justify-center">
                    <Bot className="h-7 w-7 text-emerald-600" />
                  </div>
                  <Loader2 className="absolute -bottom-1 -right-1 h-6 w-6 text-emerald-600 animate-spin" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-white">Running AI Analysis...</p>
                  <p className="text-xs text-slate-900/40">
                    Evaluating all applicants against job requirements
                  </p>
                </div>
              </div>
            )}

            {!loadingAI && selectedJobId && aiMatches.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="h-14 w-14 rounded-2xl bg-slate-100/50 border border-slate-200/60 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-slate-900/20" />
                </div>
                <p className="text-sm font-bold text-slate-900/40">No Applicants Found</p>
                <p className="text-xs text-slate-900/25 text-center max-w-sm">
                  There are no applications yet for this job opening. Share the job posting
                  to start receiving candidates.
                </p>
              </div>
            )}

            {!loadingAI && aiMatches.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-900/35 font-medium">
                    {aiMatches.length} candidate{aiMatches.length !== 1 ? "s" : ""} ranked
                    — sorted by AI match score (highest first)
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-900/30">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      &lt;40 Weak
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      40–70 Moderate
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      &gt;70 Strong
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {aiMatches.map((match, idx) => (
                    <AIMatchCard
                      key={match.applicationId}
                      match={match}
                      rank={idx + 1}
                      onUpdateStatus={(m) =>
                        setStatusUpdateModal({ open: true, match: m })
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
