'use client';

import { useState, useEffect } from 'react';
import { applicationService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  ArrowUpRight,
  Download,
  Eye,
  Copy,
  Calendar,
  Building
} from 'lucide-react';

export default function MyApplicationsPage() {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await applicationService.getMyApplications();
        setApplications(res.data);
      } catch (err) {
        toast.error('Failed to synchronize applications');
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchApps();
  }, [currentUser]);

  const getStatusConfig = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return { color: 'text-amber-500', bg: 'bg-amber-50', icon: Clock, label: 'Under Review' };
      case 'shortlisted': return { color: 'text-blue-500', bg: 'bg-blue-50', icon: Search, label: 'Shortlisted' };
      case 'offered': return { color: 'text-lime-500', bg: 'bg-lime-50', icon: CheckCircle, label: 'Offer Extended' };
      case 'rejected': return { color: 'text-red-500', bg: 'bg-red-50', icon: XCircle, label: 'Concluded' };
      case 'hired': return { color: 'text-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle, label: 'Hired' };
      default: return { color: 'text-gray-500', bg: 'bg-gray-50', icon: Clock, label: status };
    }
  };

  if (loading) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse text-gray-400">ACCESSING ARCHIVES...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-20">
          <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">CANDIDATE PORTAL</span>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.8] mb-8">
            My <br />
            <span className="text-lime-500">History</span>
          </h1>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white border border-gray-100 p-20 rounded-[4rem] text-center shadow-2xl">
            <FileText className="w-20 h-20 mx-auto text-gray-100 mb-8" />
            <h2 className="text-2xl font-black uppercase tracking-tight mb-4 text-gray-400">Zero Records Detected</h2>
            <Link href="/jobs" className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-lime-500 hover:gap-6 transition-all">
              Initialize First Application <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* List */}
            <div className="lg:col-span-5 space-y-4">
              {applications.map((app) => {
                const config = getStatusConfig(app.status);
                const Icon = config.icon;
                return (
                  <motion.div 
                    key={app._id}
                    layoutId={app._id}
                    onClick={() => setSelectedApp(app)}
                    className={`p-8 rounded-[2.5rem] border transition-all cursor-pointer group ${selectedApp?._id === app._id ? 'bg-white border-lime-400 shadow-xl' : 'bg-white/50 border-gray-100 hover:border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className={`${config.bg} p-4 rounded-2xl`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${config.color}`}>{config.label}</span>
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-2 group-hover:text-lime-500 transition-colors">{app.jobId?.title || 'Unknown Position'}</h3>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                       <span className="flex items-center gap-2"><Building className="w-3 h-3" /> {app.jobId?.company || 'FMPG'}</span>
                       <span>•</span>
                       <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Details */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                {selectedApp ? (
                  <motion.div 
                    key={selectedApp._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-2xl sticky top-32"
                  >
                    <div className="flex items-center justify-between mb-12">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-500">TRANSMISSION DATA</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedApp._id);
                          toast.success('ID COPIED');
                        }}
                        className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                      >
                        ID: {selectedApp._id.substring(0, 8)}... <Copy className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-12">
                       <div>
                          <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">{selectedApp.jobId?.title}</h2>
                          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                            Applied on {new Date(selectedApp.createdAt).toLocaleString()}
                          </p>
                       </div>

                       <div className="grid grid-cols-2 gap-6">
                          <div className="bg-gray-50 p-8 rounded-[2rem]">
                             <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-4">STATUS RECAP</p>
                             <div className="flex items-center gap-4">
                                <div className={`${getStatusConfig(selectedApp.status).bg} p-3 rounded-xl`}>
                                   <Clock className={`w-4 h-4 ${getStatusConfig(selectedApp.status).color}`} />
                                </div>
                                <span className="text-sm font-black uppercase tracking-tight">{getStatusConfig(selectedApp.status).label}</span>
                             </div>
                          </div>
                          <div className="bg-gray-50 p-8 rounded-[2rem]">
                             <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-4">DOCUMENTATION</p>
                             <button className="flex items-center gap-4 group">
                                <div className="bg-lime-400 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                   <Eye className="w-4 h-4 text-black" />
                                </div>
                                <span className="text-sm font-black uppercase tracking-tight group-hover:text-lime-500 transition-colors">Resume.pdf</span>
                             </button>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-lime-500">COVER STATEMENT</h4>
                          <p className="text-sm font-medium text-gray-600 leading-relaxed bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100">
                             {selectedApp.coverLetter || 'No cover statement provided.'}
                          </p>
                       </div>

                       {selectedApp.status === 'offered' && (
                          <div className="pt-8 border-t border-gray-100">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-lime-500 mb-6">OFFER PROTOCOL</h4>
                             <div className="flex gap-4">
                                <button className="flex-1 py-5 bg-lime-400 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl shadow-lime-400/20">
                                   <CheckCircle className="w-4 h-4" /> Accept Offer
                                </button>
                                <button className="px-8 py-5 border-2 border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all">
                                   <Download className="w-4 h-4" />
                                </button>
                             </div>
                          </div>
                       )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-[600px] border-4 border-dashed border-gray-50 rounded-[3.5rem] flex flex-col items-center justify-center text-center p-12">
                    <FileText className="w-16 h-16 text-gray-100 mb-6" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Select an application record to <br /> initiate deep inspection</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
