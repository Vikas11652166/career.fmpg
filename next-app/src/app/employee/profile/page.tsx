"use client";

import React, { useState, useEffect, useTransition } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  getMyRecommendationsAction,
  getAvailableApplicationsForRecommendationAction,
  createRecommendationAction,
  deleteRecommendationAction
} from "@/app/actions/recommendations";
import { getMeAction } from "@/app/actions/auth";
import {
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Briefcase,
  User as UserIcon,
  Mail,
  AlertTriangle,
  Loader2,
  Users,
  Compass,
  FileText,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EmployeeProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [availableApplications, setAvailableApplications] = useState<any[]>([]);
  const [stats, setStats] = useState({ pendingCount: 0, totalCount: 0, selectedCount: 0 });
  
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showIdList, setShowIdList] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  
  const [recomForm, setRecomForm] = useState({
    applicationId: "",
    recommendationMessage: ""
  });

  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  // Load User, Recommendations, and Applications
  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await getMeAction();
        if (!meRes.success || !meRes.data) {
          toast.error("Please log in to access the employee profile.");
          setLoading(false);
          return;
        }

        if (meRes.data.role !== "employee" && meRes.data.role !== "super-admin") {
          setCurrentUser(meRes.data);
          setLoading(false);
          return;
        }

        setCurrentUser(meRes.data);
        await refreshData();
      } catch (err) {
        toast.error("Failed to load employee details.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const refreshData = async () => {
    const [recomsRes, appsRes] = await Promise.all([
      getMyRecommendationsAction(),
      getAvailableApplicationsForRecommendationAction()
    ]);

    if (recomsRes.success && recomsRes.data) {
      setRecommendations(recomsRes.data.recommendations || []);
      const total = recomsRes.data.pagination.totalCount || 0;
      const pending = recomsRes.data.pagination.pendingCount || 0;
      const selected = recomsRes.data.recommendations.filter((r: any) => r.status === "selected").length;
      setStats({ totalCount: total, pendingCount: pending, selectedCount: selected });
    }

    if (appsRes.success && appsRes.data) {
      setAvailableApplications(appsRes.data || []);
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRecomForm(prev => ({ ...prev, applicationId: val }));
    
    if (val.trim()) {
      const match = availableApplications.find(app => app._id === val.trim());
      setSelectedApplication(match || null);
    } else {
      setSelectedApplication(null);
    }
  };

  const handleSelectApplication = (app: any) => {
    setRecomForm(prev => ({ ...prev, applicationId: app._id }));
    setSelectedApplication(app);
    setShowIdList(false);
  };

  const handleSubmitRecommendation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recomForm.applicationId.trim() || !recomForm.recommendationMessage.trim()) {
      toast.error("Please provide both application ID and recommendation comments.");
      return;
    }

    if (!selectedApplication) {
      toast.error("Please select a valid candidate application ID from the registry.");
      return;
    }

    if (stats.pendingCount >= 5) {
      toast.warning("You have reached the maximum limit of 5 pending recommendations.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createRecommendationAction({
          recommendedUserEmail: selectedApplication.email,
          recommendedUserName: selectedApplication.fullName,
          jobId: selectedApplication.jobId._id,
          recommendationMessage: recomForm.recommendationMessage
        });

        if (res.success) {
          toast.success(res.message);
          setShowForm(false);
          setRecomForm({ applicationId: "", recommendationMessage: "" });
          setSelectedApplication(null);
          await refreshData();
        } else {
          toast.error(res.message || "Failed to submit recommendation.");
        }
      } catch (err) {
        toast.error("An error occurred during submission.");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this pending recommendation?")) return;

    startDeleteTransition(async () => {
      try {
        const res = await deleteRecommendationAction(id);
        if (res.success) {
          toast.success(res.message);
          await refreshData();
        } else {
          toast.error(res.message || "Failed to delete recommendation.");
        }
      } catch (err) {
        toast.error("An error occurred.");
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-yellow-900/30 text-yellow-400 border-yellow-500/30 text-[10px] font-bold uppercase tracking-wider">
            <Clock className="h-3 w-3" /> Pending Review
          </span>
        );
      case "reviewed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-blue-900/30 text-blue-400 border-blue-500/30 text-[10px] font-bold uppercase tracking-wider">
            <Eye className="h-3 w-3" /> Under Review
          </span>
        );
      case "selected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle className="h-3 w-3" /> Candidate Selected
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-bold uppercase tracking-wider">
            <XCircle className="h-3 w-3" /> Demoted / Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  // Auth Guard view
  if (!currentUser || (currentUser.role !== "employee" && currentUser.role !== "super-admin")) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-6 bg-grid-pattern">
          <Card className="max-w-md w-full rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl p-8 text-center glass-panel">
            <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="font-heading text-2xl font-black text-foreground mb-3 uppercase tracking-wide">Access Denied</h2>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed mb-6">
              Only active or former employees of FMPG with legitimate referrals clearances are allowed to view this interface.
            </p>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      <Navbar />

      {/* Decorative background glow panels */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <main className="flex-grow pt-28 pb-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/20">
            <div className="text-left">
              <h1 className="font-heading text-3xl font-black text-foreground uppercase tracking-wide">Employee Profile</h1>
              <p className="text-xs text-muted-foreground font-semibold mt-1">
                Referral and Recommendation command center for FMPG associate <span className="text-foreground font-bold">{currentUser.name} ({currentUser.employeeId || "EMP000"})</span>
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              disabled={stats.pendingCount >= 5}
              className="bg-primary text-white hover:bg-primary/90 font-extrabold h-11 px-6 rounded-2xl flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              Make Recommendation
            </Button>
          </div>

          {/* Stats Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            <div className="glass-panel p-6 rounded-3xl bg-card/60 border border-border/40 flex items-center gap-4 text-left">
              <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Pending Referrals</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-foreground">{stats.pendingCount}</span>
                  <span className="text-xs text-muted-foreground/60">/ 5 allowed</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl bg-card/60 border border-border/40 flex items-center gap-4 text-left">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Hired Sourced</span>
                <div className="text-2xl font-black text-foreground mt-0.5">{stats.selectedCount}</div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl bg-card/60 border border-border/40 flex items-center gap-4 text-left">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Total Referrals</span>
                <div className="text-2xl font-black text-foreground mt-0.5">{stats.totalCount}</div>
              </div>
            </div>

          </div>

          {/* Recommendations Feed Table */}
          <div className="glass-panel rounded-3xl bg-card/60 border border-border/40 overflow-hidden shadow-md">
            <div className="px-6 py-5 border-b border-border/20 flex items-center justify-between bg-muted/20">
              <h2 className="font-heading text-lg font-black text-foreground uppercase tracking-wide">Referral Directory</h2>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full">
                {recommendations.length} total Sourced
              </span>
            </div>

            {recommendations.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
                <div className="h-14 w-14 bg-muted/60 text-muted-foreground/60 rounded-full flex items-center justify-center">
                  <Compass className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold text-foreground mb-1 uppercase tracking-wide">No Referrals Registered</h3>
                  <p className="text-xs text-muted-foreground/60 font-semibold">
                    You haven't recommended any candidates for vacancies yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold text-muted-foreground">
                  <thead>
                    <tr className="border-b border-border/20 bg-muted/10 text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">
                      <th className="px-6 py-4">Candidate</th>
                      <th className="px-6 py-4">Vacancy Domain</th>
                      <th className="px-6 py-4">Referral status</th>
                      <th className="px-6 py-4">Submitted On</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {recommendations.map((recom) => (
                      <tr key={recom._id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                              {recom.recommendedUserName.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-foreground font-bold">{recom.recommendedUserName}</span>
                              <span className="text-[10px] text-muted-foreground/60">{recom.recommendedUserEmail}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-foreground font-bold">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-3.5 w-3.5 text-primary" />
                            {recom.jobId?.title || "FMPG Vacancy"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(recom.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground/60">
                          {new Date(recom.createdAt).toLocaleDateString("en-GB")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {recom.status === "pending" && (
                            <button
                              onClick={() => handleDelete(recom._id)}
                              disabled={isDeleting}
                              className="p-2 text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Delete Pending Referral"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Recommendation Form Modal Dialog Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <Card className="rounded-[32px] border border-border/40 bg-card p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/20">
              <h2 className="font-heading text-xl font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Link Referral
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setShowIdList(false);
                  setRecomForm({ applicationId: "", recommendationMessage: "" });
                  setSelectedApplication(null);
                }}
                className="text-muted-foreground hover:text-foreground text-sm font-bold transition-colors cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSubmitRecommendation} className="flex flex-col gap-6">
              
              {/* Application Selector */}
              <div className="flex flex-col gap-2 relative">
                <div className="flex items-center justify-between">
                  <label htmlFor="appId" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-1">
                    Application ID *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowIdList(prev => !prev)}
                    className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                  >
                    {showIdList ? "Hide List" : "Show Available Applications"}
                  </button>
                </div>
                
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <input
                    id="appId"
                    type="text"
                    required
                    value={recomForm.applicationId}
                    onChange={handleIdChange}
                    placeholder="Enter or paste applicant ObjectId"
                    className="w-full h-11 pl-10 pr-4 bg-background border border-border/40 focus:border-primary/60 rounded-xl text-xs font-semibold focus:outline-none transition-colors font-mono"
                  />
                </div>

                {/* Dropdown Candidate Registry List */}
                {showIdList && (
                  <div className="absolute top-[68px] inset-x-0 bg-background border border-border/40 rounded-xl shadow-xl p-3 z-50 max-h-48 overflow-y-auto flex flex-col gap-2">
                    {availableApplications.length === 0 ? (
                      <span className="text-[10px] text-muted-foreground/60 font-semibold p-2 text-center">
                        No applications currently available for recommendation.
                      </span>
                    ) : (
                      availableApplications.map(app => (
                        <div
                          key={app._id}
                          onClick={() => handleSelectApplication(app)}
                          className="p-2 border border-border/10 rounded-lg hover:bg-primary/5 cursor-pointer flex items-center justify-between text-[10px] transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="text-foreground font-bold">{app.fullName}</span>
                            <span className="text-muted-foreground/60">{app.email}</span>
                          </div>
                          <span className="text-primary font-mono">{app._id.substring(app._id.length - 8).toUpperCase()}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Selected Candidate Preview Card */}
              {selectedApplication && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col gap-4">
                  <h4 className="text-[10px] font-black uppercase text-primary tracking-wider">Candidate Profile Sourced</h4>
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-semibold text-muted-foreground">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase text-muted-foreground/60">Full Name</span>
                      <span className="text-foreground font-bold mt-0.5">{selectedApplication.fullName}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase text-muted-foreground/60">Email</span>
                      <span className="text-foreground mt-0.5">{selectedApplication.email}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase text-muted-foreground/60">Applied Job</span>
                      <span className="text-foreground font-bold mt-0.5">{selectedApplication.jobId?.title}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase text-muted-foreground/60">Department</span>
                      <span className="text-foreground mt-0.5">{selectedApplication.jobId?.department}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendation Comments */}
              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-1">
                  Referral Comments / Endorsement *
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  maxLength={500}
                  disabled={!selectedApplication}
                  value={recomForm.recommendationMessage}
                  onChange={(e) => setRecomForm(prev => ({ ...prev, recommendationMessage: e.target.value }))}
                  placeholder={selectedApplication ? "Outline why you endorse this candidate and their core match metrics..." : "Select a valid candidate application above first"}
                  className="w-full pl-4 pr-4 py-3 bg-background border border-border/40 focus:border-primary/60 rounded-xl text-xs font-semibold focus:outline-none transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
                  <span>Minimum 50 characters highlighting fit metrics.</span>
                  <span>{recomForm.recommendationMessage.length}/500</span>
                </div>
              </div>

              {/* Submission Buttons */}
              <div className="flex gap-4 pt-4 border-t border-border/20">
                <Button
                  type="submit"
                  disabled={isPending || !selectedApplication || recomForm.recommendationMessage.length < 10}
                  className="flex-1 h-11 rounded-2xl bg-primary text-white hover:bg-primary/95 font-extrabold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Filing Referral...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      File Recommendation
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setShowIdList(false);
                    setRecomForm({ applicationId: "", recommendationMessage: "" });
                    setSelectedApplication(null);
                  }}
                  className="flex-1 h-11 rounded-2xl border-border/40 text-muted-foreground hover:text-foreground font-extrabold text-xs uppercase tracking-widest"
                >
                  Cancel
                </Button>
              </div>

            </form>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  );
}
