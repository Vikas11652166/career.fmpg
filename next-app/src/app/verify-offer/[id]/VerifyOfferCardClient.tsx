"use client";

import React, { useState } from "react";
import { downloadOfferLetterBase64Action } from "@/app/actions/contracts";
import { CheckCircle2, Download, ShieldCheck, FileText, Calendar, Loader2, XCircle, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function VerifyOfferCardClient({ initialOffer }: { initialOffer: any }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    toast.info("Generating secure offer letter PDF...");
    try {
      const res = await downloadOfferLetterBase64Action(initialOffer._id);
      if (res.success && res.data) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${res.data}`;
        link.download = `FMPG-Offer-${initialOffer._id.substring(initialOffer._id.length - 8).toUpperCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Offer letter downloaded successfully!");
      } else {
        toast.error(res.message || "Failed to download PDF");
      }
    } catch (err) {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Accepted":
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          classes: "bg-primary/5 border-primary/20 text-primary",
          label: "Offer Accepted & Active"
        };
      case "Rejected":
        return {
          icon: <XCircle className="h-4 w-4" />,
          classes: "bg-destructive/5 border-destructive/20 text-destructive",
          label: "Offer Declined / Rejected"
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          classes: "bg-secondary/5 border-secondary/20 text-secondary",
          label: "Offer Extended & Pending"
        };
    }
  };

  const statusConfig = getStatusConfig(initialOffer.status);

  return (
    <Card className="rounded-[32px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden glass-panel relative text-left">
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
      
      {/* Verified Header */}
      <CardHeader className="bg-primary/5 border-b border-border/20 py-8 text-center flex flex-col items-center">
        <div className="h-16 w-16 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="h-9 w-9" />
        </div>
        <CardTitle className="font-heading text-2xl font-black text-foreground">
          Offer Letter Verified
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1 max-w-sm">
          FMPG contract registry has successfully matched and verified this employment offer.
        </CardDescription>
      </CardHeader>

      {/* Main Details Body */}
      <CardContent className="p-8 flex flex-col gap-6 text-xs font-semibold text-muted-foreground">
        
        <div className="flex flex-col gap-1 pb-4 border-b border-border/20">
          <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Candidate Name</span>
          <span className="text-lg font-black text-foreground">{initialOffer.candidateName}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/20">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Department Domain</span>
            <span className="text-sm font-bold text-foreground">{initialOffer.department}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Designated Position</span>
            <span className="text-sm font-bold text-foreground">{initialOffer.position}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/20">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Start Date</span>
            <span className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> {new Date(initialOffer.startDate).toLocaleDateString('en-GB')}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Issued On</span>
            <span className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> {new Date(initialOffer.issuedOn).toLocaleDateString('en-GB')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/20">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Offer Letter ID</span>
            <span className="text-sm font-black text-primary font-mono mt-0.5">
              FMPG-OFF-{initialOffer._id.substring(initialOffer._id.length - 8).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Offer Type</span>
            <span className="text-sm font-bold text-foreground mt-0.5">
              {initialOffer.offerType || "Job Offer"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Verification Status</span>
          <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border w-fit font-extrabold ${statusConfig.classes}`}>
            {statusConfig.icon} {statusConfig.label}
          </div>
        </div>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 bg-primary text-white hover:bg-primary/90 font-extrabold h-12 rounded-2xl flex items-center justify-center gap-2"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PDF Offer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
