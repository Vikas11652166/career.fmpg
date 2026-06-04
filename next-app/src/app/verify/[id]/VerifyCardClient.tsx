"use client";

import React, { useState } from "react";
import { downloadCertificateBase64Action } from "@/app/actions/certificates";
import { CheckCircle2, Download, ShieldCheck, Award, Calendar, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function VerifyCardClient({ initialCert }: { initialCert: any }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    toast.info("Generating secure certificate PDF...");
    try {
      const res = await downloadCertificateBase64Action(initialCert._id);
      if (res.success && res.data) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${res.data}`;
        link.download = `FMPG-Certificate-${initialCert._id.substring(initialCert._id.length - 8).toUpperCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Certificate downloaded successfully!");
      } else {
        toast.error(res.message || "Failed to download PDF");
      }
    } catch (err) {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="rounded-[32px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden glass-panel relative">
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
      
      {/* Verified Header Header */}
      <CardHeader className="bg-primary/5 border-b border-border/20 py-8 text-center flex flex-col items-center">
        <div className="h-16 w-16 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="h-9 w-9" />
        </div>
        <CardTitle className="font-heading text-2xl font-black text-foreground">
          Credential Authenticated
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1 max-w-sm">
          FMPG secure credential registry has successfully matched and verified this certificate.
        </CardDescription>
      </CardHeader>

      {/* Main Details Body */}
      <CardContent className="p-8 flex flex-col gap-6 text-xs font-semibold text-muted-foreground text-left">
        <div className="flex flex-col gap-1 pb-4 border-b border-border/20">
          <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Recipient Name</span>
          <span className="text-lg font-black text-foreground">{initialCert.name}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/20">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Department Domain</span>
            <span className="text-sm font-bold text-foreground">{initialCert.domain}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Job Role</span>
            <span className="text-sm font-bold text-foreground">{initialCert.jobrole}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/20">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Start Date</span>
            <span className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> {new Date(initialCert.fromDate).toLocaleDateString('en-GB')}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">End Date</span>
            <span className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> {new Date(initialCert.toDate).toLocaleDateString('en-GB')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/20">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Certificate ID</span>
            <span className="text-sm font-black text-primary font-mono mt-0.5">
              FMPG-{initialCert._id.substring(initialCert._id.length - 8).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Issued On</span>
            <span className="text-sm font-bold text-foreground mt-0.5">
              {new Date(initialCert.issuedOn).toLocaleDateString('en-GB')}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Credential Status</span>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary w-fit font-extrabold">
            <CheckCircle2 className="h-4 w-4" /> Official FMPG Digital Document Verified
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
            Download Verified PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
