"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  X, 
  ChevronDown, 
  Info,
  Calendar,
  Briefcase,
  ExternalLink
} from "lucide-react";

interface JobUpdateDetails {
  jobTitle?: string;
  oldRequirements?: string[];
  newRequirements?: string[];
  oldResponsibilities?: string[];
  newResponsibilities?: string[];
  changedFields?: string[];
  updateType?: "requirements" | "responsibilities" | "both" | "other";
}

interface Notification {
  _id: string;
  type: "job_update" | "application_status" | "system";
  title: string;
  message: string;
  relatedJobId?: {
    _id: string;
    title: string;
    slug: string;
  } | null;
  relatedApplicationId?: string;
  isRead: boolean;
  jobUpdateDetails?: JobUpdateDetails;
  priority: "low" | "medium" | "high";
  createdAt: string;
}

interface JobUpdateNotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

export default function JobUpdateNotificationCard({ 
  notification, 
  onMarkAsRead, 
  onDismiss 
}: JobUpdateNotificationCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleToggleDetails = () => {
    setShowDetails(!showDetails);
    if (!notification.isRead) {
      onMarkAsRead(notification._id);
    }
  };

  const handleViewJob = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification._id);
    }
  };

  const getUpdateTypeIcon = (updateType?: string) => {
    switch (updateType) {
      case "requirements":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "responsibilities":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "both":
        return <AlertTriangle className="h-5 w-5 text-rose-500" />;
      default:
        return <Info className="h-5 w-5 text-slate-400" />;
    }
  };

  const renderChangesList = (oldItems?: string[], newItems?: string[], title?: string) => {
    if (!Array.isArray(oldItems) || !Array.isArray(newItems)) return null;

    const oldSet = new Set(oldItems);
    const newSet = new Set(newItems);

    const added = newItems.filter(item => !oldSet.has(item));
    const removed = oldItems.filter(item => !newSet.has(item));
    const unchanged = oldItems.filter(item => newSet.has(item));

    if (added.length === 0 && removed.length === 0) return null;

    return (
      <div className="space-y-3">
        <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title} Changes:</h5>
        
        {added.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-emerald-400">✓ Added:</span>
            <ul className="list-disc list-inside ml-2 space-y-1 text-xs text-slate-300 bg-emerald-950/20 border border-emerald-500/10 rounded-xl p-2.5">
              {added.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {removed.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-rose-400">✗ Removed:</span>
            <ul className="list-disc list-inside ml-2 space-y-1 text-xs text-slate-350 bg-rose-950/20 border border-rose-500/10 rounded-xl p-2.5">
              {removed.map((item, idx) => (
                <li key={idx} className="leading-relaxed line-through text-slate-500">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {unchanged.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500">○ Unchanged:</span>
            <ul className="list-disc list-inside ml-2 space-y-0.5 text-[11px] text-slate-500">
              {unchanged.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`bg-white/5 border border-white/10 hover:border-white/15 rounded-2xl p-5 backdrop-blur-xl transition-all duration-300 border-l-4 ${
        !notification.isRead 
          ? notification.priority === "high"
            ? "border-l-amber-500 bg-amber-950/5"
            : "border-l-blue-500 bg-blue-950/5"
          : "border-l-slate-700"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 ${
          notification.priority === "high" 
            ? "bg-amber-500/10 border-amber-500/20" 
            : "bg-blue-500/10 border-blue-500/20"
        }`}>
          {getUpdateTypeIcon(notification.jobUpdateDetails?.updateType)}
        </div>

        <div className="flex-grow space-y-3">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className={`font-semibold text-sm leading-snug ${
                !notification.isRead ? "text-white" : "text-slate-300"
              }`}>
                {notification.title}
              </h3>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                <Calendar className="h-3.5 w-3.5" /> {new Date(notification.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {notification.priority === "high" && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  High
                </span>
              )}
              {!notification.isRead && (
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
              )}
            </div>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed">
            {notification.message}
          </p>

          {notification.relatedJobId && (
            <div>
              <Link 
                href={`/jobs/${notification.relatedJobId.slug || notification.relatedJobId._id}`}
                onClick={handleViewJob}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-950/30 text-blue-300 border border-blue-500/15 hover:bg-blue-900/20 transition-all"
              >
                <Briefcase className="h-3.5 w-3.5" />
                View Job: {notification.relatedJobId.title} <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* Expanded detailed changes list */}
          {notification.jobUpdateDetails && (
            <div className="space-y-3 pt-2">
              <button
                onClick={handleToggleDetails}
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-400 hover:text-blue-350 transition-colors cursor-pointer"
              >
                <span>{showDetails ? "Hide Changes Feed" : "Expand Changes Feed"}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${showDetails ? "rotate-180" : ""}`} />
              </button>

              {showDetails && (
                <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Info className="h-3.5 w-3.5" /> Change Analysis
                  </h4>

                  {(notification.jobUpdateDetails.updateType === "requirements" || notification.jobUpdateDetails.updateType === "both") && 
                    renderChangesList(
                      notification.jobUpdateDetails.oldRequirements,
                      notification.jobUpdateDetails.newRequirements,
                      "Requirements"
                    )
                  }

                  {(notification.jobUpdateDetails.updateType === "responsibilities" || notification.jobUpdateDetails.updateType === "both") && 
                    renderChangesList(
                      notification.jobUpdateDetails.oldResponsibilities,
                      notification.jobUpdateDetails.newResponsibilities,
                      "Responsibilities"
                    )
                  }

                  <div className="bg-blue-950/20 border border-blue-500/10 rounded-2xl p-3.5 space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                      Recommended Steps
                    </h5>
                    <ul className="text-[11px] text-blue-300/80 space-y-1 list-disc list-inside leading-relaxed">
                      <li>Read updated parameters and responsibilities carefully.</li>
                      {notification.jobUpdateDetails.updateType === "requirements" && (
                        <li>Consider updating your resume or qualifications in your application to fit the new requirements.</li>
                      )}
                      <li>Keep tracking your application dashboard status.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => onDismiss(notification._id)}
          className="p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-rose-450 transition-colors cursor-pointer shrink-0"
          title="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
