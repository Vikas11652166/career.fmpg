'use client';

import { useState, useEffect } from 'react';
import { applicationService, jobService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterJob, setFilterJob] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser, isAdmin, isHR } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser || (!isAdmin && !isHR)) {
      router.push('/login');
      return;
    }
    loadData();
  }, [currentUser, isAdmin, isHR, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appRes, jobRes] = await Promise.all([
        applicationService.getDashboardStats('all'),
        jobService.getAllJobs()
      ]);
      setApplications(appRes.data.recentApplicationsList || []);
      setJobs(jobRes.data);
    } catch (err) {
      toast.error('Failed to sync application intelligence');
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesJob = filterJob === 'all' || (app.jobId?._id || app.jobId) === filterJob;
    const matchesSearch = app.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesJob && matchesSearch;
  });

  if (loading) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse">Scanning Transmissions...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">CANDIDATE GOVERNANCE</span>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
            Application <br />
            <span className="text-lime-500">Directory</span>
          </h1>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="relative group">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-[#fcfcfc] px-2 z-10 transition-colors group-focus-within:text-lime-500">Status Protocol</label>
            <select
              className="w-full px-8 py-5 bg-white border-2 border-gray-100 rounded-3xl outline-none focus:border-lime-500 transition-all font-bold text-gray-800 appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">ALL STATUSES</option>
              <option value="pending">PENDING</option>
              <option value="reviewing">REVIEWING</option>
              <option value="shortlisted">SHORTLISTED</option>
              <option value="offered">OFFERED</option>
              <option value="rejected">REJECTED</option>
            </select>
          </div>

          <div className="relative group">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-[#fcfcfc] px-2 z-10 transition-colors group-focus-within:text-lime-500">Position Lock</label>
            <select
              className="w-full px-8 py-5 bg-white border-2 border-gray-100 rounded-3xl outline-none focus:border-lime-500 transition-all font-bold text-gray-800 appearance-none"
              value={filterJob}
              onChange={(e) => setFilterJob(e.target.value)}
            >
              <option value="all">ALL POSITIONS</option>
              {jobs.map(job => (
                <option key={job._id} value={job._id}>{job.title.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="relative group">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-[#fcfcfc] px-2 z-10 transition-colors group-focus-within:text-lime-500">Candidate Search</label>
            <input
              type="text"
              placeholder="NAME OR EMAIL..."
              className="w-full px-8 py-5 bg-white border-2 border-gray-100 rounded-3xl outline-none focus:border-lime-500 transition-all font-bold text-gray-800 uppercase tracking-widest text-[10px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[3.5rem] shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Candidate Intelligence</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Target Position</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Current Phase</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence mode='popLayout'>
                  {filteredApplications.map((app) => (
                    <motion.tr 
                      key={app._id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="group hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-10 py-10">
                        <div className="font-black uppercase tracking-tighter text-xl mb-1 group-hover:text-lime-500 transition-colors">{app.fullName}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{app.email}</div>
                      </td>
                      <td className="px-10 py-10">
                        <div className="text-xs font-black uppercase tracking-widest text-gray-800">{app.jobId?.title || 'Unknown Position'}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{app.jobId?.company || 'OM Softwares'}</div>
                      </td>
                      <td className="px-10 py-10">
                        <span className={`inline-block px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border-2 
                          ${app.status === 'pending' ? 'bg-yellow-50 border-yellow-100 text-yellow-600' : 
                            app.status === 'reviewing' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                            app.status === 'shortlisted' ? 'bg-purple-50 border-purple-100 text-purple-600' :
                            app.status === 'offered' ? 'bg-lime-50 border-lime-100 text-lime-600' :
                            app.status === 'rejected' ? 'bg-red-50 border-red-100 text-red-600' :
                            'bg-gray-50 border-gray-100 text-gray-600'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-10 py-10">
                        <Link 
                          href={`/applications/${app._id}`}
                          className="px-8 py-4 bg-[#0a0a0a] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] hover:bg-lime-400 hover:text-black transition-all shadow-md active:scale-95"
                        >
                          Process Transmission
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {filteredApplications.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No matching candidate transmissions found in the registry</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
