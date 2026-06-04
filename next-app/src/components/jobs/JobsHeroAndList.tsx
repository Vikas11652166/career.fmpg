"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, Briefcase, DollarSign, Calendar, ChevronRight, CheckCircle, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrencyValue } from "@/lib/currencyFormatter";

export interface IJobProp {
  _id: string;
  slug?: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  location?: string;
  type: string;
  salary?: string;
  department?: string;
  createdAt: string;
}

export default function JobsHeroAndList({ initialJobs }: { initialJobs: IJobProp[] }) {
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedLoc, setSelectedLoc] = useState("all");

  // Extract unique departments, types, and locations for filters
  const departments = useMemo(() => {
    const depts = new Set(initialJobs.map((j) => j.department).filter(Boolean));
    return ["all", ...Array.from(depts)];
  }, [initialJobs]);

  const types = useMemo(() => {
    const ty = new Set(initialJobs.map((j) => j.type).filter(Boolean));
    return ["all", ...Array.from(ty)];
  }, [initialJobs]);

  const locations = useMemo(() => {
    const locs = new Set(initialJobs.map((j) => j.location).filter(Boolean));
    return ["all", ...Array.from(locs)];
  }, [initialJobs]);

  // Filter logic
  const filteredJobs = useMemo(() => {
    return initialJobs.filter((job) => {
      const matchSearch =
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase()) ||
        (job.description && job.description.toLowerCase().includes(search.toLowerCase()));

      const matchDept = selectedDept === "all" || job.department === selectedDept;
      const matchType = selectedType === "all" || job.type === selectedType;
      const matchLoc = selectedLoc === "all" || job.location === selectedLoc;

      return matchSearch && matchDept && matchType && matchLoc;
    });
  }, [initialJobs, search, selectedDept, selectedType, selectedLoc]);

  return (
    <div>
      {/* 1. Hero Search Panel Area */}
      <section className="relative w-full overflow-hidden bg-background bg-grid-pattern pt-32 pb-20 lg:py-40">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-60 right-0 w-[450px] h-[450px] bg-primary/10 rounded-full blur-[110px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 z-10 flex flex-col items-center text-center gap-6">
          {/* Tagline Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest shadow-sm">
            <Briefcase className="h-3.5 w-3.5" /> High-Performance Careers
          </span>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl text-foreground">
            Build the Future of <br />
            <span className="text-primary relative inline-block">
              Hassle-Free Living
              <span className="absolute left-0 bottom-1 w-full h-[6px] bg-primary/15 rounded" />
            </span>
          </h1>

          <p className="max-w-2xl text-base sm:text-lg text-muted-foreground font-medium leading-relaxed">
            Join the talented FMPG team in engineering Hoshiarpur's premierPaying Guest accommodation and premium co-living network. Discover your dream role today.
          </p>

          {/* Core Search & Filters Bar */}
          <div className="w-full max-w-4xl mt-8 glass-panel rounded-3xl p-4 bg-card shadow-lg flex flex-col gap-3">
            <div className="flex items-center gap-3 bg-muted/40 rounded-2xl px-4 py-2 border border-border/20">
              <Search className="h-5 w-5 text-primary" />
              <input
                type="text"
                placeholder="Search openings by title, key skill, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-0 focus:outline-none text-sm font-semibold placeholder:text-muted-foreground"
              />
            </div>

            {/* Dynamic Filter Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="h-10 rounded-xl bg-muted/30 border border-border/50 text-xs font-semibold px-3 focus:outline-none focus:border-primary cursor-pointer capitalize"
                >
                  <option value="all">All Departments</option>
                  {departments.filter(d => d !== "all").map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Job Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="h-10 rounded-xl bg-muted/30 border border-border/50 text-xs font-semibold px-3 focus:outline-none focus:border-primary cursor-pointer capitalize"
                >
                  <option value="all">All Types</option>
                  {types.filter(t => t !== "all").map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2">Location</label>
                <select
                  value={selectedLoc}
                  onChange={(e) => setSelectedLoc(e.target.value)}
                  className="h-10 rounded-xl bg-muted/30 border border-border/50 text-xs font-semibold px-3 focus:outline-none focus:border-primary cursor-pointer capitalize"
                >
                  <option value="all">All Locations</option>
                  {locations.filter(l => l !== "all").map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Listings Feed Grid Area */}
      <section className="py-16 max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col gap-2 items-center text-center mb-12">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
            Current Open Openings ({filteredJobs.length})
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Review requirements and apply using our next-generation automated parsing forms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredJobs.map((job) => (
              <motion.article
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                key={job._id}
                className="glass-panel bg-card border border-border/40 p-6 rounded-3xl flex flex-col justify-between gap-5 relative cursor-pointer"
              >
                {/* Header info */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                      {job.department || "General"}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(job.createdAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>

                  <h3 className="font-heading text-lg font-bold text-foreground mt-2 line-clamp-1">
                    {job.title}
                  </h3>
                  <p className="text-xs font-semibold text-primary">{job.company}</p>
                </div>

                {/* Job Specs */}
                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground pt-2 border-t border-border/20">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> {job.location || "Hoshiarpur"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" /> {job.type}
                  </span>
                  {job.salary && (
                    <span className="col-span-2 flex items-center gap-1.5 mt-1">
                      <DollarSign className="h-3.5 w-3.5 text-secondary shrink-0" /> {formatCurrencyValue(job.salary)}
                    </span>
                  )}
                </div>

                {/* Requirements highlights */}
                {job.requirements && job.requirements.length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Desired Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {job.requirements.slice(0, 3).map((req, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-muted text-[10px] font-bold text-muted-foreground"
                        >
                          {req}
                        </span>
                      ))}
                      {job.requirements.length > 3 && (
                        <span className="text-[10px] font-bold text-primary pl-1">
                          +{job.requirements.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Button apply */}
                <Link
                  href={`/apply/${job.slug || job._id}`}
                  className="w-full flex items-center justify-center gap-2 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl transition-all duration-300 group mt-2"
                >
                  Apply Instantly <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.article>
            ))}
          </AnimatePresence>

          {filteredJobs.length === 0 && (
            <div className="col-span-full py-16 text-center flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground text-2xl">
                ☕
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">No active openings found</h3>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                We couldn't find any job matches for "{search}". Try searching with alternative filters or clear filters to see all.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedDept("all");
                  setSelectedType("all");
                  setSelectedLoc("all");
                }}
                className="mt-2 text-xs font-bold text-primary hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
