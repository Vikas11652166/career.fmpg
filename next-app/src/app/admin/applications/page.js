'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { applicationService, jobService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, ChevronLeft, ChevronRight, 
  ExternalLink, Mail, Phone, Briefcase, 
  Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

function ApplicationsContent() {
  const { currentUser, isAdmin, isHR } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    jobId: searchParams.get('jobId') || 'all',
    search: ''
  });

  const loadData = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const [appRes, jobRes] = await Promise.all([
        applicationService.getAllApplications({
          page,
          status: filters.status,
          jobId: filters.jobId === 'all' ? undefined : filters.jobId,
          search: filters.search
        }),
        jobService.getAllJobs(true)
      ]);
      
      // applicationService.getAllApplications likely returns { applications, pagination }
      // but let's check api.js again. It calls /api/applications which returns that.
      
      setApplications(appRes.data.applications || []);
      setPagination(appRes.data.pagination || { page: 1, totalPages: 1 });
      setJobs(jobRes.data || []);
    } catch (err) {
      toast.error('Failed to sync application intelligence');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!currentUser || (!isAdmin && !isHR)) {
      router.push('/login');
      return;
    }
    loadData();
  }, [currentUser, isAdmin, isHR, router, loadData]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading && applications.length === 0) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse">Scanning Transmissions...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div>
            <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-500 transition-colors mb-8 block">
              ← Return to Cockpit
            </Link>
            <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">CANDIDATE GOVERNANCE</span>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
              Application <br />
              <span className="text-lime-500">Directory</span>
            </h1>
          </div>
        </div>

        {/* Filter Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="relative group">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-[#fcfcfc] px-2 z-10 transition-colors group-focus-within:text-lime-500">Status Protocol</label>
            <select
              className="w-full px-8 py-5 bg-white border-2 border-gray-100 rounded-3xl outline-none focus:border-lime-500 transition-all font-bold text-gray-800 appearance-none"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">ALL STATUSES</option>
              <option value="pending">PENDING</option>
              <option value="reviewing">REVIEWING</option>
              <option value="shortlisted">SHORTLISTED</option>
              <option value="offered">OFFERED</option>
              <option value="rejected">REJECTED</option>
              <option value="hired">HIRED</option>
            </select>
          </div>

          <div className="relative group">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-[#fcfcfc] px-2 z-10 transition-colors group-focus-within:text-lime-500">Position Lock</label>
            <select
              className="w-full px-8 py-5 bg-white border-2 border-gray-100 rounded-3xl outline-none focus:border-lime-500 transition-all font-bold text-gray-800 appearance-none"
              value={filters.jobId}
              onChange={(e) => handleFilterChange('jobId', e.target.value)}
            >
              <option value="all">ALL POSITIONS</option>
              {jobs.map(job => (
                <option key={job._id} value={job._id}>{job.title.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="relative group">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-[#fcfcfc] px-2 z-10 transition-colors group-focus-within:text-lime-500">Candidate Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="NAME OR EMAIL..."
                className="w-full px-8 py-5 bg-white border-2 border-gray-100 rounded-3xl outline-none focus:border-lime-500 transition-all font-bold text-gray-800 uppercase tracking-widest text-[10px]"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white border border-gray-100 rounded-[3.5rem] shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Candidate Intelligence</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Target Position</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Current Phase</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence mode='popLayout'>
                  {applications.map((app) => (
                    <motion.tr 
                      key={app._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-10 py-10">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-300 group-hover:bg-lime-500 group-hover:text-white transition-all uppercase">
                            {app.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black uppercase tracking-tighter text-xl mb-1 group-hover:text-lime-500 transition-colors">{app.fullName}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-4">
                              <Mail className="w-3 h-3" /> {app.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-10">
                        <div className="text-xs font-black uppercase tracking-widest text-gray-800">{app.jobId?.title || 'System Position'}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                          <Briefcase className="w-3 h-3" /> {app.jobId?.company || 'FMPG'}
                        </div>
                      </td>
                      <td className="px-10 py-10">
                        <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 
                          ${app.status === 'pending' ? 'bg-amber-50 border-amber-100 text-amber-500' : 
                            app.status === 'reviewing' ? 'bg-blue-50 border-blue-100 text-blue-500' :
                            app.status === 'shortlisted' ? 'bg-purple-50 border-purple-100 text-purple-500' :
                            app.status === 'offered' ? 'bg-lime-50 border-lime-100 text-lime-500' :
                            app.status === 'rejected' ? 'bg-red-50 border-red-100 text-red-500' :
                            'bg-emerald-50 border-emerald-100 text-emerald-500'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-10 py-10 text-right">
                        <Link 
                          href={`/applications/${app._id}`}
                          className="inline-flex items-center gap-3 px-8 py-4 bg-[#0a0a0a] text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-lime-500 hover:text-black transition-all shadow-lg"
                        >
                          Process Transmission <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {applications.length === 0 && (
            <div className="p-20 text-center">
              <AlertCircle className="w-20 h-20 mx-auto text-gray-100 mb-8" />
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Zero transmissions detected in this segment</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-10 py-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Segment {pagination.page} OF {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={pagination.page === 1}
                  onClick={() => loadData(pagination.page - 1)}
                  className="w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-lime-500 hover:text-white transition-all disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => loadData(pagination.page + 1)}
                  className="w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-lime-500 hover:text-white transition-all disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminApplicationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse">Initializing Data Streams...</div>}>
      <ApplicationsContent />
    </Suspense>
  );
}
