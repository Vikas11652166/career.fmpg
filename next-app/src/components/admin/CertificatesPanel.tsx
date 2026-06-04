"use client";

import React, { useState, useEffect } from "react";
import { 
  issueCertificateAction, 
  getAllCertificatesAction, 
  sendCertificateEmailAction,
  downloadCertificateBase64Action,
  verifyCertificateAction
} from "@/app/actions/certificates";
import { 
  getAllOfferLettersAction, 
  downloadOfferLetterBase64Action,
  resendOfferLetterEmailAction,
  extendOfferValidityAction,
  bulkIssueOfferLettersAction
} from "@/app/actions/contracts";
import { 
  issueOfferLetterAction 
} from "@/app/actions/admin";
import { 
  Shield, 
  Award, 
  FileText, 
  Mail, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Send,
  Calendar,
  Briefcase,
  User,
  MapPin,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Upload,
  FileSpreadsheet
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrencyValue } from "@/lib/currencyFormatter";

type TabType = "issue-cert" | "issue-offer" | "all-certs" | "all-offers" | "verify";

export default function CertificatesPanel() {
  const [activeTab, setActiveTab] = useState<TabType>("issue-cert");
  const [loading, setLoading] = useState(false);

  // Lists data
  const [certificates, setCertificates] = useState<any[]>([]);
  const [offerLetters, setOfferLetters] = useState<any[]>([]);

  // Certificate Issuance Form State
  const [certForm, setCertForm] = useState({
    name: "",
    email: "",
    domain: "Software Development",
    jobrole: "Intern",
    fromDate: "",
    toDate: "",
    issuedBy: "FMPG Network"
  });

  // Offer Letter Issuance Form State
  const [offerForm, setOfferForm] = useState({
    candidateName: "",
    email: "",
    position: "Software Developer",
    department: "Engineering",
    salary: "15000",
    workType: "On-site" as "On-site" | "Remote" | "Hybrid",
    joiningLocation: "Hoshiarpur",
    startDate: "",
    validUntil: "",
    reportingManager: "HR Operations Team",
    benefits: "Stipend, Certificate, Letter of Recommendation"
  });

  // Verification Form State
  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Bulk Offer States
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkCommon, setBulkCommon] = useState({
    joiningLocation: "Hoshiarpur",
    workType: "On-site" as "On-site" | "Remote" | "Hybrid",
    validUntil: "",
    hrContactName: "HR Operations Team",
    hrContactEmail: "contact@fmpg.in",
    hrContactPhone: "9876543210",
    additionalNotes: "",
    offerType: "Job" as "Job" | "Internship",
    payoutFrequency: "per month",
    sendEmail: true,
    endDate: "",
    duration: ""
  });
  const [durationMode, setDurationMode] = useState<"calculate" | "manual">("calculate");

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
    const dataRows = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle commas inside quotes
      const values: string[] = [];
      let currentVal = "";
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(currentVal.trim().replace(/^["']|["']$/g, ""));
          currentVal = "";
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim().replace(/^["']|["']$/g, ""));

      const rowData: any = {};
      headers.forEach((header, index) => {
        if (header) {
          rowData[header] = values[index] || "";
        }
      });
      dataRows.push(rowData);
    }
    return dataRows;
  };

  const handleBulkOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) {
      return toast.error("Please upload a CSV file first");
    }
    if (!bulkCommon.joiningLocation || !bulkCommon.validUntil) {
      return toast.error("Please fill in all required common fields");
    }

    setBulkLoading(true);
    const toastId = toast.loading("Reading and parsing CSV file...");

    try {
      const fileText = await bulkFile.text();
      const rows = parseCSV(fileText);

      if (rows.length === 0) {
        toast.dismiss(toastId);
        setBulkLoading(false);
        return toast.error("No valid candidate rows found in the CSV file");
      }

      toast.loading(`Processing ${rows.length} candidate offer letters...`, { id: toastId });

      const payloadCommon = {
        ...bulkCommon,
        duration: durationMode === "manual" ? bulkCommon.duration : undefined,
        endDate: durationMode === "calculate" ? bulkCommon.endDate : undefined
      };

      const res = await bulkIssueOfferLettersAction(payloadCommon, rows);

      toast.dismiss(toastId);
      if (res.success) {
        toast.success(res.message || "Bulk offer letters processed successfully!");
        if (res.errorCount > 0 && res.errors) {
          console.error("Bulk errors:", res.errors);
          toast.warning(`${res.errorCount} row(s) failed. Check console for details.`);
        }
        setShowBulkModal(false);
        setBulkFile(null);
        loadOfferLetters();
      } else {
        toast.error(res.message || "Failed to issue bulk offer letters");
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.message || "An error occurred during bulk issuance");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDownloadBulkOfferSample = () => {
    const headers = "candidateName,email,position,department,salary,startDate,joiningLocation,workType,validUntil,hrContactName,hrContactEmail,hrContactPhone,additionalNotes\n";
    const sampleRow = "John Doe,john.doe@example.com,Software Engineer,Development,80000,2026-07-01,Hoshiarpur,On-site,2026-06-25,HR Operations Team,contact@fmpg.in,9876543210,Welcome to the team!\n";
    
    const blob = new Blob([headers + sampleRow], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "bulk_offer_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success("Sample CSV downloaded successfully!");
  };

  // Load lists
  const loadCertificates = async () => {
    try {
      const res = await getAllCertificatesAction();
      if (res.success && res.data) {
        setCertificates(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadOfferLetters = async () => {
    try {
      const res = await getAllOfferLettersAction();
      if (res.success && res.data) {
        setOfferLetters(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === "all-certs") {
      loadCertificates();
    } else if (activeTab === "all-offers") {
      loadOfferLetters();
    }
  }, [activeTab]);

  // Issue Certificate
  const handleCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.name || !certForm.domain || !certForm.jobrole || !certForm.fromDate || !certForm.toDate) {
      return toast.error("Please fill in all required fields");
    }

    setLoading(true);
    try {
      const res = await issueCertificateAction(certForm);
      if (res.success) {
        toast.success(res.message || "Certificate issued successfully!");
        setCertForm({
          name: "",
          email: "",
          domain: "Software Development",
          jobrole: "Intern",
          fromDate: "",
          toDate: "",
          issuedBy: "FMPG Network"
        });
      } else {
        toast.error(res.message || "Failed to issue certificate");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Issue Offer Letter
  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerForm.candidateName || !offerForm.email || !offerForm.position || !offerForm.startDate || !offerForm.validUntil) {
      return toast.error("Please fill in all required fields");
    }

    setLoading(true);
    try {
      const res = await issueOfferLetterAction("custom-issue", offerForm);
      if (res.success) {
        toast.success(res.message || "Offer letter issued successfully!");
        setOfferForm({
          candidateName: "",
          email: "",
          position: "Software Developer",
          department: "Engineering",
          salary: "15000",
          workType: "On-site",
          joiningLocation: "Hoshiarpur",
          startDate: "",
          validUntil: "",
          reportingManager: "HR Operations Team",
          benefits: "Stipend, Certificate, Letter of Recommendation"
        });
      } else {
        toast.error(res.message || "Failed to issue offer letter");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Download PDF base64 helper
  const triggerBase64Download = (base64: string, filename: string) => {
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${base64}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Certificate
  const handleDownloadCert = async (certId: string) => {
    toast.info("Compiling PDF in memory...");
    try {
      const res = await downloadCertificateBase64Action(certId);
      if (res.success && res.data) {
        triggerBase64Download(res.data, `certificate-${certId}.pdf`);
        toast.success("Certificate PDF downloaded successfully!");
      } else {
        toast.error(res.message || "Download failed");
      }
    } catch (err) {
      toast.error("Download failed");
    }
  };

  // Download Offer Letter
  const handleDownloadOffer = async (offerId: string) => {
    toast.info("Compiling PDF in memory...");
    try {
      const res = await downloadOfferLetterBase64Action(offerId);
      if (res.success && res.data) {
        triggerBase64Download(res.data, `offer-letter-${offerId}.pdf`);
        toast.success("Offer Letter PDF downloaded successfully!");
      } else {
        toast.error(res.message || "Download failed");
      }
    } catch (err) {
      toast.error("Download failed");
    }
  };

  // Resend Offer Letter Email
  const handleResendOfferEmail = async (offerId: string, email: string) => {
    const confirmResend = window.confirm(`Are you sure you want to resend the offer letter email to ${email}?`);
    if (!confirmResend) return;

    setLoading(true);
    try {
      const res = await resendOfferLetterEmailAction(offerId);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message || "Failed to resend email");
      }
    } catch (err) {
      toast.error("Email resending failed");
    } finally {
      setLoading(false);
    }
  };

  // Extend Offer Expiry Validity
  const handleExtendOffer = async (offerId: string, currentValidUntil: string) => {
    const currentDateStr = new Date(currentValidUntil).toISOString().split("T")[0];
    const newDateStr = prompt("Enter new validity expiration date (YYYY-MM-DD):", currentDateStr);
    if (!newDateStr) return;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDateStr)) {
      toast.error("Invalid date format. Use YYYY-MM-DD.");
      return;
    }

    const comments = prompt("Enter extension notes (optional):") || "";

    setLoading(true);
    try {
      const res = await extendOfferValidityAction(offerId, newDateStr, comments);
      if (res.success) {
        toast.success(res.message);
        await loadOfferLetters(); // Reload list to reflect the new date!
      } else {
        toast.error(res.message || "Failed to extend offer letter");
      }
    } catch (err) {
      toast.error("Validity extension failed");
    } finally {
      setLoading(false);
    }
  };

  // Resend Email Certificate
  const handleResendCertEmail = async (certId: string, email: string) => {
    if (!email) return toast.error("No recipient email associated with this certificate");
    setLoading(true);
    try {
      const res = await sendCertificateEmailAction(certId, email);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Email resending failed");
    } finally {
      setLoading(false);
    }
  };

  // Verify Certificate
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyId.trim()) return toast.error("Please enter a Certificate ID");

    setVerifyLoading(true);
    setVerifyResult(null);
    try {
      const res = await verifyCertificateAction(verifyId);
      if (res.success && res.data) {
        setVerifyResult(res.data);
        toast.success("Certificate verified successfully!");
      } else {
        toast.error(res.message || "Verification failed");
      }
    } catch (err) {
      toast.error("Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 w-full text-left relative z-10">
      
      {/* Page Header */}
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/10 border border-emerald-600/20 text-emerald-600 text-xs font-bold uppercase tracking-widest mb-3">
          <Shield className="h-3.5 w-3.5" /> Security & Credential Registry
        </span>
        <h1 className="font-heading text-3xl font-black tracking-tight text-white">
          Certification Management
        </h1>
        <p className="text-xs text-slate-900/40 mt-1 max-w-2xl">
          Issue completion certificates, draft portraits employment contracts, list historical registries, and publically verify generated credentials.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-100/50 border border-slate-200/60 w-fit">
        {[
          { key: "issue-cert", label: "Issue Certificate", icon: Award },
          { key: "issue-offer", label: "Issue Offer Letter", icon: FileText },
          { key: "all-certs", label: "All Certificates", icon: CheckCircle2 },
          { key: "all-offers", label: "All Offer Letters", icon: TrendingUp },
          { key: "verify", label: "Verify Certificate", icon: Shield }
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                active 
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-slate-900 shadow-md shadow-emerald-500/5"
                  : "text-slate-900/60 hover:text-slate-900 hover:bg-slate-100/50"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <Card className="rounded-3xl border border-slate-200/60 bg-slate-100/50 backdrop-blur-xl shadow-xl overflow-hidden min-h-[450px]">
        <CardContent className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            
            {/* ── TAB 1: ISSUE CERTIFICATE ── */}
            {activeTab === "issue-cert" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                key="issue-cert"
              >
                <div className="mb-6">
                  <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Award className="text-emerald-600" /> New Completion Certificate
                  </h3>
                  <p className="text-xs text-slate-900/40 mt-0.5">Generate a landscape A4 digital completion certificate and email it automatically as a secure PDF.</p>
                </div>

                <form onSubmit={handleCertSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-900/50 tracking-wider pl-2">Recipient Name <span className="text-red-500">*</span></label>
                    <Input 
                      placeholder="Jane Doe" 
                      value={certForm.name}
                      onChange={(e) => setCertForm({...certForm, name: e.target.value})}
                      className="h-11 bg-slate-100/50 border-slate-200/60 text-slate-900 placeholder:text-slate-900/20" 
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-900/50 tracking-wider pl-2">Recipient Email</label>
                    <Input 
                      type="email" 
                      placeholder="jane@example.com" 
                      value={certForm.email}
                      onChange={(e) => setCertForm({...certForm, email: e.target.value})}
                      className="h-11 bg-slate-100/50 border-slate-200/60 text-slate-900 placeholder:text-slate-900/20" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-900/50 tracking-wider pl-2">Internship Domain <span className="text-red-500">*</span></label>
                    <select
                      value={certForm.domain}
                      onChange={(e) => setCertForm({...certForm, domain: e.target.value})}
                      className="h-11 rounded-xl bg-card border border-slate-200/60 text-xs font-semibold px-3 focus:outline-none focus:border-emerald-600 cursor-pointer text-white"
                    >
                      <option value="Software Development">Software Development</option>
                      <option value="Business Operations">Business Operations</option>
                      <option value="Digital Marketing">Digital Marketing</option>
                      <option value="Graphic Design">Graphic Design</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-900/50 tracking-wider pl-2">Job Role <span className="text-red-500">*</span></label>
                    <Input 
                      placeholder="Intern Developer" 
                      value={certForm.jobrole}
                      onChange={(e) => setCertForm({...certForm, jobrole: e.target.value})}
                      className="h-11 bg-slate-100/50 border-slate-200/60 text-slate-900 placeholder:text-slate-900/20" 
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-900/50 tracking-wider pl-2">Start Date <span className="text-red-500">*</span></label>
                    <Input 
                      type="date" 
                      value={certForm.fromDate}
                      onChange={(e) => setCertForm({...certForm, fromDate: e.target.value})}
                      className="h-11 bg-slate-100/50 border-slate-200/60 text-slate-900 text-xs" 
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-900/50 tracking-wider pl-2">End Date <span className="text-red-500">*</span></label>
                    <Input 
                      type="date" 
                      value={certForm.toDate}
                      onChange={(e) => setCertForm({...certForm, toDate: e.target.value})}
                      className="h-11 bg-slate-100/50 border-slate-200/60 text-slate-900 text-xs" 
                      required
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-slate-900 hover:from-emerald-500 hover:to-indigo-500 font-extrabold h-11 px-6 rounded-2xl flex items-center gap-2"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Issue & Email Certificate
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── TAB 2: ISSUE OFFER LETTER ── */}
            {activeTab === "issue-offer" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                key="issue-offer"
              >
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="text-emerald-600" /> Issue Custom Offer Letter
                    </h3>
                    <p className="text-xs text-slate-900/40 mt-0.5">Draft an official FMPG portrait A4 offer letter immediately. Candidates can digitally sign it.</p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowBulkModal(true)}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-indigo-500 text-slate-900 font-extrabold h-10 px-4 rounded-xl flex items-center gap-2 text-xs self-start sm:self-auto shrink-0 transition-all duration-300"
                  >
                    <FileSpreadsheet className="h-4 w-4" /> Bulk Issue via CSV
                  </Button>
                </div>

                <form onSubmit={handleOfferSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-900/50 tracking-wider pl-2">Candidate Name <span className="text-red-500">*</span></label>
                    <Input 
                      placeholder="Alexander Smith" 
                      value={offerForm.candidateName}
                      onChange={(e) => setOfferForm({...offerForm, candidateName: e.target.value})}
                      className="h-11 bg-slate-100/50 border-slate-200/60 text-slate-900 placeholder:text-slate-900/20" 
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-900/50 tracking-wider pl-2">Candidate Email <span className="text-red-500">*</span></label>
                    <Input 
                      type="email" 
                      placeholder="alex@example.com" 
                      value={offerForm.email}
                      onChange={(e) => setOfferForm({...offerForm, email: e.target.value})}
                      className="h-11 bg-slate-100/50 border-slate-200/60 text-slate-900 placeholder:text-slate-900/20" 
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-900/50 tracking-wider pl-2">Job Position <span className="text-red-500">*</span></label>
                    <Input 
                      placeholder="Software Developer" 
                      value={offerForm.position}
                      onChange={(e) => setOfferForm({...offerForm, position: e.target.value})}
                      className="h-11 bg-slate-100/50 border-slate-200/60 text-slate-900 placeholder:text-slate-900/20" 
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-900/50 tracking-wider pl-2">Department</label>
                    <Input 
                      placeholder="Engineering" 
                      value={offerForm.department}
                      onChange={(e) => setOfferForm({...offerForm, department: e.target.value})}
                      className="h-11 bg-slate-100/50 border-slate-200/60 text-slate-900 placeholder:text-slate-900/20" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-900/50 tracking-wider pl-2">Stipend / Salary (Rs. per month) <span className="text-red-500">*</span></label>
                    <Input 
                      type="number"
                      placeholder="15000" 
                      value={offerForm.salary}
                      onChange={(e) => setOfferForm({...offerForm, salary: e.target.value})}
                      className="h-11 bg-slate-100/50 border-slate-200/60 text-slate-900 placeholder:text-slate-900/20" 
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-900/50 tracking-wider pl-2">Work Mode</label>
                    <select
                      value={offerForm.workType}
                      onChange={(e) => setOfferForm({...offerForm, workType: e.target.value as any})}
                      className="h-11 rounded-xl bg-card border border-slate-200/60 text-xs font-semibold px-3 focus:outline-none focus:border-emerald-600 cursor-pointer text-white"
                    >
                      <option value="On-site">On-site (Hoshiarpur)</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-900/50 tracking-wider pl-2">Start Date <span className="text-red-500">*</span></label>
                    <Input 
                      type="date" 
                      value={offerForm.startDate}
                      onChange={(e) => setOfferForm({...offerForm, startDate: e.target.value})}
                      className="h-11 bg-slate-100/50 border-slate-200/60 text-slate-900 text-xs" 
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-900/50 tracking-wider pl-2">Offer Validity Deadline <span className="text-red-500">*</span></label>
                    <Input 
                      type="date" 
                      value={offerForm.validUntil}
                      onChange={(e) => setOfferForm({...offerForm, validUntil: e.target.value})}
                      className="h-11 bg-slate-100/50 border-slate-200/60 text-slate-900 text-xs" 
                      required
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-slate-900 hover:from-emerald-500 hover:to-indigo-500 font-extrabold h-11 px-6 rounded-2xl flex items-center gap-2"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Compile & Issue Offer
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── TAB 3: ALL CERTIFICATES REGISTRY ── */}
            {activeTab === "all-certs" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="all-certs"
                className="overflow-x-auto text-left"
              >
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white">Issued Completion Certificates</h3>
                    <p className="text-xs text-slate-900/40 mt-0.5">Historical list of issued credentials. Check logs or resend copies.</p>
                  </div>
                </div>

                <div className="w-full min-w-[700px] border border-slate-200/60 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/50 text-slate-900/40 font-bold border-b border-slate-200/60">
                        <th className="p-4 text-left">Certificate ID</th>
                        <th className="p-4 text-left">Recipient</th>
                        <th className="p-4 text-left">Domain</th>
                        <th className="p-4 text-left">Role</th>
                        <th className="p-4 text-left">Date Range</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-900/80 font-semibold">
                      {certificates.map((c) => (
                        <tr key={c._id} className="hover:bg-slate-100/50 transition-all">
                          <td className="p-4 text-emerald-600 font-bold font-mono">FMPG-{c._id.substring(c._id.length - 8).toUpperCase()}</td>
                          <td className="p-4">
                            <div>{c.name}</div>
                            {c.recipientEmail && <div className="text-[10px] text-slate-900/40 font-semibold mt-0.5">{c.recipientEmail}</div>}
                          </td>
                          <td className="p-4">{c.domain}</td>
                          <td className="p-4">{c.jobrole}</td>
                          <td className="p-4">{new Date(c.fromDate).toLocaleDateString('en-GB')} to {new Date(c.toDate).toLocaleDateString('en-GB')}</td>
                          <td className="p-4 flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDownloadCert(c._id)}
                              title="Download PDF"
                              className="h-8 w-8 rounded-lg bg-slate-100/50 text-slate-900 hover:text-emerald-600 hover:bg-white/10 transition-all flex items-center justify-center border border-slate-200/60"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleResendCertEmail(c._id, c.recipientEmail)}
                              title="Re-email to Recipient"
                              className="h-8 w-8 rounded-lg bg-slate-100/50 text-slate-900 hover:text-emerald-400 hover:bg-white/10 transition-all flex items-center justify-center border border-slate-200/60"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {certificates.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-slate-900/40">
                            <Award className="h-10 w-10 mx-auto text-slate-900/10 mb-2" />
                            No certificates issued in the registry yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ── TAB 4: ALL OFFER LETTERS ── */}
            {activeTab === "all-offers" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="all-offers"
                className="overflow-x-auto text-left"
              >
                <div className="mb-6">
                  <h3 className="font-heading text-lg font-bold text-white">Employment Offer letters</h3>
                  <p className="text-xs text-slate-900/40 mt-0.5">Control panel for managing generated offer proposals and candidate acceptances.</p>
                </div>

                <div className="w-full min-w-[700px] border border-slate-200/60 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/50 text-slate-900/40 font-bold border-b border-slate-200/60">
                        <th className="p-4 text-left">Recipient</th>
                        <th className="p-4 text-left">Role / Position</th>
                        <th className="p-4 text-left">Salary</th>
                        <th className="p-4 text-left">Validity Deadline</th>
                        <th className="p-4 text-left">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-900/80 font-semibold">
                      {offerLetters.map((o) => {
                        const accepted = o.status === "Accepted";
                        const rejected = o.status === "Rejected";
                        return (
                          <tr key={o._id} className="hover:bg-slate-100/50 transition-all">
                            <td className="p-4">
                              <div className="text-slate-900 font-bold">{o.candidateName}</div>
                              <div className="text-[10px] text-slate-900/40 font-semibold mt-0.5">{o.email}</div>
                            </td>
                            <td className="p-4">
                              <div>{o.position}</div>
                              <div className="text-[10px] text-slate-900/40 font-semibold mt-0.5">{o.department} · {o.workType}</div>
                            </td>
                            <td className="p-4 font-mono font-bold text-emerald-400">{formatCurrencyValue(o.salary)}</td>
                            <td className="p-4">{new Date(o.validUntil).toLocaleDateString('en-GB')}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                accepted 
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                  : rejected
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="p-4 flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleDownloadOffer(o._id)}
                                title="Download Offer PDF"
                                className="h-8 w-8 rounded-lg bg-slate-100/50 text-slate-900 hover:text-emerald-600 hover:bg-white/10 transition-all flex items-center justify-center border border-slate-200/60"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleResendOfferEmail(o._id, o.email)}
                                title="Re-email to Candidate"
                                className="h-8 w-8 rounded-lg bg-slate-100/50 text-slate-900 hover:text-emerald-400 hover:bg-white/10 transition-all flex items-center justify-center border border-slate-200/60"
                              >
                                <Mail className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleExtendOffer(o._id, o.validUntil)}
                                title="Extend Offer Validity"
                                className="h-8 w-8 rounded-lg bg-slate-100/50 text-slate-900 hover:text-amber-500 hover:bg-white/10 transition-all flex items-center justify-center border border-slate-200/60"
                              >
                                <Calendar className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {offerLetters.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-slate-900/40">
                            <FileText className="h-10 w-10 mx-auto text-slate-900/10 mb-2" />
                            No employment offers registered in database yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ── TAB 5: PUBLIC VERIFY MODULE ── */}
            {activeTab === "verify" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                key="verify"
                className="max-w-xl mx-auto"
              >
                <div className="mb-6 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-600/10 border border-emerald-600/20 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">Credential Verification</h3>
                  <p className="text-xs text-slate-900/40 mt-0.5">Verify issued completion certificates instantly against FMPG databases.</p>
                </div>

                <form onSubmit={handleVerify} className="flex gap-2">
                  <Input
                    placeholder="Enter Certificate ID (e.g. FMPG-64df...)"
                    value={verifyId}
                    onChange={(e) => setVerifyId(e.target.value)}
                    className="h-12 bg-slate-100/50 border-slate-200/60 text-slate-900 placeholder:text-slate-900/20"
                  />
                  <Button
                    type="submit"
                    disabled={verifyLoading}
                    className="bg-primary text-slate-900 hover:bg-primary/90 font-extrabold h-12 px-6 rounded-2xl shrink-0"
                  >
                    {verifyLoading ? "Verifying..." : "Verify"}
                  </Button>
                </form>

                {/* Result Display */}
                {verifyResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-lg bg-emerald-500/5 backdrop-blur-md"
                  >
                    <div className="bg-emerald-500/10 px-5 py-4 border-b border-emerald-500/20 flex justify-between items-center text-emerald-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <h4 className="font-heading text-sm font-black uppercase tracking-wider">Credential Authenticated</h4>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest font-mono text-emerald-300">Active</span>
                    </div>

                    <div className="p-6 flex flex-col gap-4 text-xs font-semibold text-slate-900/80 text-left">
                      <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                        <span className="text-slate-900/40">Recipient Name</span>
                        <span className="col-span-2 text-slate-900 font-extrabold">{verifyResult.name}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                        <span className="text-slate-900/40">Domain / Dept</span>
                        <span className="col-span-2">{verifyResult.domain}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                        <span className="text-slate-900/40">Job Role</span>
                        <span className="col-span-2">{verifyResult.jobrole}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                        <span className="text-slate-900/40">From Date</span>
                        <span className="col-span-2">{new Date(verifyResult.fromDate).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                        <span className="text-slate-900/40">To Date</span>
                        <span className="col-span-2">{new Date(verifyResult.toDate).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-white/5">
                        <span className="text-slate-900/40">Issued By</span>
                        <span className="col-span-2 text-primary">{verifyResult.issuedBy}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-1.5">
                        <span className="text-slate-900/40">Issued On</span>
                        <span className="col-span-2">{new Date(verifyResult.issuedOn).toLocaleDateString('en-GB')}</span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                        <Button
                          onClick={() => handleDownloadCert(verifyResult._id)}
                          className="bg-slate-100/50 text-slate-900 border border-slate-200/60 hover:bg-white/10 font-bold"
                        >
                          <Download className="h-4 w-4 mr-1.5" /> Download Verified PDF
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

          </AnimatePresence>

          {/* Bulk Issue Modal */}
          <AnimatePresence>
            {showBulkModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="bg-[#181d26] border border-slate-700/60 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col text-slate-100 font-sans"
                >
                  {/* Header */}
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-emerald-950/20 to-transparent">
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <FileSpreadsheet className="text-emerald-500" />
                        Bulk Issue Offer Letters
                      </h3>
                      <p className="text-slate-400 text-xs mt-0.5">Generate and email multiple offer letters simultaneously by uploading a CSV file.</p>
                    </div>
                    <button
                      onClick={() => setShowBulkModal(false)}
                      className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                      <Shield className="h-4 w-4 rotate-45" />
                    </button>
                  </div>

                  <form onSubmit={handleBulkOfferSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                    {/* Step 1: Upload CSV */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-[9px]">1</span>
                          Upload Candidate Data
                        </h4>
                        <Button
                          type="button"
                          variant="link"
                          onClick={handleDownloadBulkOfferSample}
                          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors p-0 h-auto font-bold"
                        >
                          <Download className="h-3 w-3" /> Download Sample CSV
                        </Button>
                      </div>
                      
                      <div className="p-6 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl bg-slate-900/50 hover:bg-slate-900/80 transition-all group relative cursor-pointer">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(e) => setBulkFile(e.target.files ? e.target.files[0] : null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center text-center py-4">
                          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-emerald-500/20">
                            <Upload className="h-5 w-5 text-emerald-500" />
                          </div>
                          <p className="text-white text-sm font-bold mb-0.5">
                            {bulkFile ? bulkFile.name : "Click or drag CSV file here"}
                          </p>
                          <p className="text-slate-400 text-[10px]">Supported format: .csv (UTF-8 encoding)</p>
                        </div>
                      </div>
                      
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                        <p className="text-emerald-300/80 text-[10px] leading-relaxed font-bold">
                          Required Columns: candidateName, email, position, department, salary, startDate (YYYY-MM-DD)
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Common Details */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                      <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-[9px]">2</span>
                        Common Offer Details
                        <span className="text-[9px] text-slate-500 normal-case font-normal">(Shared across all entries)</span>
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Joining Location</label>
                          <Input
                            type="text"
                            value={bulkCommon.joiningLocation}
                            onChange={(e) => setBulkCommon({...bulkCommon, joiningLocation: e.target.value})}
                            placeholder="e.g. Hoshiarpur"
                            className="h-10 bg-slate-900 border-slate-750 text-white text-xs"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Acceptance Deadline</label>
                          <Input
                            type="date"
                            value={bulkCommon.validUntil}
                            onChange={(e) => setBulkCommon({...bulkCommon, validUntil: e.target.value})}
                            className="h-10 bg-slate-900 border-slate-750 text-white text-xs"
                            required
                          />
                        </div>

                        <div className="col-span-full space-y-3 pt-2">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Contract Duration Mode:</span>
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                              <input
                                type="radio"
                                name="durationMode"
                                checked={durationMode === "calculate"}
                                onChange={() => setDurationMode("calculate")}
                                className="text-emerald-600 focus:ring-emerald-600 bg-slate-900 border-slate-700 h-3.5 w-3.5"
                              />
                              <span>By End Date</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                              <input
                                type="radio"
                                name="durationMode"
                                checked={durationMode === "manual"}
                                onChange={() => setDurationMode("manual")}
                                className="text-emerald-600 focus:ring-emerald-600 bg-slate-900 border-slate-700 h-3.5 w-3.5"
                              />
                              <span>Manual Duration</span>
                            </label>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {durationMode === "calculate" ? (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">End Date (Optional)</label>
                                <Input
                                  type="date"
                                  value={bulkCommon.endDate}
                                  onChange={(e) => setBulkCommon({...bulkCommon, endDate: e.target.value})}
                                  className="h-10 bg-slate-900 border-slate-750 text-white text-xs"
                                />
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Duration (Optional)</label>
                                <Input
                                  type="text"
                                  value={bulkCommon.duration}
                                  onChange={(e) => setBulkCommon({...bulkCommon, duration: e.target.value})}
                                  placeholder="e.g. 6 months"
                                  className="h-10 bg-slate-900 border-slate-750 text-white text-xs"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Work Mode</label>
                          <select
                            value={bulkCommon.workType}
                            onChange={(e) => setBulkCommon({...bulkCommon, workType: e.target.value as any})}
                            className="h-10 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold px-3 focus:outline-none focus:border-emerald-600 cursor-pointer text-white"
                          >
                            <option value="On-site">On-site</option>
                            <option value="Remote">Remote</option>
                            <option value="Hybrid">Hybrid</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Offer Type</label>
                          <select
                            value={bulkCommon.offerType}
                            onChange={(e) => setBulkCommon({...bulkCommon, offerType: e.target.value as any})}
                            className="h-10 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold px-3 focus:outline-none focus:border-emerald-600 cursor-pointer text-white"
                          >
                            <option value="Job">Job Offer</option>
                            <option value="Internship">Internship Offer</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Signature & Email settings */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                      <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-[9px]">3</span>
                        Signatory & Delivery Options
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">HR Contact Name</label>
                          <Input
                            type="text"
                            value={bulkCommon.hrContactName}
                            onChange={(e) => setBulkCommon({...bulkCommon, hrContactName: e.target.value})}
                            className="h-10 bg-slate-900 border-slate-750 text-white text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">HR Contact Email</label>
                          <Input
                            type="email"
                            value={bulkCommon.hrContactEmail}
                            onChange={(e) => setBulkCommon({...bulkCommon, hrContactEmail: e.target.value})}
                            className="h-10 bg-slate-900 border-slate-750 text-white text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">HR Contact Phone</label>
                          <Input
                            type="text"
                            value={bulkCommon.hrContactPhone}
                            onChange={(e) => setBulkCommon({...bulkCommon, hrContactPhone: e.target.value})}
                            className="h-10 bg-slate-900 border-slate-750 text-white text-xs"
                          />
                        </div>

                        <div className="col-span-full flex items-center gap-2 py-2">
                          <input
                            type="checkbox"
                            id="sendBulkEmails"
                            checked={bulkCommon.sendEmail}
                            onChange={(e) => setBulkCommon({...bulkCommon, sendEmail: e.target.checked})}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                          />
                          <label htmlFor="sendBulkEmails" className="text-xs text-slate-300 font-bold cursor-pointer">
                            Send dynamic PDF offer letters to candidate emails automatically
                          </label>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Footer */}
                  <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-[#13161c]">
                    <Button
                      type="button"
                      onClick={() => setShowBulkModal(false)}
                      className="h-10 px-5 rounded-xl border border-slate-700 text-slate-300 bg-transparent hover:bg-white/5 font-bold text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      onClick={handleBulkOfferSubmit}
                      disabled={bulkLoading || !bulkFile}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-slate-900 font-extrabold h-10 px-6 rounded-xl hover:from-emerald-500 hover:to-indigo-500 flex items-center gap-2 text-xs disabled:opacity-50"
                    >
                      {bulkLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Generating Letters...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Compile & Issue Bulk Offers</span>
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
