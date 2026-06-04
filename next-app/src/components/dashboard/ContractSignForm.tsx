"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Landmark, User, Shield, ArrowRight, ArrowLeft, PenTool, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { submitContractSignatureAction } from "@/app/actions/contracts";
import { toast } from "sonner";

// Zod validation schema for contract details
const contractSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  nationality: z.string().min(2, "Nationality is required"),
  addressStreet: z.string().min(2, "Street address is required"),
  addressCity: z.string().min(2, "City is required"),
  addressState: z.string().min(2, "State is required"),
  addressZipCode: z.string().min(6, "Zip code must be 6 digits"),
  addressCountry: z.string().default("India"),
  emergencyName: z.string().min(2, "Contact name is required"),
  emergencyRelationship: z.string().min(2, "Relationship is required"),
  emergencyPhone: z.string().min(10, "Emergency phone must be 10 digits"),
  emergencyEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  idType: z.enum(["Aadhar", "PAN", "Passport", "Driving License", "Voter ID"]),
  idNumber: z.string().min(4, "Invalid ID number"),
  bankHolderName: z.string().min(2, "Holder name is required"),
  bankAccountNumber: z.string().min(6, "Account number is required"),
  bankName: z.string().min(2, "Bank name is required"),
  bankIfscCode: z.string().min(11, "IFSC must be 11 characters"),
  bankAccountType: z.enum(["Savings", "Current"]),
  bankBranch: z.string().min(2, "Branch is required"),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms of the agreement"),
  privacyPolicyAccepted: z.boolean().refine(val => val === true, "You must accept the privacy policy"),
  acceptanceComments: z.string().optional(),
});

type ContractValues = z.infer<typeof contractSchema>;

