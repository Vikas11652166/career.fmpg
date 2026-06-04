import React from "react";
import connectDB from "@/lib/mongodb";
import Job from "@/models/job";
import Review from "@/models/review";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import JobsHeroAndList from "@/components/jobs/JobsHeroAndList";
import { Star, ShieldCheck, Heart, Award, ArrowUpRight } from "lucide-react";

// Server Action / DB Fetching in Server Components
async function getLandingData() {
  try {
    await connectDB();
    
    // Fetch active jobs
    const rawJobs = await Job.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();
      
    // Convert ObjectIds to strings for React prop compatibility
    const jobs = rawJobs.map((j: any) => ({
      ...j,
      _id: j._id.toString(),
      postedBy: j.postedBy ? j.postedBy.toString() : undefined,
      createdAt: j.createdAt.toISOString(),
      updatedAt: j.updatedAt.toISOString(),
      questions: j.questions?.map((q: any) => ({
        ...q,
        _id: q._id ? q._id.toString() : undefined,
      })) || [],
    }));

    // Fetch approved testimonials
    const rawReviews = await Review.find({ status: "approved" })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const reviews = rawReviews.map((r: any) => ({
      ...r,
      _id: r._id.toString(),
      userId: r.userId.toString(),
      approvedBy: r.approvedBy ? r.approvedBy.toString() : undefined,
      createdAt: r.createdAt.toISOString(),
    }));

    return { jobs, reviews };
  } catch (error) {
    console.error("Failed to load landing data from database:", error);
    return { jobs: [], reviews: [] };
  }
}

export default async function LandingPage() {
  const { jobs, reviews } = await getLandingData();

  // Curated static statistics for premium feel
  const stats = [
    { value: "100%", label: "Verified Units", color: "text-primary" },
    { value: "4.9★", label: "Tenant Rating", color: "text-secondary" },
    { value: "15+", label: "Elite Locations", color: "text-primary" },
    { value: "24/7", label: "Live Support Desk", color: "text-primary" },
  ];

  // Mock fallback reviews if none are in the DB yet (ensures visual excellence immediately)
  const defaultReviews = [
    {
      userName: "Ishita Sharma",
      position: "Resident Coordinator",
      rating: 5,
      title: "Best Professional Atmosphere",
      content: "Joining the FMPG onboarding team has been incredibly rewarding. We manage PGs with utmost pricing integrity and digital operations. Excellent workplace culture!",
    },
    {
      userName: "Rohan Verma",
      position: "Backend Intern",
      rating: 5,
      title: "Immense Learning & Autonomy",
      content: "FMPG provided me high autonomy to redesign their automated resume parser and verification dashboards. A truly modern startup environment in Hoshiarpur.",
    },
    {
      userName: "Priya Patel",
      position: "HR Associate",
      rating: 5,
      title: "Outstanding Work-Life Integration",
      content: "Highly collaborative team with clear communication policies. The digital stamp signature contract setups make candidate onboarding a paperless joy.",
    }
  ];

  const displayReviews = reviews.length > 0 ? reviews : defaultReviews;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero & Interactive Jobs Feed Area */}
      <JobsHeroAndList initialJobs={jobs} />

      {/* 3. Core Values Grid */}
      <section className="py-24 bg-muted/30 border-y border-border/20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left Values Copywriting */}
          <div className="lg:col-span-5 flex flex-col gap-5 items-start text-left">
            <span className="text-primary font-black text-xs tracking-widest uppercase relative pl-8 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[2px] before:w-6 before:bg-primary">
              Our Core DNA
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              Why Professionals <br />
              Excel at <span className="text-primary">FMPG</span>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We are not just a real estate brand; we are engineering a digital trust layer for co-living. We seek bold builders ready to transform guest experiences with paperless workflows and AI-driven matching.
            </p>
            <div className="flex items-center gap-2 mt-4 text-xs font-bold text-primary hover:underline cursor-pointer group">
              Explore our engineering culture <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* Right Values Cards Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: <ShieldCheck className="h-6 w-6 text-primary" />,
                title: "100% Transparency",
                desc: "We stand for absolute pricing integrity. No hidden costs, no paper storage, and instant UPI confirmations.",
              },
              {
                icon: <Award className="h-6 w-6 text-secondary" />,
                title: "Autonomy & Impact",
                desc: "Every developer and associate operates with extreme autonomy to ship workflows directly affecting thousands of residents.",
              },
              {
                icon: <Heart className="h-6 w-6 text-primary" />,
                title: "Resident First",
                desc: "From meals to Wi-Fi to high-security check-ins, our core mission is comfort-oriented community living.",
              },
              {
                icon: <Star className="h-6 w-6 text-secondary" />,
                title: "Excellence Standards",
                desc: "We build premium landscape certificates, digital stamping engines, and heuristic resume parsers from scratch.",
              },
            ].map((val, idx) => (
              <div key={idx} className="glass-panel p-6 rounded-3xl bg-card border border-border/40 flex flex-col gap-4 text-left">
                <div className="h-11 w-11 rounded-xl bg-muted/65 flex items-center justify-center">
                  {val.icon}
                </div>
                <h3 className="font-heading text-base font-bold text-foreground">{val.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Testimonials Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col gap-16">
          <div className="flex flex-col gap-2 items-center text-center">
            <span className="text-primary font-black text-xs tracking-widest uppercase pl-8 relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[2px] before:w-6 before:bg-primary">
              Employee Stories
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-foreground tracking-tight">
              What Our Team Says
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayReviews.map((rev, idx) => (
              <div key={idx} className="glass-panel p-8 rounded-[32px] bg-card border border-border/40 flex flex-col justify-between gap-6 text-left relative">
                {/* Quote details */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < (rev.rating || 5) ? "fill-secondary text-secondary" : "text-muted"}`} />
                    ))}
                  </div>
                  <h3 className="font-heading text-base font-bold text-foreground">"{rev.title}"</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    {rev.content}
                  </p>
                </div>

                {/* Actor profile */}
                <div className="flex items-center gap-3.5 pt-4 border-t border-border/20 mt-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {rev.userName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-foreground">{rev.userName}</h4>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{rev.position || "Team Member"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Clean Modern Statistics */}
      <section className="py-16 bg-muted/40 border-t border-border/20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center flex flex-col items-center gap-2">
                <span className={`text-4xl font-extrabold tracking-tight font-heading ${stat.color}`}>
                  {stat.value}
                </span>
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
