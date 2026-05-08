'use client';

import { useState, useEffect } from 'react';
import { jobService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, isAdmin, isHR } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser || (!isAdmin && !isHR)) {
      router.push('/login');
      return;
    }
    loadJobs();
  }, [currentUser, isAdmin, isHR, router]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await jobService.getAllJobs();
      setJobs(response.data);
    } catch (err) {
      toast.error('Failed to load operational job data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('PERMANENTLY DELETE THIS POSITION?')) return;
    try {
      await jobService.deleteJob(id);
      toast.success('Position decommissioned');
      setJobs(jobs.filter(j => j._id !== id));
    } catch (err) {
      toast.error('Failed to decommission position');
    }
  };

  if (loading) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse">Syncing Operational Data...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20">
          <div>
            <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">JOB GOVERNANCE</span>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
              Position <br />
              <span className="text-lime-500">Registry</span>
            </h1>
          </div>
          
          <Link 
            href="/admin/jobs/create"
            className="px-10 py-6 bg-lime-400 text-black rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl shadow-lime-400/20"
          >
            Deploy New Position
          </Link>
        </div>

        <div className="bg-white border border-gray-100 rounded-[3.5rem] shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Position Identifier</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Department</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence>
                  {jobs.map((job) => (
                    <motion.tr 
                      key={job._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="group hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-10 py-10">
                        <div className="font-black uppercase tracking-tighter text-xl mb-1 group-hover:text-lime-500 transition-colors">{job.title}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{job.location} • {job.type}</div>
                      </td>
                      <td className="px-10 py-10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-4 py-2 rounded-xl">
                          {job.department || 'N/A'}
                        </span>
                      </td>
                      <td className="px-10 py-10">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${job.isActive ? 'bg-lime-500' : 'bg-red-500'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{job.isActive ? 'Active' : 'Draft'}</span>
                        </div>
                      </td>
                      <td className="px-10 py-10">
                        <div className="flex items-center gap-4">
                          <Link 
                            href={`/admin/jobs/edit/${job._id}`}
                            className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center hover:border-lime-500 hover:text-lime-500 transition-all shadow-sm hover:shadow-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </Link>
                          <button 
                            onClick={() => handleDelete(job._id)}
                            className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center hover:border-red-500 hover:text-red-500 transition-all shadow-sm hover:shadow-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {jobs.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs mb-8">No positions registered in the system</p>
              <Link href="/admin/jobs/create" className="text-lime-500 font-black uppercase tracking-widest text-[10px] hover:underline">Begin Deployment Protocol</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
