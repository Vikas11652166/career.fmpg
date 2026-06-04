import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getJobBySlugAction } from "@/app/actions/jobs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { MapPin, Briefcase, DollarSign, Calendar, ChevronLeft, ArrowRight, UserCheck, ShieldAlert, Award, Star } from "lucide-react";
import { formatCurrencyValue } from "@/lib/currencyFormatter";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getJobBySlugAction(slug);
  if (!res.success || !res.data) {
    return {
      title: "Job Opening Not Found | FMPG Careers",
    };
  }

  const job = res.data as any;
  return {
    title: `${job.title} | FMPG Careers`,
    description: job.description?.substring(0, 160) || `Apply for the ${job.title} position at FMPG. Join our elite team.`,
  };
}

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getJobBySlugAction(slug);

  if (!res.success || !res.data) {
    notFound();
  }

  const job = res.data as any;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 bg-grid-pattern relative">
        {/* Glow Effects */}
        <div className="absolute top-20 left-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          {/* Back Button */}
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors mb-8 group"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to all openings
          </Link>

          {/* Job Premium Header Card */}
          <section className="glass-panel bg-card border border-border/40 p-6 md:p-8 rounded-3xl mb-8 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider">
                    {job.department || "General"}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <Star className="h-3 w-3 fill-secondary" /> Hot Opening
                  </span>
                </div>

                <h1 className="font-heading text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  {job.title}
                </h1>
                <p className="text-sm font-bold text-primary">{job.company || "FMPG Network"}</p>
              </div>

              {/* Main Call To Action */}
              <Link
                href={`/apply/${job.slug || job._id}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold rounded-2xl shadow-lg transition-all duration-300 group shrink-0"
              >
                Apply Instantly <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Quick specifications grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border/20 text-xs font-bold text-muted-foreground">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-primary shrink-0">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Location</div>
                  <div className="text-foreground mt-0.5 capitalize">{job.location || "Hoshiarpur"}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-primary shrink-0">
                  <Briefcase className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Job Type</div>
                  <div className="text-foreground mt-0.5 capitalize">{job.type}</div>
                </div>
              </div>

              {job.salary && (
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-secondary shrink-0">
                    <DollarSign className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Compensation</div>
                    <div className="text-foreground mt-0.5">{formatCurrencyValue(job.salary)}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-primary shrink-0">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Posted Date</div>
                  <div className="text-foreground mt-0.5">
                    {new Date(job.createdAt).toLocaleDateString("en-GB")}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Detailed Job Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content (2 cols) */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Description section */}
              <article className="bg-card border border-border/40 p-6 md:p-8 rounded-3xl shadow-sm">
                <h2 className="font-heading text-lg font-extrabold text-foreground mb-4 pb-2 border-b border-border/20">
                  Job Description
                </h2>
                <div className="text-sm text-muted-foreground leading-relaxed font-medium space-y-4 whitespace-pre-wrap">
                  {job.description}
                </div>
              </article>

              {/* Requirements list */}
              {job.requirements && job.requirements.length > 0 && (
                <article className="bg-card border border-border/40 p-6 md:p-8 rounded-3xl shadow-sm">
                  <h2 className="font-heading text-lg font-extrabold text-foreground mb-4 pb-2 border-b border-border/20 flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" /> Key Requirements & Skills
                  </h2>
                  <ul className="flex flex-col gap-3">
                    {job.requirements.map((req: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-sm font-medium text-muted-foreground leading-relaxed">
                        <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              )}

              {/* Responsibilities list */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <article className="bg-card border border-border/40 p-6 md:p-8 rounded-3xl shadow-sm">
                  <h2 className="font-heading text-lg font-extrabold text-foreground mb-4 pb-2 border-b border-border/20 flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" /> Core Responsibilities
                  </h2>
                  <ul className="flex flex-col gap-3">
                    {job.responsibilities.map((resp: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-sm font-medium text-muted-foreground leading-relaxed">
                        <span className="h-2 w-2 rounded bg-secondary mt-2 shrink-0" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              )}
            </div>

            {/* Right sidebar info */}
            <div className="flex flex-col gap-6">
              {/* Application Guard Info */}
              <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl relative overflow-hidden">
                <h3 className="font-heading text-sm font-black uppercase text-primary tracking-wider mb-2 flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4" /> Ready to Apply?
                </h3>
                <p className="text-xs text-muted-foreground font-semibold leading-relaxed mb-4">
                  Keep your resume in PDF/DOCX format handy. Our intelligent system automatically parses your details in 5 seconds flat!
                </p>
                <Link
                  href={`/apply/${job.slug || job._id}`}
                  className="w-full flex items-center justify-center gap-2 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl transition-all"
                >
                  Start Application <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* HR POC contacts */}
              {job.hrContact && (job.hrContact.name || job.hrContact.email) && (
                <div className="bg-card border border-border/40 p-6 rounded-3xl">
                  <h3 className="font-heading text-xs font-black uppercase text-muted-foreground tracking-wider mb-4 pb-2 border-b border-border/20">
                    HR Point of Contact
                  </h3>
                  <div className="flex flex-col gap-3 text-xs font-semibold text-muted-foreground">
                    {job.hrContact.name && (
                      <div>
                        <div className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-wider">POC Name</div>
                        <div className="text-foreground mt-0.5">{job.hrContact.name}</div>
                      </div>
                    )}
                    {job.hrContact.email && (
                      <div>
                        <div className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-wider">Email Address</div>
                        <div className="text-foreground mt-0.5 break-all hover:text-primary hover:underline cursor-pointer">
                          {job.hrContact.email}
                        </div>
                      </div>
                    )}
                    {job.hrContact.phone && (
                      <div>
                        <div className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-wider">Phone Number</div>
                        <div className="text-foreground mt-0.5">{job.hrContact.phone}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Trust/Verification badge */}
              <div className="bg-card border border-border/40 p-5 rounded-3xl flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
                <div className="text-[10px] font-semibold text-muted-foreground leading-relaxed">
                  <span className="font-bold text-foreground block mb-0.5">Secure Application process</span>
                  FMPG will never ask for payment or sensitive banking login information during recruitment.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
