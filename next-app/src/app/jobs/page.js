'use client';

import { useState, useEffect, useMemo } from 'react';
import { jobService, applicationService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const { currentUser, isAdmin, isHR } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await jobService.getAllJobs();
      setJobs(response.data);
    } catch (err) {
      toast.error('Error loading jobs');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job =>
      (job.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (job.company?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    ).filter(job =>
      filterType ? job.type === filterType : true
    ).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });
  }, [jobs, searchTerm, filterType, sortBy]);

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20">
          <div>
            <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">AVAILABLE POSITIONS</span>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
              Find Your <br />
              <span className="text-lime-500">Future</span>
            </h1>
          </div>
          
          <div className="w-full lg:max-w-md">
            <div className="relative group">
              <input
                type="text"
                placeholder="SEARCH POSITIONS..."
                className="w-full bg-white border-2 border-gray-100 rounded-3xl py-6 px-10 outline-none focus:border-lime-500 transition-all font-black uppercase tracking-widest text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-16">
          {['', 'Full-time', 'Part-time', 'Contract', 'Internship'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border-2 ${filterType === type ? 'bg-lime-400 border-lime-400 text-black' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
            >
              {type || 'All Roles'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-50 rounded-[2.5rem] animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            <AnimatePresence mode='popLayout'>
              {filteredJobs.map((job) => (
                <motion.div
                  key={job._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-gray-100 p-10 rounded-[3rem] shadow-xl hover:shadow-2xl hover:border-lime-400 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-8"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <span className="bg-gray-50 text-gray-400 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">{job.type}</span>
                      <span className="text-lime-500 font-black text-[10px] tracking-widest uppercase">{job.location}</span>
                    </div>
                    <h3 className="text-3xl font-black tracking-tighter uppercase mb-4 group-hover:text-lime-500 transition-colors">{job.title}</h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                       <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{job.company} • {job.department}</p>
                       {job.salary && (
                         <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                            <p className="text-lime-600 font-black uppercase tracking-widest text-xs">{job.salary}</p>
                         </div>
                       )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Link 
                      href={`/apply/${job.slug || job._id}`}
                      className="px-10 py-5 bg-[#0a0a0a] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-lime-400 hover:text-black transition-all"
                    >
                      Initialize Application
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
