"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, MapPin, Briefcase, DollarSign, Calendar, ChevronRight, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrencyValue } from "@/lib/currencyFormatter";

export interface IJob {
  _id: string;
  slug?: string;
  title: string;
  company: string;
  description: string;
  location?: string;
  type: string;
  salary?: string;
  department?: string;
  requirements?: string[];
  responsibilities?: string[];
  createdAt: string;
}

interface JobsListClientProps {
  initialData: {
    jobs: IJob[];
    pagination: {
      currentPage: number;
      totalPages: number;
      total: number;
    };
    filters: {
      types: string[];
      departments: string[];
      locations: string[];
    };
  } | null;
  initialSearch?: string;
  initialType?: string;
  initialDept?: string;
  initialLoc?: string;
  initialSort?: "newest" | "oldest" | "title";
  initialPage?: number;
}

export default function JobsListClient({
  initialData,
  initialSearch = "",
  initialType = "",
  initialDept = "",
  initialLoc = "",
  initialSort = "newest",
  initialPage = 1,
}: JobsListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Search & filter states
  const [search, setSearch] = useState(initialSearch);
  const [type, setType] = useState(initialType);
  const [dept, setDept] = useState(initialDept);
  const [loc, setLoc] = useState(initialLoc);
  const [sort, setSort] = useState(initialSort);

  const jobs = initialData?.jobs || [];
  const pagination = initialData?.pagination || { currentPage: 1, totalPages: 1, total: 0 };
  const filters = initialData?.filters || { types: [], departments: [], locations: [] };

  // Trigger search update
  const updateFilters = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Merge updates
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === "" || val === "all") {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });

    // Always reset to page 1 on filter changes unless changing page itself
    if (!newParams.page) {
      params.delete("page");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const handleClear = () => {
    setSearch("");
    setType("");
    setDept("");
    setLoc("");
    setSort("newest");
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest shadow-sm mb-3">
            🎯 Open Opportunities
          </span>
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Explore Careers at FMPG
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Join Hoshiarpur's top co-living network and property management platform. Apply in seconds with our smart resume scanner.
          </p>
        </div>

        {/* Total count */}
        <div className="bg-card glass-panel border border-border/40 px-5 py-3 rounded-2xl shrink-0 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 text-primary flex items-center justify-center rounded-xl font-extrabold text-lg">
            {pagination.total}
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-black uppercase tracking-wider">Active Openings</div>
            <div className="text-xs font-bold text-foreground">Open & Accepting Applications</div>
          </div>
        </div>
      </div>

      {/* Main Search & Filter Console */}
      <div className="bg-card border border-border/40 rounded-3xl p-5 md:p-6 mb-8 shadow-sm relative overflow-hidden">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
          {/* Main search bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-3 bg-muted/40 rounded-2xl px-4 py-3 border border-border/20 focus-within:border-primary/50 transition-colors">
              <Search className="h-5 w-5 text-primary shrink-0" />
              <input
                type="text"
                placeholder="Search openings by title, key skill, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-0 focus:outline-none text-sm font-semibold placeholder:text-muted-foreground text-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
            >
              {isPending ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Advanced dropdown filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2 flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3" /> Department
              </label>
              <select
                value={dept}
                onChange={(e) => {
                  setDept(e.target.value);
                  updateFilters({ department: e.target.value });
                }}
                className="h-11 rounded-2xl bg-muted/30 border border-border/50 text-xs font-semibold px-3 focus:outline-none focus:border-primary cursor-pointer capitalize text-foreground"
              >
                <option value="all">All Departments</option>
                {filters.departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2 flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> Job Type
              </label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  updateFilters({ type: e.target.value });
                }}
                className="h-11 rounded-2xl bg-muted/30 border border-border/50 text-xs font-semibold px-3 focus:outline-none focus:border-primary cursor-pointer capitalize text-foreground"
              >
                <option value="all">All Types</option>
                {filters.types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Location
              </label>
              <select
                value={loc}
                onChange={(e) => {
                  setLoc(e.target.value);
                  updateFilters({ location: e.target.value });
                }}
                className="h-11 rounded-2xl bg-muted/30 border border-border/50 text-xs font-semibold px-3 focus:outline-none focus:border-primary cursor-pointer capitalize text-foreground"
              >
                <option value="all">All Locations</option>
                {filters.locations.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-2 flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3" /> Sort By
              </label>
              <select
                value={sort}
                onChange={(e) => {
                  const s = e.target.value as "newest" | "oldest" | "title";
                  setSort(s);
                  updateFilters({ sort: s });
                }}
                className="h-11 rounded-2xl bg-muted/30 border border-border/50 text-xs font-semibold px-3 focus:outline-none focus:border-primary cursor-pointer text-foreground"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Active filters check */}
          {(search || type || dept || loc) && (
            <div className="flex justify-between items-center pt-2 border-t border-border/20 text-xs mt-1">
              <span className="text-muted-foreground font-medium">
                Active filters applied. Showing {pagination.total} results.
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="text-primary hover:text-primary/80 font-bold hover:underline"
              >
                Reset all filters
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Loading state indicator */}
      {isPending && (
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden mb-6">
          <div className="h-full bg-primary animate-pulse w-1/3 rounded-full" />
        </div>
      )}

      {/* Grid List Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <motion.article
            layoutId={job._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={job._id}
            className="glass-panel bg-card border border-border/40 p-6 rounded-3xl flex flex-col justify-between gap-5 relative hover:border-primary/30 transition-all duration-300"
          >
            {/* Header info */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  {job.department || "General"}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {new Date(job.createdAt).toLocaleDateString("en-GB")}
                </span>
              </div>

              <h3 className="font-heading text-lg font-bold text-foreground mt-2 line-clamp-1">
                <Link href={`/jobs/${job.slug || job._id}`} className="hover:text-primary transition-colors">
                  {job.title}
                </Link>
              </h3>
              <p className="text-xs font-semibold text-primary">{job.company || "FMPG Network"}</p>
              
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                {job.description}
              </p>
            </div>

            {/* Job Specs */}
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-muted-foreground pt-2 border-t border-border/20">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> {job.location || "Hoshiarpur"}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" /> {job.type}
              </span>
              {job.salary && (
                <span className="col-span-2 flex items-center gap-1.5 mt-1 font-bold text-foreground">
                  <DollarSign className="h-3.5 w-3.5 text-secondary shrink-0" /> {formatCurrencyValue(job.salary)}
                </span>
              )}
            </div>

            {/* Desired Skills Tagging */}
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

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-2">
              <Link
                href={`/jobs/${job.slug || job._id}`}
                className="flex-1 flex items-center justify-center h-10 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-2xl transition-all"
              >
                Learn More
              </Link>
              <Link
                href={`/apply/${job.slug || job._id}`}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-2xl transition-all group"
              >
                Apply Now <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </motion.article>
        ))}

        {jobs.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground text-3xl">
              🏢
            </div>
            <h3 className="font-heading text-xl font-bold text-foreground">No openings found</h3>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              We couldn't find any active job openings matching your search criteria. Try removing some filters.
            </p>
            <button
              onClick={handleClear}
              className="mt-2 text-xs font-bold text-primary hover:underline bg-primary/10 border border-primary/20 rounded-xl px-4 py-2 hover:bg-primary/20 transition-all"
            >
              Clear all filters & search again
            </button>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            onClick={() => updateFilters({ page: pagination.currentPage - 1 })}
            disabled={pagination.currentPage === 1 || isPending}
            className="h-10 px-4 rounded-xl bg-card border border-border/40 text-xs font-bold text-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => updateFilters({ page: p })}
              disabled={isPending}
              className={`h-10 w-10 rounded-xl text-xs font-bold transition-all ${
                pagination.currentPage === p
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-card border border-border/40 text-foreground hover:bg-muted/50"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => updateFilters({ page: pagination.currentPage + 1 })}
            disabled={pagination.currentPage === pagination.totalPages || isPending}
            className="h-10 px-4 rounded-xl bg-card border border-border/40 text-xs font-bold text-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
