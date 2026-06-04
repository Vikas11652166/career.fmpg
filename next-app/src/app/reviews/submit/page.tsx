"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, MessageSquare, AlertCircle, ArrowLeft, Loader2, Sparkles, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { checkReviewEligibilityAction, submitReviewAction, getUserReviewAction } from "@/app/actions/reviews";

export default function SubmitReviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState<any>(null);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    department: "",
    position: "",
    workType: "On-site" as "Remote" | "On-site" | "Hybrid",
    employmentDuration: "",
    pros: "",
    cons: "",
    advice: "",
    isAnonymous: false,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const eligRes = await checkReviewEligibilityAction();
        setEligibility(eligRes);

        if (eligRes.eligible) {
          const revRes = await getUserReviewAction();
          if (revRes.success && revRes.review) {
            setExistingReview(revRes.review);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load review workspace details");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Please enter a review title");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("Please write a description of your experience");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitReviewAction({
        rating,
        ...formData,
      });

      if (res.success) {
        toast.success(res.message);
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-6 relative overflow-hidden">
        {/* Background grids and glowing decorations */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(5,150,105,0.05),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
        <p className="mt-4 text-muted-foreground font-medium">Verifying review credentials...</p>
      </main>
    );
  }

  // Not eligible
  if (!eligibility || !eligibility.eligible) {
    return (
      <main className="min-h-screen bg-background text-foreground p-6 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.03),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

        <div className="max-w-md w-full bg-card/90 backdrop-blur-xl border border-rose-500/10 rounded-2xl p-8 text-center shadow-lg relative z-10">
          <div className="mx-auto h-16 w-16 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 border border-rose-500/20 mb-6">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-2xl font-black mb-4">Access Restricted</h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            {eligibility?.message || "Only active/former employees or verified candidates with accepted/pending offer letters are eligible to leave workplace reviews."}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border border-border/40 shadow-sm"
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Existing Review Submitted
  if (existingReview) {
    return (
      <main className="min-h-screen bg-background text-foreground p-6 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(5,150,105,0.05),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

        <div className="max-w-lg w-full bg-card/90 backdrop-blur-xl border border-emerald-500/10 rounded-2xl p-8 shadow-lg relative z-10">
          <div className="mx-auto h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-500/20 mb-6">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-2xl font-black text-center mb-2">Review Already Submitted</h1>
          <p className="text-muted-foreground text-sm text-center mb-6 leading-relaxed">
            You have already submitted a survey for FMPG Careers. Our moderation team is currently reviewing your testimonial submission.
          </p>

          <div className="bg-muted/40 border border-border/40 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-muted-foreground">Submitted Review</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${
                      s <= existingReview.rating ? "text-amber-500 fill-amber-500" : "text-border"
                    }`}
                  />
                ))}
              </div>
            </div>
            <h3 className="font-semibold text-foreground mb-1">{existingReview.title}</h3>
            <p className="text-xs text-muted-foreground mb-3">{existingReview.content}</p>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground/60 border-t border-border/30 pt-3">
              <div>
                <span className="font-bold text-muted-foreground">Department:</span> {existingReview.department || "N/A"}
              </div>
              <div>
                <span className="font-bold text-muted-foreground">Position:</span> {existingReview.position || "N/A"}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex-1 py-3 bg-muted hover:bg-muted/80 border border-border/40 text-foreground rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300"
            >
              Go Home
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-550 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md shadow-emerald-600/10"
            >
              My Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden pt-28">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(5,150,105,0.03),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(245,158,11,0.02),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-emerald-600 mb-6 transition-colors duration-300 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-black uppercase tracking-wider flex items-center gap-3">
              Share Your <span className="text-emerald-600">Feedback</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Help prospective applicants learn about careers at FMPG. All reviews are subject to verification.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 self-start md:self-auto">
            <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Eligible: {eligibility.reviewerType === "employee" ? "Employee" : "Candidate"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating Deck */}
          <div className="bg-card border border-border/40 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Overall Rating *</h2>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors duration-300 cursor-pointer"
                >
                  <Star
                    className={`h-8 w-8 transition-all duration-300 ${
                      star <= (hoverRating || rating)
                        ? "text-amber-500 fill-amber-500 scale-110"
                        : "text-muted/30 scale-100"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-4 text-xs font-semibold text-muted-foreground tracking-wider">
                {rating === 1 && "Terrible"}
                {rating === 2 && "Needs Improvement"}
                {rating === 3 && "Average"}
                {rating === 4 && "Great Experience"}
                {rating === 5 && "Industry Leading"}
              </span>
            </div>
          </div>

          {/* Core Questionnaire */}
          <div className="bg-card border border-border/40 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/20 pb-3">
              Review Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-background border border-border/40 rounded-xl px-4 py-3 text-foreground text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                >
                  <option value="">Select Department</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product Management</option>
                  <option value="Design">UI/UX Design</option>
                  <option value="Marketing">Marketing & Communication</option>
                  <option value="Sales">Sales & Business Development</option>
                  <option value="HR">Human Resources</option>
                  <option value="Operations">Operations & Logistics</option>
                  <option value="Coliving">Coliving & Hospitality</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Your Position
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Software Engineer"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full bg-background border border-border/40 rounded-xl px-4 py-3 text-foreground text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none placeholder:text-muted-foreground/45"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Work Environment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["On-site", "Remote", "Hybrid"] as const).map((w) => (
                    <button
                      type="button"
                      key={w}
                      onClick={() => setFormData({ ...formData, workType: w })}
                      className={`py-2.5 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                        formData.workType === w
                          ? "bg-emerald-600/10 border-emerald-500 text-emerald-600 shadow-sm"
                          : "bg-background border-border/40 text-muted-foreground hover:border-border"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Employment Duration
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1 year, 6 months"
                  value={formData.employmentDuration}
                  onChange={(e) => setFormData({ ...formData, employmentDuration: e.target.value })}
                  className="w-full bg-background border border-border/40 rounded-xl px-4 py-3 text-foreground text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none placeholder:text-muted-foreground/45"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Review Headline *
              </label>
              <input
                type="text"
                placeholder="Summarize your experience in one sentence"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full bg-background border border-border/40 rounded-xl px-4 py-3 text-foreground text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none placeholder:text-muted-foreground/45"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Detailed Experience *
              </label>
              <textarea
                rows={5}
                placeholder="What was it like working or interviewing here? Discuss the culture, responsibilities, and support."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                className="w-full bg-background border border-border/40 rounded-xl px-4 py-3 text-foreground text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none placeholder:text-muted-foreground/45 resize-none"
              />
            </div>
          </div>

          {/* Pros, Cons, Advice */}
          <div className="bg-card border border-border/40 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border/20 pb-3">
              Pros & Cons
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
                Pros (Highlights)
              </label>
              <textarea
                rows={3}
                placeholder="What are the best parts about FMPG? (e.g. flexible hours, team bonding, compensation)"
                value={formData.pros}
                onChange={(e) => setFormData({ ...formData, pros: e.target.value })}
                className="w-full bg-background border border-border/40 rounded-xl px-4 py-3 text-foreground text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none placeholder:text-muted-foreground/45 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">
                Cons (Room for Improvement)
              </label>
              <textarea
                rows={3}
                placeholder="What are the challenges or limitations? (e.g. work-life balance, career pathways)"
                value={formData.cons}
                onChange={(e) => setFormData({ ...formData, cons: e.target.value })}
                className="w-full bg-background border border-border/40 rounded-xl px-4 py-3 text-foreground text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none placeholder:text-muted-foreground/45 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Advice to Management
              </label>
              <textarea
                rows={2}
                placeholder="Constructive feedback for leadership (optional)"
                value={formData.advice}
                onChange={(e) => setFormData({ ...formData, advice: e.target.value })}
                className="w-full bg-background border border-border/40 rounded-xl px-4 py-3 text-foreground text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none placeholder:text-muted-foreground/45 resize-none"
              />
            </div>
          </div>

          {/* Anonymity Controls */}
          <div className="bg-card border border-border/40 rounded-2xl p-6 md:p-8 shadow-sm flex items-start gap-4">
            <div className="flex items-center h-5 mt-1">
              <input
                id="isAnonymous"
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                className="h-4 w-4 bg-background border-border/40 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="isAnonymous" className="block text-sm font-bold text-foreground/80 cursor-pointer">
                Submit Anonymously
              </label>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                When checked, your name will be displayed as "Anonymous" on the public reviews listing page. However, your review is still verified for legitimacy internally.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-550 disabled:bg-emerald-700/50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-600/10 flex items-center gap-2.5 transition-all duration-300 hover:scale-[1.01]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" /> Submit Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
