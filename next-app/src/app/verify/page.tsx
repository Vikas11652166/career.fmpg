"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ShieldCheck, Search, ArrowRight, CheckCircle, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CertificateSearchPage() {
  const [certId, setCertId] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = certId.trim().replace(/^FMPG[-\s]*/i, "");
    if (!cleanId) {
      toast.error("Please enter a valid certificate identifier.");
      return;
    }
    toast.info("Accessing digital credential registry...");
    router.push(`/verify/${cleanId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      <Navbar />

      {/* Decorative gradient glow panels */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <main className="flex-grow pt-28 pb-20 px-6 relative z-10 flex items-center justify-center bg-grid-pattern">
        <div className="max-w-md w-full">
          <Card className="rounded-[32px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden glass-panel relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            
            <CardHeader className="bg-primary/5 border-b border-border/20 py-8 text-center flex flex-col items-center">
              <div className="h-14 w-14 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center mb-4">
                <Award className="h-7 w-7" />
              </div>
              <CardTitle className="font-heading text-2xl font-black text-foreground">
                Verify Certificate
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1 max-w-xs">
                Validate digital internship certificates issued by FMPG Group's digital credential registry.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8 text-left">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                <div className="flex flex-col gap-2">
                  <label htmlFor="certId" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-1">
                    Certificate Code / ID
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <input
                      id="certId"
                      type="text"
                      required
                      value={certId}
                      onChange={(e) => setCertId(e.target.value)}
                      placeholder="e.g. FMPG-663F12BA or 663f..."
                      className="w-full h-11 pl-10 pr-4 bg-background/50 border border-border/40 focus:border-primary/60 rounded-xl text-xs font-semibold focus:outline-none transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 leading-relaxed pl-1">
                    Enter the full 24-character code or the short suffix listed on the document signature strip.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-2xl bg-primary text-white hover:bg-primary/95 font-extrabold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
                >
                  Verify Authenticity
                  <ArrowRight className="h-4 w-4" />
                </Button>

              </form>

              {/* Core Features Acknowledgment */}
              <div className="mt-8 pt-6 border-t border-border/20 flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                    Matches unique recipient profiles, domains, and issued date timestamps.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                    Allows immediate verified PDF credential downloads for hiring desks.
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
