'use client';

import { useState, useEffect } from 'react';
import { jobService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, Trash2, Edit3, Users, 
  ChevronRight, MapPin, Briefcase, Building2,
  Activity, AlertCircle, Clock
} from 'lucide-react';

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
      const response = await jobService.getAllJobs(true); // Pass true for admin view
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
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20">
          <div>
            <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-500 transition-colors mb-8 block">
              ← Return to Cockpit
            </Link>
            <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">JOB GOVERNANCE</span>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
              Position <br />
              <span className="text-lime-500">Registry</span>
            </h1>
          </div>
          
          <Link 
            href="/admin/jobs/create"
            className="px-10 py-6 bg-[#0a0a0a] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.05] transition-all shadow-xl flex items-center gap-4"
          >
            <Plus className="w-4 h-4 text-lime-400" />
            Deploy New Position
          </Link>
        </div>

        {/* Matrix Table */}
        <div className="bg-white border border-gray-100 rounded-[3.5rem] shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Position Identifier</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Unit</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Applications</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">State</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
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
                      className="group hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-10 py-10">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-xs text-gray-300 group-hover:bg-lime-500 group-hover:text-white transition-all">
                            {job.title.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black uppercase tracking-tighter text-xl mb-1 group-hover:text-lime-500 transition-colors">{job.title}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-3">
                              <MapPin className="w-3 h-3" /> {job.location} • <Briefcase className="w-3 h-3" /> {job.type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-4 py-2 rounded-xl">
                          {job.department || 'N/A'}
                        </span>
                      </td>
                      <td className="px-10 py-10 text-center">
                        <Link 
                          href={`/admin/applications?jobId=${job._id}`}
                          className="inline-flex flex-col items-center group/btn"
                        >
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-2 group-hover/btn:bg-blue-50 transition-colors">
                            <Users className="w-4 h-4 text-gray-400 group-hover/btn:text-blue-500" />
                          </div>
                          <span className="text-xl font-black tracking-tighter group-hover/btn:text-blue-500 transition-colors">
                            {job.applicationCount || 0}
                          </span>
                        </Link>
                      </td>
                      <td className="px-10 py-10">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${job.isActive ? 'bg-lime-500 shadow-[0_0_10px_rgba(132,204,22,0.5)]' : 'bg-red-500'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{job.isActive ? 'Active' : 'Draft'}</span>
                        </div>
                      </td>
                      <td className="px-10 py-10">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                          <Link 
                            href={`/admin/jobs/edit/${job._id}`}
                            className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center hover:border-lime-500 hover:text-lime-500 transition-all shadow-sm hover:shadow-xl"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => handleDelete(job._id)}
                            className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center hover:border-red-500 hover:text-red-500 transition-all shadow-sm hover:shadow-xl"
                          >
                            <Trash2 className="w-4 h-4" />
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
              <AlertCircle className="w-20 h-20 mx-auto text-gray-100 mb-8" />
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs mb-8">No positions registered in the system</p>
              <Link href="/admin/jobs/create" className="text-lime-500 font-black uppercase tracking-widest text-[10px] hover:underline">Begin Deployment Protocol</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
