'use client';

import { useState, useEffect } from 'react';
import { applicationService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  ArrowUpRight,
  Download,
  Eye,
  Copy,
  Calendar,
  Building,
  User,
  GraduationCap,
  Briefcase,
  Layers,
  HelpCircle,
  FileDown,
  X,
  ChevronRight
} from 'lucide-react';

export default function MyApplicationsPage() {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const openDetails = (app) => {
    setSelectedApp(app);
    setIsModalOpen(true);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {applications.map((app) => {
              const config = getStatusConfig(app.status);
              const Icon = config.icon;
              return (
                <motion.div 
                  key={app._id}
                  whileHover={{ y: -10 }}
                  onClick={() => openDetails(app)}
                  className="bg-white border border-gray-100 p-8 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className={`${config.bg} p-4 rounded-2xl`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 group-hover:text-lime-500 transition-colors">
                    {app.jobId?.title || 'Position Registry'}
                  </h3>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <Building className="w-3 h-3" /> {app.jobId?.company || 'FMPG'}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <Calendar className="w-3 h-3" /> {new Date(app.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-300">TRX ID: {app._id.substring(0, 8)}</span>
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-lime-500 group-hover:text-white transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {isModalOpen && selectedApp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-12">
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <span className="text-lime-500 font-black text-[10px] tracking-[0.3em] uppercase mb-4 block">APPLICATION INTELLIGENCE</span>
                    <h3 className="text-4xl font-black tracking-tighter uppercase">{selectedApp.jobId?.title}</h3>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-gray-50 rounded-2xl transition-colors text-gray-400">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="space-y-12">
                  {/* Status Bar */}
                  <div className="bg-gray-50 p-8 rounded-[2.5rem] flex items-center justify-between flex-wrap gap-6">
                    <div className="flex items-center gap-6">
                      <div className={`${getStatusConfig(selectedApp.status).bg} p-4 rounded-2xl`}>
                        <Clock className={`w-6 h-6 ${getStatusConfig(selectedApp.status).color}`} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">CURRENT PHASE</p>
                        <p className="text-xl font-black uppercase tracking-tight">{getStatusConfig(selectedApp.status).label}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      {selectedApp.resumeUrl && (
                        <Link 
                          href={selectedApp.resumeUrl} 
                          target="_blank"
                          className="px-6 py-3 bg-white border border-gray-100 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-3 hover:border-lime-500 transition-all shadow-sm"
                        >
                          <FileDown className="w-4 h-4" /> Resume
                        </Link>
                      )}
                      {selectedApp.coverLetterUrl && (
                        <Link 
                          href={selectedApp.coverLetterUrl} 
                          target="_blank"
                          className="px-6 py-3 bg-black text-white rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-3 hover:text-lime-400 transition-all shadow-sm"
                        >
                          <FileText className="w-4 h-4 text-lime-400" /> Cover Letter
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Personal & Professional */}
                    <div className="space-y-12">
                      <section>
                        <div className="flex items-center gap-3 mb-6">
                          <User className="w-4 h-4 text-lime-500" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest">Candidate Identity</h4>
                        </div>
                        <div className="space-y-4 bg-gray-50/50 p-8 rounded-[2rem] border border-gray-50">
                          <div>
                            <p className="text-[8px] font-black text-gray-300 uppercase mb-1">Full Name</p>
                            <p className="font-bold text-sm">{selectedApp.fullName}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-gray-300 uppercase mb-1">Email Node</p>
                            <p className="font-bold text-sm">{selectedApp.email}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-gray-300 uppercase mb-1">Phone Protocol</p>
                            <p className="font-bold text-sm">{selectedApp.phone}</p>
                          </div>
                        </div>
                      </section>

                      <section>
                        <div className="flex items-center gap-3 mb-6">
                          <Layers className="w-4 h-4 text-lime-500" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest">Skill Matrix</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedApp.skills?.map((skill, i) => (
                            <span key={i} className="px-4 py-2 bg-gray-50 text-[10px] font-black uppercase tracking-widest rounded-lg border border-gray-100">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </section>
                    </div>

                    {/* Education & Experience */}
                    <div className="space-y-12">
                      <section>
                        <div className="flex items-center gap-3 mb-6">
                          <GraduationCap className="w-4 h-4 text-lime-500" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest">Academic History</h4>
                        </div>
                        <div className="p-8 bg-gray-50/50 rounded-[2rem] border border-gray-50 text-sm text-gray-500 whitespace-pre-wrap leading-relaxed">
                          {selectedApp.education || 'Academic records not specified.'}
                        </div>
                      </section>

                      <section>
                        <div className="flex items-center gap-3 mb-6">
                          <Briefcase className="w-4 h-4 text-lime-500" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest">Professional Experience</h4>
                        </div>
                        <div className="p-8 bg-gray-50/50 rounded-[2rem] border border-gray-50 text-sm text-gray-500 whitespace-pre-wrap leading-relaxed">
                          {selectedApp.experience || 'Professional history not specified.'}
                        </div>
                      </section>
                    </div>
                  </div>

                  {/* Cover Letter */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <FileText className="w-4 h-4 text-lime-500" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Transmission Statement (Manual Cover Letter)</h4>
                    </div>
                    <div className="p-10 bg-gray-50/50 rounded-[2.5rem] border border-gray-50 text-sm text-gray-600 leading-relaxed">
                      {selectedApp.coverLetter || 'No manual cover statement provided with this transmission.'}
                    </div>
                  </section>

                  {/* Question Answers */}
                  {selectedApp.questionAnswers?.length > 0 && (
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <HelpCircle className="w-4 h-4 text-lime-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Position Specific Inquiry Responses</h4>
                      </div>
                      <div className="space-y-4">
                        {selectedApp.questionAnswers.map((qa, i) => (
                          <div key={i} className="p-8 bg-gray-50/50 rounded-[2rem] border border-gray-50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Q: {qa.questionText}</p>
                            <div className="text-sm font-bold">
                              {qa.questionType === 'file' ? (
                                <Link href={qa.fileUrl} target="_blank" className="text-lime-500 hover:underline flex items-center gap-2">
                                  <Download className="w-3 h-3" /> View Submitted Document
                                </Link>
                              ) : (
                                Array.isArray(qa.answer) ? qa.answer.join(', ') : qa.answer || 'No response recorded.'
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="mt-12 pt-12 border-t border-gray-100 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-300">
                  <span>Application Protocol ID: {selectedApp._id}</span>
                  <span>Logged at {new Date(selectedApp.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