export default function ContractSignForm({ offer }: { offer: any }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractSubmitted, setContractSubmitted] = useState(false);

  // Canvas drawing references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      phone: "",
      dateOfBirth: "",
      nationality: "Indian",
      addressStreet: "",
      addressCity: "",
      addressState: "",
      addressZipCode: "",
      addressCountry: "India",
      emergencyName: "",
      emergencyRelationship: "",
      emergencyPhone: "",
      emergencyEmail: "",
      idType: "Aadhar",
      idNumber: "",
      bankHolderName: "",
      bankAccountNumber: "",
      bankName: "",
      bankIfscCode: "",
      bankAccountType: "Savings",
      bankBranch: "",
      termsAccepted: false,
      privacyPolicyAccepted: false,
      acceptanceComments: "",
    },
  });

  // Setup canvas drawings
  useEffect(() => {
    if (step === 3 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#0f172a"; // Slate Charcoal line
      }
    }
  }, [step]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleContractSubmit = async (data: any) => {
    if (!hasSigned) {
      toast.error("Please draw your digital signature on the signature pad");
      return;
    }

    try {
      setIsSubmitting(true);
      toast.info("Validating signature and uploading agreement contract...");

      // Serialize nested schema data
      const payload = {
        phone: data.phone,
        personalInfo: {
          dateOfBirth: new Date(data.dateOfBirth),
          nationality: data.nationality,
          address: {
            street: data.addressStreet,
            city: data.addressCity,
            state: data.addressState,
            zipCode: data.addressZipCode,
            country: data.addressCountry,
          },
          emergencyContact: {
            name: data.emergencyName,
            relationship: data.emergencyRelationship,
            phone: data.emergencyPhone,
            email: data.emergencyEmail || undefined,
          },
          identificationDocuments: {
            idType: data.idType,
            idNumber: data.idNumber,
          },
        },
        bankingInfo: {
          accountHolderName: data.bankHolderName,
          accountNumber: data.bankAccountNumber,
          bankName: data.bankName,
          ifscCode: data.bankIfscCode,
          accountType: data.bankAccountType,
          branch: data.bankBranch,
        },
        acceptanceComments: data.acceptanceComments,
        termsAccepted: data.termsAccepted,
        privacyPolicyAccepted: data.privacyPolicyAccepted,
        ipAddress: "127.0.0.1", // standard server action fallback IP
      };

      const res = await submitContractSignatureAction(offer._id, payload);

      if (res.success) {
        toast.success("Offer accepted and contract submitted successfully!");
        setContractSubmitted(true);
      } else {
        toast.error(res.message || "Failed to submit contract");
      }
    } catch (error) {
      console.error("Contract submit failed:", error);
      toast.error("An internal error occurred during contract signing");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (contractSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto rounded-3xl border border-primary/20 shadow-xl overflow-hidden glass-panel animate-fade-in-up mt-24">
        <div className="bg-primary/5 py-12 px-6 text-center flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <CardTitle className="font-heading text-2xl font-black text-foreground">Welcome to FMPG!</CardTitle>
          <CardDescription className="max-w-md text-sm text-muted-foreground leading-relaxed">
            Your accepted employment contract for the <strong>{offer.position}</strong> position has been submitted successfully.
          </CardDescription>
        </div>
        <CardContent className="p-8 flex flex-col gap-6 text-left">
          <div className="p-6 rounded-2xl bg-muted/30 border border-border/20 flex flex-col gap-3.5 text-xs text-muted-foreground font-semibold">
            <h4 className="text-foreground text-sm font-bold uppercase tracking-wider mb-1">Onboarding Details</h4>
            <p>1. HR will review your bank credentials and document proof details (typically within 48 hours).</p>
            <p>2. Once verified, your status will change to Active Employee, and you'll receive your unique Employee ID.</p>
            <p>3. You can download the signed PDF contract copy directly from your dashboard anytime!</p>
          </div>
          <Button
            onClick={() => {
              router.push("/dashboard");
              router.refresh();
            }}
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 mt-24">
      {/* Dynamic Header */}
      <div className="flex flex-col gap-2 items-start text-left pl-2">
        <span className="text-primary font-black text-[10px] tracking-widest uppercase border border-primary/20 bg-primary/5 px-3 py-1 rounded-full">
          Onboarding Contract
        </span>
        <h1 className="font-heading text-3xl font-extrabold text-foreground tracking-tight mt-1">Review & Sign Agreement</h1>
        <p className="text-xs font-semibold text-muted-foreground">Position: {offer.position} · {offer.department} · {offer.workType} stay</p>
      </div>

      <Card className="rounded-3xl border border-border/40 shadow-xl overflow-hidden glass-panel">
        <CardHeader className="bg-muted/30 border-b border-border/20 py-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm uppercase tracking-wider font-extrabold text-foreground">
                {step === 1 ? "Step 1: Address & Identification" : step === 2 ? "Step 2: Onboarding Banking Coordinates" : "Step 3: Signature & Acceptance"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {step === 1 
                  ? "Enter DOB, residential address, and identity proof details" 
                  : step === 2 
                    ? "Verify account details for payroll setup" 
                    : "Draw your signature on the interactive canvas block"}
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
          <form onSubmit={handleSubmit(handleContractSubmit)} className="space-y-6">
            
            {/* STEP 1: Personal address, DOB, Identification proofs */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in-up text-left">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Contact Phone *</label>
                    <Input {...register("phone")} placeholder="9876543210" />
                    {errors.phone && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.phone.message}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Date of Birth *</label>
                    <Input type="date" {...register("dateOfBirth")} />
                    {errors.dateOfBirth && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.dateOfBirth.message}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Nationality *</label>
                    <Input {...register("nationality")} placeholder="e.g. Indian" />
                    {errors.nationality && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.nationality.message}</p>}
                  </div>
                </div>

                {/* Identity proofs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-2xl bg-muted/20 border border-border/30">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">ID Proof Document Type *</label>
                    <select
                      {...register("idType")}
                      className="h-11 rounded-2xl bg-background border border-input text-sm px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer font-semibold"
                    >
                      <option value="Aadhar">Aadhar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Voter ID">Voter ID</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">ID Number / Reference ID *</label>
                    <Input {...register("idNumber")} placeholder="Enter document number..." />
                    {errors.idNumber && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.idNumber.message}</p>}
                  </div>
                </div>

                {/* Permanent address details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground pl-1 mt-3">Permanent Address Details</h4>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Street Address *</label>
                    <Input {...register("addressStreet")} placeholder="House No, Road, Locality..." />
                    {errors.addressStreet && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.addressStreet.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">City *</label>
                      <Input {...register("addressCity")} placeholder="e.g. Hoshiarpur" />
                      {errors.addressCity && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.addressCity.message}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">State *</label>
                      <Input {...register("addressState")} placeholder="e.g. Punjab" />
                      {errors.addressState && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.addressState.message}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Zip Code *</label>
                      <Input {...register("addressZipCode")} placeholder="e.g. 146001" />
                      {errors.addressZipCode && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.addressZipCode.message}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Country</label>
                      <Input {...register("addressCountry")} placeholder="India" disabled />
                    </div>
                  </div>
                </div>

                {/* Emergency details */}
                <div className="space-y-4 pt-3 border-t border-border/20 mt-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground pl-1">Emergency Contact Coordinate</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Contact Name *</label>
                      <Input {...register("emergencyName")} placeholder="e.g. Parents Name" />
                      {errors.emergencyName && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.emergencyName.message}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Relationship *</label>
                      <Input {...register("emergencyRelationship")} placeholder="e.g. Father, Mother" />
                      {errors.emergencyRelationship && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.emergencyRelationship.message}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Contact Phone *</label>
                      <Input {...register("emergencyPhone")} placeholder="Emergency phone..." />
                      {errors.emergencyPhone && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.emergencyPhone.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Stepper buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-border/20 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                  >
                    Back to Dashboard
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1"
                  >
                    Banking Setup <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Banking coordinates */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in-up text-left">
                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3 text-xs text-primary font-bold">
                  <Landmark className="h-5 w-5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-heading font-black">Payroll Setup</h4>
                    <p className="mt-0.5 text-muted-foreground font-semibold leading-relaxed">
                      Please enter correct routing bank details. This account is locked in for employee salary payouts, audits, and compliance setups.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Account Holder Name *</label>
                    <Input {...register("bankHolderName")} placeholder="Exact name as in bank records..." />
                    {errors.bankHolderName && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.bankHolderName.message}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Account Number *</label>
                    <Input {...register("bankAccountNumber")} placeholder="Account number..." />
                    {errors.bankAccountNumber && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.bankAccountNumber.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Bank Name *</label>
                    <Input {...register("bankName")} placeholder="e.g. HDFC Bank, SBI" />
                    {errors.bankName && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.bankName.message}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">IFSC Routing Code *</label>
                    <Input {...register("bankIfscCode")} placeholder="e.g. HDFC0001234" maxLength={11} />
                    {errors.bankIfscCode && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.bankIfscCode.message}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Account Type *</label>
                    <select
                      {...register("bankAccountType")}
                      className="h-11 rounded-2xl bg-background border border-input text-sm px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer font-semibold"
                    >
                      <option value="Savings">Savings Account</option>
                      <option value="Current">Current Account</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Bank Branch Name *</label>
                  <Input {...register("bankBranch")} placeholder="Branch office city/area..." />
                  {errors.bankBranch && <p className="text-[10px] text-destructive pl-2 font-bold">{errors.bankBranch.message}</p>}
                </div>

                {/* Stepper buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-border/20 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Personal Address
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex items-center gap-1"
                  >
                    Sign Agreement <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Legal Terms & Signature Canvas */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in-up text-left">
                {/* Legal Summary scroll block */}
                <div className="p-6 rounded-2xl border border-border/40 bg-muted/10 max-h-56 overflow-y-auto text-xs text-muted-foreground font-semibold leading-relaxed space-y-3">
                  <h4 className="text-foreground text-sm font-bold uppercase tracking-wider mb-2">Legal Compliance Agreement</h4>
                  <p>1. <strong>Employment Offer:</strong> You agree to join FMPG under the position, department, and salary coordinates specified in your offer letter dated <strong>{new Date(offer.issuedOn).toLocaleDateString('en-GB')}</strong>.</p>
                  <p>2. <strong>Autonomy & Confidences:</strong> You agree to keep all internal tenant registries, PG lists, system passwords, and Cloudinary storage paths strictly confidential during and after your association.</p>
                  <p>3. <strong>Termination & concluir:</strong> ConConclusion of employment triggers conclusions in system permissions. Any unauthorized exports conclur conclusions of legal agreements.</p>
                </div>

                {/* Terms checkboxes */}
                <div className="space-y-2.5 p-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-muted-foreground">
                    <input
                      type="checkbox"
                      {...register("termsAccepted")}
                      className="mt-0.5 accent-primary shrink-0"
                    />
                    <span className="leading-relaxed">I have read, understood, and accept all terms of the employment agreement. *</span>
                  </label>
                  {errors.termsAccepted && <p className="text-[10px] text-destructive pl-6 font-bold">{errors.termsAccepted.message}</p>}

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-muted-foreground">
                    <input
                      type="checkbox"
                      {...register("privacyPolicyAccepted")}
                      className="mt-0.5 accent-primary shrink-0"
                    />
                    <span className="leading-relaxed">I accept FMPG's data safety policy and authorize banking validation. *</span>
                  </label>
                  {errors.privacyPolicyAccepted && <p className="text-[10px] text-destructive pl-6 font-bold">{errors.privacyPolicyAccepted.message}</p>}
                </div>

                {/* Interactive Drawing Canvas Signature Pad */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2 flex items-center gap-1">
                    <PenTool className="h-3 w-3 text-primary" /> Digital Signature DrawPad *
                  </label>
                  <div className="relative border-2 border-dashed border-border/80 bg-muted/5 rounded-2xl overflow-hidden flex flex-col items-center p-3 gap-2">
                    
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={200}
                      className="bg-card rounded-xl border border-border/30 max-w-full cursor-crosshair touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />

                    <div className="flex justify-between items-center w-full max-w-[600px] text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1">
                      <span>Draw signature inside boundary</span>
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="text-destructive hover:underline cursor-pointer"
                      >
                        Clear Signature
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional acceptance comment */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Acceptance Comments (Optional)</label>
                  <textarea
                    {...register("acceptanceComments")}
                    rows={2}
                    className="flex w-full rounded-2xl border border-input bg-transparent px-4 py-3 text-xs shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground font-semibold"
                    placeholder="Add comments or notes for HR..."
                  />
                </div>

                {/* Stepper buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-border/20 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Banking Coordinates
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />} Sign & Submit Contract
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
