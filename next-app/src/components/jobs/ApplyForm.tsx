"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileUp, Loader2, ArrowRight, ArrowLeft, Send, Sparkles, CheckCircle2, User, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseUploadedResumeAction, submitApplicationAction } from "@/app/actions/applications";
import { toast } from "sonner";

// Zod schema for validation
const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  location: z.string().optional(),
  education: z.string().optional(),
  experience: z.string().optional(),
  skills: z.array(z.string()).default([]),
  coverLetter: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ApplyForm({ job }: { job: any }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Document storage states
  const [resumeData, setResumeData] = useState<{ url: string; publicId: string; name: string } | null>(null);
  const [skillsInput, setSkillsInput] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Questionnaire responses state
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      education: "",
      experience: "",
      skills: [],
      coverLetter: "",
    },
  });

  const skillsList = watch("skills") || [];

  // Handle Drag & Drop / File Selection Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Resume file is too large (maximum 10MB limit)");
      return;
    }

    try {
      setIsUploading(true);
      toast.info("Uploading resume to secure Cloudinary storage...");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload request failed");
      }

      const uploadResult = await res.json();
      setResumeData({
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        name: uploadResult.fileName,
      });

      toast.success("Resume uploaded successfully!");

      // Start Heuristic Resume Parsing Action
      setIsParsing(true);
      toast.info("AI Heuristics Reading and Parsing Resume...");

      // Use the pre-parsed data from upload API route if available, otherwise run fallback download & parse
      let parseResult = uploadResult.parsedData 
        ? { success: true, data: uploadResult.parsedData } 
        : null;

      if (!parseResult) {
        console.log("Pre-parsed data missing. Running fallback parseUploadedResumeAction...");
        parseResult = await parseUploadedResumeAction(uploadResult.url, uploadResult.fileName);
      }

      if (parseResult && parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
        
        // Auto fill form inputs
        if (parsed.personalInfo.name) setValue("fullName", parsed.personalInfo.name);
        if (parsed.personalInfo.email) setValue("email", parsed.personalInfo.email);
        if (parsed.personalInfo.phone) setValue("phone", parsed.personalInfo.phone);
        if (parsed.personalInfo.location) setValue("location", parsed.personalInfo.location);
        
        // Format education text block
        if (parsed.education && parsed.education.length > 0) {
          const eduBlock = parsed.education
            .map((edu: any) => `${edu.degree || "Degree"} from ${edu.institution || "Institution"} (${edu.year || "Year"})`)
            .join("\n");
          setValue("education", eduBlock);
        }

        // Format experience text block
        if (parsed.experience && parsed.experience.length > 0) {
          const expBlock = parsed.experience
            .map((exp: any) => `${exp.title || "Role"} at ${exp.company || "Company"} (${exp.duration || "Duration"})`)
            .join("\n");
          setValue("experience", expBlock);
        }

        // Format skills tags
        if (parsed.skills && parsed.skills.length > 0) {
          setValue("skills", parsed.skills);
        }

        toast.success("Resume read successfully! Forms pre-filled.");
        setStep(2); // Automatically advance
      } else {
        toast.error("Resume read completed, but couldn't parse structured fields automatically. Please verify details manually.");
        setStep(2);
      }
    } catch (error) {
      console.error("Resume upload/parsing error:", error);
      toast.error("Heuristics parsing failed. Please verify credentials manually.");
      setStep(2);
    } finally {
      setIsUploading(false);
      setIsParsing(false);
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && skillsInput.trim()) {
      e.preventDefault();
      if (!skillsList.includes(skillsInput.trim())) {
        setValue("skills", [...skillsList, skillsInput.trim()]);
      }
      setSkillsInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setValue(
      "skills",
      skillsList.filter((s) => s !== skillToRemove)
    );
  };

  const handleQuestionAnswer = (qId: string, text: string, type: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        questionId: qId,
        questionText: text,
        questionType: type,
        answer: value,
      },
    }));
  };

  const handleFormSubmit = async (data: any) => {
    if (!resumeData) {
      toast.error("Please upload a resume first");
      setStep(1);
      return;
    }

    if (!recaptchaValue) {
      toast.error("Please complete the reCAPTCHA challenge before submitting.");
      return;
    }

    // Validate questionnaire answers
    if (job.questions && job.questions.length > 0) {
      for (const q of job.questions) {
        if (q.required) {
          const ans = answers[q._id];
          if (
            !ans ||
            (typeof ans.answer === "string" && !ans.answer.trim()) ||
            (Array.isArray(ans.answer) && ans.answer.length === 0) ||
            (q.questionType === "file" && !ans.answer)
          ) {
            toast.error(`Please answer the required question: "${q.questionText}"`);
            setStep(3);
            return;
          }
        }
      }
    }

    try {
      setIsSubmitting(true);

      // Serialize questions answers for application schema
      const serializedAnswers = Object.values(answers);

      const submissionPayload = {
        jobId: job._id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        location: data.location,
        education: data.education,
        experience: data.experience,
        skills: data.skills,
        coverLetter: data.coverLetter,
        resumeUrl: resumeData.url,
        cloudinaryPublicId: resumeData.publicId,
        questionAnswers: serializedAnswers,
        recaptchaToken: recaptchaValue,
      };

      const res = await submitApplicationAction(submissionPayload);

      if (res.success) {
        toast.success("Application submitted successfully!");
        setFormSubmitted(true);
      } else {
        toast.error(res.message || "Failed to submit application");
      }
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error("Internal submission error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (formSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto rounded-3xl border border-primary/20 shadow-xl overflow-hidden glass-panel animate-fade-in-up mt-24">
        <div className="bg-primary/5 py-12 px-6 text-center flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <CardTitle className="font-heading text-2xl font-black text-foreground">Application Received!</CardTitle>
          <CardDescription className="max-w-md text-sm text-muted-foreground leading-relaxed">
            Thank you for applying for the <strong>{job.title}</strong> opening at FMPG. We've successfully received your credentials!
          </CardDescription>
        </div>
        <CardContent className="p-8 flex flex-col gap-6 text-left">
          <div className="p-6 rounded-2xl bg-muted/30 border border-border/20 flex flex-col gap-3.5 text-xs text-muted-foreground font-semibold">
            <h4 className="text-foreground text-sm font-bold uppercase tracking-wider mb-1">What happens next?</h4>
            <p>1. Our hiring team will review your parsed resume details and dynamic questionnaire responses.</p>
            <p>2. We will contact you via email (<strong>{watch("email")}</strong>) or phone to arrange interview steps.</p>
            <p>3. You can log in or register an account using this email to track live applications in your Dashboard!</p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => router.push("/jobs")}
              variant="outline"
              className="flex-1"
            >
              Browse Openings
            </Button>
            <Button
              onClick={() => router.push("/dashboard")}
              className="flex-1"
            >
              My Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 mt-24">
      {/* Dynamic Header */}
      <div className="flex flex-col gap-2 items-start text-left pl-2">
        <span className="text-primary font-black text-[10px] tracking-widest uppercase border border-primary/20 bg-primary/5 px-3 py-1 rounded-full">
          Applying for Opening
        </span>
        <h1 className="font-heading text-3xl font-extrabold text-foreground tracking-tight mt-1">{job.title}</h1>
        <p className="text-xs font-semibold text-muted-foreground">{job.company} · {job.location || "Hoshiarpur"} · {job.type}</p>
      </div>

      <Card className="rounded-3xl border border-border/40 shadow-xl overflow-hidden glass-panel">
        <CardHeader className="bg-muted/30 border-b border-border/20 py-5">
          {/* Form Step Indicator */}
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm uppercase tracking-wider font-extrabold text-foreground">
                {step === 1 ? "Step 1: Smart Resume Parsing" : step === 2 ? "Step 2: Verify Credentials" : "Step 3: Custom Questionnaire"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {step === 1 
                  ? "Drop your PDF/DOCX to automatically prefill standard form inputs using AI heuristics" 
                  : step === 2 
                    ? "Check, adjust, and complete your professional details" 
                    : "Answer opening-specific evaluation questions"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 w-8 rounded-full transition-all duration-300 ${
                    s === step ? "bg-primary" : s < step ? "bg-primary/45" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            
            {/* STEP 1: Upload & Heuristics Parsing */}
            {step === 1 && (
              <div className="flex flex-col items-center justify-center gap-6 py-8">
                {isUploading || isParsing ? (
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <div>
                      <h3 className="font-heading font-bold text-foreground">
                        {isUploading ? "Uploading Resume Buffer..." : "AI Heuristics Reading Resume..."}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                        Processing buffer, extracting skills, location coordinates, experience years, and degree qualifications.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-xl">
                    <label className="border-2 border-dashed border-border/60 hover:border-primary/50 rounded-3xl p-10 flex flex-col items-center justify-center gap-3.5 text-center cursor-pointer transition-all bg-muted/10 hover:bg-primary/5">
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                        <FileUp className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-foreground">Drag & drop resume here</h3>
                        <p className="text-xs text-muted-foreground mt-1">Supports PDF, DOCX, or DOC (maximum 10MB)</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 text-secondary text-[9px] font-black uppercase tracking-wider mt-2 animate-pulse">
                        <Sparkles className="h-3 w-3" /> Auto Prefill Form
                      </span>
                    </label>

                    {resumeData && (
                      <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs text-primary font-bold">
                        <span className="truncate">Uploaded: {resumeData.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setStep(2)}
                          className="flex items-center gap-1 hover:bg-primary/10"
                        >
                          Verify Form <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Profile details */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in-up text-left">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2 flex items-center gap-1">
                      <User className="h-3 w-3 text-primary" /> Full Name *
                    </label>
                    <Input {...register("fullName")} placeholder="John Doe" />
                    {errors.fullName && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.fullName.message}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2 flex items-center gap-1">
                      <Mail className="h-3 w-3 text-primary" /> Email Address *
                    </label>
                    <Input type="email" {...register("email")} placeholder="john@example.com" />
                    {errors.email && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.email.message}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-primary" /> Phone Number *
                    </label>
                    <Input {...register("phone")} placeholder="9876543210" />
                    {errors.phone && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.phone.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary" /> Location / Address
                    </label>
                    <Input {...register("location")} placeholder="e.g. Hoshiarpur, Punjab" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">
                      Technical Skills / Tag Accent (Press Enter to add)
                    </label>
                    <div className="flex flex-col gap-2">
                      <Input
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                        placeholder="e.g. React, Node.js, Mongoose"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {skillsList.map((skill) => (
                          <Badge
                            key={skill}
                            variant="success"
                            className="flex items-center gap-1 text-[10px] font-bold"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="hover:text-destructive shrink-0 cursor-pointer"
                            >
                              &times;
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Education Background</label>
                    <textarea
                      {...register("education")}
                      rows={4}
                      className="flex w-full rounded-2xl border border-input bg-transparent px-4 py-3 text-xs shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground font-semibold"
                      placeholder="e.g. Bachelor of Technology in CSE from UIET Hoshiarpur (2025)"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Professional Experience</label>
                    <textarea
                      {...register("experience")}
                      rows={4}
                      className="flex w-full rounded-2xl border border-input bg-transparent px-4 py-3 text-xs shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground font-semibold"
                      placeholder="e.g. Frontend Intern at FMPG co-living (6 months)"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Cover Letter / Pitch</label>
                  <textarea
                    {...register("coverLetter")}
                    rows={4}
                    className="flex w-full rounded-2xl border border-input bg-transparent px-4 py-3 text-xs shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground font-semibold"
                    placeholder="Briefly state why you're a perfect match for FMPG..."
                  />
                </div>

                {/* reCAPTCHA validation layer (only shown on final step) */}
                {(!job.questions || job.questions.length === 0) && (
                  <div className="flex justify-center my-2 border-t border-border/20 pt-4">
                    <ReCAPTCHAWidget
                      siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                      onChange={(token) => setRecaptchaValue(token)}
                    />
                  </div>
                )}

                {/* Bottom triggers */}
                <div className="flex items-center justify-between pt-4 border-t border-border/20 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Upload Settings
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => {
                      if (job.questions && job.questions.length > 0) {
                        setStep(3);
                      } else {
                        handleSubmit(handleFormSubmit)();
                      }
                    }}
                    className="flex items-center gap-1"
                  >
                    {job.questions && job.questions.length > 0 ? (
                      <>
                        Answer Questionnaire <ArrowRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit Application
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Job Questionnaire */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in-up text-left">
                {job.questions.map((q: any) => (
                  <div key={q._id} className="flex flex-col gap-2 p-5 rounded-2xl bg-muted/20 border border-border/30">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      {q.questionText} {q.required && <span className="text-destructive font-black">*</span>}
                    </label>

                    {q.questionType === "text" && (
                      <textarea
                        required={q.required}
                        value={answers[q._id]?.answer || ""}
                        onChange={(e) => handleQuestionAnswer(q._id, q.questionText, q.questionType, e.target.value)}
                        rows={4}
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-600 transition-colors text-xs resize-none placeholder:text-slate-500 font-semibold"
                        placeholder="Describe your thoughts..."
                      />
                    )}

                    {q.questionType === "multipleChoice" && (
                      <div className="flex flex-wrap gap-3 mt-1.5">
                        {q.options.map((opt: string) => {
                          const isSelected = answers[q._id]?.answer === opt;
                          return (
                            <label key={opt} className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer text-xs font-semibold transition-all duration-350 ${
                              isSelected ? "bg-emerald-600/10 border-emerald-600 text-white animate-pulse" : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                            }`}>
                              <input
                                type="radio"
                                name={q._id}
                                value={opt}
                                checked={isSelected}
                                required={q.required && !answers[q._id]?.answer}
                                onChange={(e) => handleQuestionAnswer(q._id, q.questionText, q.questionType, e.target.value)}
                                className="accent-emerald-600 h-3.5 w-3.5"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {q.questionType === "checkbox" && (
                      <div className="flex flex-wrap gap-3 mt-1.5">
                        {q.options.map((opt: string) => {
                          const currentSelected = answers[q._id]?.answer || [];
                          const checked = Array.isArray(currentSelected) && currentSelected.includes(opt);
                          return (
                            <label key={opt} className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer text-xs font-semibold transition-all duration-350 ${
                              checked ? "bg-emerald-600/10 border-emerald-600 text-white animate-pulse" : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                            }`}>
                              <input
                                type="checkbox"
                                value={opt}
                                checked={checked}
                                onChange={(e) => {
                                  let newSel;
                                  if (e.target.checked) {
                                    newSel = [...currentSelected, opt];
                                  } else {
                                    newSel = currentSelected.filter((s: string) => s !== opt);
                                  }
                                  handleQuestionAnswer(q._id, q.questionText, q.questionType, newSel);
                                }}
                                className="accent-emerald-600 h-3.5 w-3.5"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {q.questionType === "file" && (
                      <div className="mt-1.5">
                        <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-all bg-slate-900/50 hover:bg-slate-900/80 cursor-pointer ${
                          answers[q._id]?.answer ? "border-emerald-600 bg-emerald-600/5" : "border-slate-700 hover:border-emerald-600/50"
                        }`}>
                          <input
                            type="file"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              
                              const toastId = toast.loading(`Uploading file evidence: ${file.name}...`);
                              try {
                                const formData = new FormData();
                                formData.append("file", file);
                                
                                const res = await fetch("/api/upload", {
                                  method: "POST",
                                  body: formData,
                                });
                                
                                if (!res.ok) throw new Error("Upload failed");
                                const result = await res.json();
                                
                                handleQuestionAnswer(q._id, q.questionText, q.questionType, file.name);
                                setAnswers((prev) => ({
                                  ...prev,
                                  [q._id]: {
                                    ...prev[q._id],
                                    fileUrl: result.url
                                  }
                                }));
                                toast.success("Evidence file uploaded successfully!", { id: toastId });
                              } catch (err: any) {
                                toast.error(err.message || "Failed to upload file evidence", { id: toastId });
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            required={q.required && !answers[q._id]?.answer}
                          />
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className={`mb-3 p-3 rounded-xl border transition-all ${
                              answers[q._id]?.answer ? "bg-emerald-600 text-slate-900 border-emerald-500" : "bg-slate-800 border-slate-700 text-slate-500"
                            }`}>
                              <FileUp className="h-5 w-5" />
                            </div>
                            <p className="text-white text-xs font-bold mb-0.5">
                              {answers[q._id]?.answer ? answers[q._id].answer : "Select evidence file to continue"}
                            </p>
                            <p className="text-slate-400 text-[10px] uppercase tracking-wider">
                              Supporting Evidence Protocol / Max 10MB
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {q.questionType === "rating" && (
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {Array.from({ length: q.maxRating || 5 }).map((_, i) => {
                          const rateVal = i + 1;
                          const currentRate = answers[q._id]?.answer || 0;
                          const isActive = rateVal <= currentRate;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleQuestionAnswer(q._id, q.questionText, q.questionType, rateVal)}
                              className={`h-9 w-9 rounded-xl border text-xs font-black flex items-center justify-center transition-all duration-300 ${
                                isActive
                                  ? "bg-emerald-600 text-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10"
                                  : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                              }`}
                            >
                              {rateVal}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* reCAPTCHA validation layer (only shown on final step) */}
                <div className="flex justify-center my-2 border-t border-border/20 pt-4">
                  <ReCAPTCHAWidget
                    siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                    onChange={(token) => setRecaptchaValue(token)}
                  />
                </div>

                {/* Bottom triggers */}
                <div className="flex items-center justify-between pt-4 border-t border-border/20 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Verify Details
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit Application
                  </Button>
                </div>
              </div>
            )}

          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ReCAPTCHAWidget({
  siteKey,
  onChange,
}: {
  siteKey: string;
  onChange: (token: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Define global callback
    (window as any).onloadRecaptchaCallback = () => {
      if ((window as any).grecaptcha && containerRef.current && widgetIdRef.current === null) {
        try {
          const id = (window as any).grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => onChange(token),
            "expired-callback": () => onChange(null),
            theme: "dark",
          });
          widgetIdRef.current = id;
        } catch (err) {
          console.warn("reCAPTCHA render error:", err);
        }
      }
    };

    if (!(window as any).grecaptcha) {
      if (!document.getElementById("recaptcha-script")) {
        const script = document.createElement("script");
        script.id = "recaptcha-script";
        script.src = "https://www.google.com/recaptcha/api.js?onload=onloadRecaptchaCallback&render=explicit";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    } else {
      if (containerRef.current && widgetIdRef.current === null) {
        (window as any).onloadRecaptchaCallback();
      }
    }
  }, [siteKey, onChange]);

  return <div ref={containerRef} className="my-4 flex justify-center" />;
}
