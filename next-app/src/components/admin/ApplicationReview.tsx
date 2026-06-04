"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  MapPin,
  ClipboardCheck,
  FileCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  ChevronRight,
  Info,
  DollarSign,
  Plus,
  BadgeAlert,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateApplicationStatusAction } from "@/app/actions/applications";
import { issueOfferLetterAction } from "@/app/actions/admin";
import { toast } from "sonner";

interface ApplicationReviewProps {
  application: any;
}

export default function ApplicationReview({ application }: ApplicationReviewProps) {
  const router = useRouter();
  const [appStatus, setAppStatus] = useState(application.status);
  const [reviewComments, setReviewComments] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [generatingOffer, setGeneratingOffer] = useState(false);

  // Offer Letter Form fields
  const [offerForm, setOfferForm] = useState({
    position: application.jobId?.title || "",
    department: application.jobId?.department || "General",
    salary: application.jobId?.salary || "",
    offerType: "Job" as "Job" | "Internship",
    payoutFrequency: "monthly",
    startDate: "",
    endDate: "",
    duration: "",
    joiningLocation: application.jobId?.location || "",
    workType: "On-site" as "Remote" | "On-site" | "Hybrid",
    benefits: "",
    reportingManager: "",
    hrContactName: application.jobId?.hrContact?.name || "HR Team",
    hrContactEmail: application.jobId?.hrContact?.email || "hr@fmpg.in",
    hrContactPhone: application.jobId?.hrContact?.phone || "",
    validUntil: "",
    additionalNotes: ""
  });

  // Calculate default dates
  useEffect(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() + 30); // 30 days from now
    
    const valid = new Date(today);
    valid.setDate(valid.getDate() + 14); // 14 days from now

    setOfferForm((prev) => ({
      ...prev,
      startDate: start.toISOString().split("T")[0],
      validUntil: valid.toISOString().split("T")[0]
    }));
  }, [application]);

  // Handle Application Status Update
  const handleUpdateStatus = async (status: any) => {
    try {
      setUpdatingStatus(true);
      const res = await updateApplicationStatusAction(application._id, status, reviewComments);
      if (res.success) {
        toast.success(res.message);
        setAppStatus(status);
        setReviewComments("");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch (err) {
      toast.error("Operation failed");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Issue Offer Letter Submission
  const handleIssueOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGeneratingOffer(true);
      const processedBenefits = offerForm.benefits
        ? offerForm.benefits.split(",").map((b) => b.trim()).filter(Boolean)
        : [];

      const payload = {
        ...offerForm,
        candidateName: application.fullName,
        email: application.email,
        benefits: processedBenefits
      };

      const res = await issueOfferLetterAction(application._id, payload);
      if (res.success) {
        toast.success("Offer letter generated, linked and emailed to applicant successfully!");
        setShowOfferForm(false);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to issue offer letter");
      }
    } catch (err) {
      toast.error("Failed to generate and email offer letter");
    } finally {
      setGeneratingOffer(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
      case "reviewing": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "shortlisted": return "bg-emerald-50 text-indigo-600 dark:text-emerald-600 border-emerald-600/20";
      case "rejected": return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      case "offered": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "hired": return "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20";
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 py-10 px-4 sm:px-6 lg:px-8 bg-grid-pattern relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 z-10 relative text-left">
        {/* Navigation header */}
        <div className="flex justify-between items-center pb-2">
          <Button
            variant="ghost"
            className="flex items-center gap-1 text-xs font-bold pl-0 hover:bg-transparent"
            onClick={() => router.push("/admin/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
          
          <Badge className={`text-xs font-black uppercase px-3 py-1 border ${getStatusColor(appStatus)}`}>
            Status: {appStatus}
          </Badge>
        </div>

        {/* Top Header Card */}
        <Card className="glass-panel border-border/40 shadow-xl overflow-hidden">
          <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/20 bg-muted/10">
            <div className="space-y-1.5">
              <h1 className="font-heading text-2xl font-black text-foreground">{application.fullName}</h1>
              <p className="text-xs text-primary font-bold">Applying for: {application.jobId?.title || "FMPG Openings"}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-[10px] text-muted-foreground font-semibold">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-primary" /> {application.email}</span>
                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-primary" /> {application.phone}</span>
                {application.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> Applied on: {new Date(application.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {application.resumeUrl && (
                <a
                  href={application.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 bg-primary text-slate-900 text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:brightness-105 transition-all"
                >
                  <FileText className="h-4 w-4 mr-1.5" /> View Resume
                </a>
              )}
            </div>
          </div>

          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Candidate profiles & details */}
            <div className="md:col-span-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider pl-1">Skills Portfolio</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(application.skills || []).map((skill: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-[10px] font-semibold bg-muted/30 text-foreground border border-border/10">
                      {skill}
                    </Badge>
                  ))}
                  {(application.skills || []).length === 0 && (
                    <span className="text-xs text-muted-foreground italic font-semibold">No core skills explicitly parsed</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1.5">
                  <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider pl-1">Professional Experience</h3>
                  <div className="bg-muted/20 border border-border/10 p-4 rounded-2xl text-xs text-foreground font-medium leading-relaxed max-h-48 overflow-y-auto scrollbar-thin">
                    {application.experience || "No professional experience listed"}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider pl-1">Academic Education</h3>
                  <div className="bg-muted/20 border border-border/10 p-4 rounded-2xl text-xs text-foreground font-medium leading-relaxed max-h-48 overflow-y-auto scrollbar-thin">
                    {application.education || "No educational history listed"}
                  </div>
                </div>
              </div>

              {application.coverLetter && (
                <div className="space-y-1.5 pt-2">
                  <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider pl-1">Cover Letter Statement</h3>
                  <div className="bg-muted/20 border border-border/10 p-5 rounded-2xl text-xs text-foreground font-medium leading-relaxed max-h-40 overflow-y-auto scrollbar-thin select-all">
                    "{application.coverLetter}"
                  </div>
                </div>
              )}

              {/* Dynamic screening questionnaire */}
              {application.questionAnswers && application.questionAnswers.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider pl-1">Screening Questionnaire Responses</h3>
                  <div className="space-y-3">
                    {application.questionAnswers.map((qa: any, idx: number) => (
                      <div key={idx} className="bg-muted/30 border border-border/15 p-4 rounded-2xl space-y-1 text-xs">
                        <p className="font-black text-foreground">Q: {qa.questionText}</p>
                        <p className="font-semibold text-primary pl-2 border-l border-primary/40">A: {qa.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Assessment Panel controls */}
            <div className="md:col-span-4 space-y-6 border-t md:border-t-0 md:border-l border-border/20 pt-6 md:pt-0 md:pl-6">
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider pl-1">Interviewer Evaluation Center</h3>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground pl-1">Reviewer Assessment Comments</label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 bg-background border border-border/40 rounded-2xl text-xs font-medium focus:ring-1 focus:ring-primary text-foreground"
                    placeholder="Write rating remarks, comments or recommendations..."
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="w-full text-xs font-bold py-2 bg-indigo-50 hover:bg-indigo-100/50 text-indigo-600 border-indigo-200"
                    onClick={() => handleUpdateStatus("shortlisted")}
                    disabled={updatingStatus}
                  >
                    Shortlist Candidate
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100/50 border-emerald-200"
                      onClick={() => handleUpdateStatus("reviewing")}
                      disabled={updatingStatus}
                    >
                      Mark Reviewing
                    </Button>
                    <Button
                      variant="destructive"
                      className="text-xs font-bold"
                      onClick={() => handleUpdateStatus("rejected")}
                      disabled={updatingStatus}
                    >
                      Reject Profile
                    </Button>
                  </div>
                </div>
              </div>

              {/* Offer Letter extending dashboard */}
              <div className="border-t border-border/20 pt-6 space-y-4">
                <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider pl-1">Onboarding Offer Letter</h3>
                
                {application.offerLetterId ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl space-y-3 text-xs text-left">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black">
                      <FileCheck className="h-5 w-5" />
                      <span>Offer Extended Successfully!</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      An official employment offer has been successfully issued to this candidate and sent to their inbox.
                    </p>
                    <div className="text-[10px] font-bold text-foreground space-y-1">
                      <div>Status: <Badge variant="outline" className="text-[9px] font-black uppercase">{application.offerLetterId.status || "Pending"}</Badge></div>
                      {application.offerLetterId.validUntil && (
                        <div>Expiry: {new Date(application.offerLetterId.validUntil).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    {!showOfferForm ? (
                      <Button
                        className="w-full flex items-center justify-center gap-1.5"
                        onClick={() => setShowOfferForm(true)}
                      >
                        <Plus className="h-4 w-4" /> Draft Offer Letter
                      </Button>
                    ) : (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-xs space-y-2 text-left">
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                          <Info className="h-4 w-4" />
                          <span>Drafting In Progress</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-semibold">
                          Fill in details in the form on the left to compile the PDF agreement and email it.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OFFER LETTER DRAFTING FORM */}
        {showOfferForm && !application.offerLetterId && (
          <Card className="glass-panel border-border/40 shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <CardHeader className="py-5 bg-muted/10 border-b border-border/20">
              <CardTitle className="text-sm font-black text-foreground">Draft Employment Offer & Onboarding Terms</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Generate dynamic portfolio portrait PDF buffers in-memory and email the contract invitation link
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleIssueOffer} className="space-y-6 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground pl-1">Target Position</label>
                    <Input
                      type="text"
                      value={offerForm.position}
                      onChange={(e) => setOfferForm({ ...offerForm, position: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground pl-1">Onboarding Department</label>
                    <Input
                      type="text"
                      value={offerForm.department}
                      onChange={(e) => setOfferForm({ ...offerForm, department: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground pl-1">Work Type</label>
                    <select
                      className="px-3 py-2 bg-background border border-border/40 rounded-xl text-xs font-semibold"
                      value={offerForm.workType}
                      onChange={(e) => setOfferForm({ ...offerForm, workType: e.target.value as any })}
                    >
                      <option value="On-site">On-site</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground pl-1">Compensation Offer</label>
                    <Input
                      type="text"
                      value={offerForm.salary}
                      onChange={(e) => setOfferForm({ ...offerForm, salary: e.target.value })}
                      required
                      placeholder="e.g. ₹45,000 / month"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground pl-1">Offer Agreement Type</label>
                    <select
                      className="px-3 py-2 bg-background border border-border/40 rounded-xl text-xs font-semibold"
                      value={offerForm.offerType}
                      onChange={(e) => setOfferForm({ ...offerForm, offerType: e.target.value as any })}
                    >
                      <option value="Job">Permanent Job</option>
                      <option value="Internship">Internship Contract</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground pl-1">Employment Start Date</label>
                    <Input
                      type="date"
                      value={offerForm.startDate}
                      onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground pl-1">Employment End Date (optional)</label>
                    <Input
                      type="date"
                      value={offerForm.endDate}
                      onChange={(e) => setOfferForm({ ...offerForm, endDate: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground pl-1">Duration Text (optional)</label>
                    <Input
                      type="text"
                      value={offerForm.duration}
                      onChange={(e) => setOfferForm({ ...offerForm, duration: e.target.value })}
                      placeholder="e.g. 6 Months"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground pl-1">Joining Location</label>
                    <Input
                      type="text"
                      value={offerForm.joiningLocation}
                      onChange={(e) => setOfferForm({ ...offerForm, joiningLocation: e.target.value })}
                      placeholder="e.g. Chandigarh office / Hoshiarpur HQ"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground pl-1">Reporting Manager Designation</label>
                    <Input
                      type="text"
                      value={offerForm.reportingManager}
                      onChange={(e) => setOfferForm({ ...offerForm, reportingManager: e.target.value })}
                      placeholder="e.g. Lead Operations Director"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground pl-1">Compensation Benefits (comma separated)</label>
                  <Input
                    type="text"
                    value={offerForm.benefits}
                    onChange={(e) => setOfferForm({ ...offerForm, benefits: e.target.value })}
                    placeholder="e.g. Paid Leaves, Medical Insurance, Performance Bonus"
                  />
                </div>

                {/* Signatory contact details */}
                <div className="border-t border-border/20 pt-4 space-y-4">
                  <h4 className="text-xs font-black uppercase text-foreground">HR Signatory / Contact details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground pl-1">Signatory Name</label>
                      <Input
                        type="text"
                        value={offerForm.hrContactName}
                        onChange={(e) => setOfferForm({ ...offerForm, hrContactName: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground pl-1">Contact Email</label>
                      <Input
                        type="email"
                        value={offerForm.hrContactEmail}
                        onChange={(e) => setOfferForm({ ...offerForm, hrContactEmail: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground pl-1">Contact Phone</label>
                      <Input
                        type="tel"
                        value={offerForm.hrContactPhone}
                        onChange={(e) => setOfferForm({ ...offerForm, hrContactPhone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/20 pt-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground pl-1">Offer Acceptance Deadline</label>
                    <Input
                      type="date"
                      value={offerForm.validUntil}
                      onChange={(e) => setOfferForm({ ...offerForm, validUntil: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground pl-1">Additional Terms / Notes</label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 bg-background border border-border/40 rounded-xl text-xs font-medium focus:ring-1 focus:ring-primary text-foreground"
                      value={offerForm.additionalNotes}
                      onChange={(e) => setOfferForm({ ...offerForm, additionalNotes: e.target.value })}
                      placeholder="e.g. Any legacy reference or signing clause..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-border/20">
                  <Button variant="outline" type="button" onClick={() => setShowOfferForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={generatingOffer}>
                    {generatingOffer ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Compiling Offer PDF...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1.5" /> Generate & Issue Offer Letter
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
