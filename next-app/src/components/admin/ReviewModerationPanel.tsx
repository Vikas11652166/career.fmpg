"use client";

import React, { useState, useEffect } from "react";
import { 
  Star, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock,
  ThumbsUp, 
  ThumbsDown,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { getAllReviewsAction, updateReviewStatusAction } from "@/app/actions/admin";

interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  } | null;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  content: string;
  department?: string;
  position?: string;
  workType?: string;
  employmentDuration?: string;
  pros?: string;
  cons?: string;
  advice?: string;
  isAnonymous: boolean;
  status: "pending" | "approved" | "rejected";
  moderatorNotes?: string;
  createdAt: string;
}

interface ReviewModerationPanelProps {
  initialData: {
    reviews: Review[];
    total: number;
    page: number;
    limit: number;
  } | null;
}

export default function ReviewModerationPanel({ initialData }: ReviewModerationPanelProps) {
  const [reviews, setReviews] = useState<Review[]>(initialData?.reviews ?? []);
  const [total, setTotal] = useState(initialData?.total ?? 0);
  const [page, setPage] = useState(initialData?.page ?? 1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState("");
  const [moderating, setModerating] = useState(false);

  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  const fetchReviews = async (p = page, status = statusFilter) => {
    setLoading(true);
    try {
      const res = await getAllReviewsAction({
        page: p,
        limit,
        status: status || undefined,
      });

      if (res.success && res.data) {
        setReviews(res.data.reviews);
        setTotal(res.data.total);
      } else {
        toast.error("Failed to load reviews list");
      }
    } catch (err: any) {
      toast.error(err.message || "Error loading reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1, statusFilter);
    setPage(1);
  }, [statusFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchReviews(newPage, statusFilter);
  };

  const handleModerate = async (reviewId: string, status: "approved" | "rejected") => {
    setModerating(true);
    try {
      const res = await updateReviewStatusAction(reviewId, status, moderatorNotes || undefined);
      if (res.success) {
        toast.success(res.message);
        setSelectedReview(null);
        setModeratorNotes("");
        fetchReviews(page, statusFilter);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit moderation decision");
    } finally {
      setModerating(false);
    }
  };

  const getStatusBadge = (status: Review["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle className="h-3 w-3" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-black uppercase tracking-wider text-foreground">
            Review <span className="text-emerald-600">Moderation</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Moderate workplace testimonials and surveys submitted by employees and candidates.
          </p>
        </div>
        <button
          onClick={() => fetchReviews(page, statusFilter)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/75 text-foreground rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-300 border border-border/40 disabled:opacity-50 cursor-pointer self-start md:self-auto shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter and Stats Panel */}
      <div className="bg-card border border-border/40 rounded-2xl p-5 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:inline">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none bg-background border border-border/40 rounded-xl px-4 py-2.5 text-foreground text-xs font-bold uppercase tracking-wider focus:border-primary outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground border-t border-border/20 pt-4 md:border-none md:pt-0 w-full md:w-auto justify-end">
          <span>Total Testimonials: <span className="text-foreground font-black">{total}</span></span>
        </div>
      </div>

      {/* Main Reviews Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
          <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Loading reviews...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-24 bg-card border border-border/40 rounded-2xl p-8 text-center backdrop-blur-xl shadow-sm">
          <MessageSquare className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-bold text-foreground mb-1">No Reviews Found</h3>
          <p className="text-muted-foreground text-xs max-w-sm mx-auto leading-relaxed">
            There are currently no reviews matching your status filters. Check back later or clear your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <div 
              key={review._id} 
              className="bg-card border border-border/40 hover:border-primary/20 rounded-2xl p-6 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between shadow-sm relative group"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest block mb-1">
                      {review.department || "No Department"} • {review.position || "Staff"}
                    </span>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{review.title}</h3>
                  </div>
                  {getStatusBadge(review.status)}
                </div>

                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${
                        s <= review.rating ? "text-amber-500 fill-amber-500" : "text-border"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3 mb-4">
                  {review.content}
                </p>

                {/* Micro details */}
                <div className="grid grid-cols-2 gap-3 text-[10px] text-muted-foreground border-t border-border/20 pt-4 mb-4">
                  <div>
                    <span className="font-bold text-muted-foreground uppercase tracking-widest block">Author</span>
                    <span className="text-foreground/80">{review.isAnonymous ? "Anonymous" : review.userName}</span>
                  </div>
                  <div>
                    <span className="font-bold text-muted-foreground uppercase tracking-widest block">Submitted On</span>
                    <span className="text-foreground/80">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-border/20">
                <button
                  onClick={() => {
                    setSelectedReview(review);
                    setModeratorNotes(review.moderatorNotes || "");
                  }}
                  className="flex-1 py-2.5 bg-muted hover:bg-muted/70 text-foreground rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-border/40 shadow-sm"
                >
                  <Eye className="h-3.5 w-3.5 text-emerald-650" /> Inspect Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-card border border-border/40 rounded-2xl px-6 py-4 backdrop-blur-xl shadow-sm">
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="p-2 bg-muted border border-border/30 rounded-xl hover:bg-muted/70 disabled:opacity-50 disabled:cursor-not-allowed text-foreground transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="p-2 bg-muted border border-border/30 rounded-xl hover:bg-muted/70 disabled:opacity-50 disabled:cursor-not-allowed text-foreground transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Inspection Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-border/40 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl flex flex-col justify-between text-foreground">
            <div className="p-6 md:p-8 border-b border-border/20 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest block mb-1">
                  Testimonial Verification Detail
                </span>
                <h3 className="font-heading text-lg md:text-xl font-black text-foreground">
                  Inspect Testimony
                </h3>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="h-8 w-8 rounded-full border border-border/30 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Meta details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/40 border border-border/20 rounded-2xl p-4 text-[10px]">
                <div>
                  <span className="text-muted-foreground font-bold uppercase tracking-wider block mb-1">Role</span>
                  <span className="text-foreground font-semibold">{selectedReview.position || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold uppercase tracking-wider block mb-1">Department</span>
                  <span className="text-foreground font-semibold">{selectedReview.department || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold uppercase tracking-wider block mb-1">Work Type</span>
                  <span className="text-foreground font-semibold">{selectedReview.workType || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold uppercase tracking-wider block mb-1">Duration</span>
                  <span className="text-foreground font-semibold">{selectedReview.employmentDuration || "N/A"}</span>
                </div>
              </div>

              {/* Review Content */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Review Summary</h4>
                <div className="bg-background border border-border/40 rounded-2xl p-5">
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= selectedReview.rating ? "text-amber-500 fill-amber-500" : "text-border"
                        }`}
                      />
                    ))}
                  </div>
                  <h3 className="font-semibold text-foreground text-base mb-2">{selectedReview.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedReview.content}</p>
                </div>
              </div>

              {/* Pros and Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl p-5">
                  <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
                    <ThumbsUp className="h-3.5 w-3.5" /> Pros
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedReview.pros || "None highlighted"}</p>
                </div>
                <div className="bg-rose-500/[0.03] border border-rose-500/10 rounded-2xl p-5">
                  <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-rose-600 mb-2">
                    <ThumbsDown className="h-3.5 w-3.5" /> Cons
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedReview.cons || "None highlighted"}</p>
                </div>
              </div>

              {/* Advice */}
              {selectedReview.advice && (
                <div className="bg-background border border-border/40 rounded-2xl p-5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" /> Advice to Management
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedReview.advice}</p>
                </div>
              )}

              {/* Internal credentials check */}
              <div className="bg-muted/60 border border-border/20 rounded-2xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Verification Integrity</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase block">Submitter Name</span>
                    <span className="text-foreground font-semibold">{selectedReview.userName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase block">Submitter Email</span>
                    <span className="text-foreground font-semibold">{selectedReview.userEmail}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase block">Display Status</span>
                    <span className="text-muted-foreground font-medium">
                      {selectedReview.isAnonymous ? "🚨 Anonymous submission on public directories" : "Name visible on public directories"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Moderator notes box */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Moderator Notes / Rejection Reason
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes are visible internally or attached to rejection notices..."
                  value={moderatorNotes}
                  onChange={(e) => setModeratorNotes(e.target.value)}
                  className="w-full bg-background border border-border/40 rounded-2xl px-4 py-3 text-foreground text-xs focus:border-primary transition-all outline-none resize-none placeholder:text-muted-foreground/45"
                />
              </div>
            </div>

            <div className="p-6 md:p-8 bg-muted/60 border-t border-border/20 flex justify-end gap-3 rounded-b-3xl">
              <button
                onClick={() => setSelectedReview(null)}
                className="px-5 py-2.5 bg-muted border border-border/40 hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {selectedReview.status !== "rejected" && (
                <button
                  onClick={() => handleModerate(selectedReview._id, "rejected")}
                  disabled={moderating}
                  className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  {moderating ? "Processing..." : "Reject"}
                </button>
              )}

              {selectedReview.status !== "approved" && (
                <button
                  onClick={() => handleModerate(selectedReview._id, "approved")}
                  disabled={moderating}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-555 text-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md shadow-emerald-600/10 cursor-pointer disabled:opacity-50"
                >
                  {moderating ? "Processing..." : "Approve & Publish"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
