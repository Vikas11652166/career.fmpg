'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { recommendationService, applicationService } from '@/services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Briefcase, Plus, Clock, CheckCircle, 
  XCircle, Trash, Eye, Send, ArrowRight, Shield,
  Award, TrendingUp, Info
} from 'lucide-react';

export default function EmployeeProfilePage() {
  const { currentUser, isEmployee } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [availableApplications, setAvailableApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({ pending: 0, total: 0 });
  const [form, setForm] = useState({
    applicationId: '',
    recommendationMessage: ''
  });
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    if (currentUser && (isEmployee || currentUser.role === 'admin' || currentUser.role === 'super-admin')) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, appRes] = await Promise.all([
        recommendationService.getMyRecommendations(),
        applicationService.getApplicationsForRecommendation()
      ]);
      
      const recData = recRes.data.data;
      setRecommendations(recData.recommendations);
      setStats({
        pending: recData.pagination.pendingCount || 0,
        total: recData.pagination.totalCount || 0
      });
      setAvailableApplications(appRes.data.data);
    } catch (error) {
      toast.error('System failure: Could not sync employee data');
    } finally {
      setLoading(false);
    }
  };

  const handleAppChange = (appId) => {
    setForm(f => ({ ...f, applicationId: appId }));
    const app = availableApplications.find(a => a._id === appId);
    setSelectedApp(app);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp || !form.recommendationMessage) {
      toast.error('Validation error: Incomplete transmission data');
      return;
    }

    if (stats.pending >= 5) {
      toast.warning('Command limit reached: Maximum 5 pending recommendations allowed');
      return;
    }

    try {
      setSubmitting(true);
      await recommendationService.createRecommendation({
        recommendedUserEmail: selectedApp.email,
        recommendedUserName: selectedApp.fullName,
        jobId: selectedApp.jobId._id,
        recommendationMessage: form.recommendationMessage
      });
      
      toast.success('Recommendation transmission successful');
      setShowForm(false);
      setForm({ applicationId: '', recommendationMessage: '' });
      setSelectedApp(null);
      fetchData();
    } catch (error) {
      toast.error('Transmission failure: Server rejected recommendation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Abort this recommendation? This action is irreversible.')) return;
    try {
      await recommendationService.deleteRecommendation(id);
      toast.success('Recommendation purged from registry');
      fetchData();
    } catch (error) {
      toast.error('System failure: Purge aborted');
    }
  };

  if (!currentUser) return null;

  if (loading) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-[10px] animate-pulse">Initializing Employee Profile...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20">
          <div>
            <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">EMPLOYEE COCKPIT</span>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
              System <br />
              <span className="text-lime-500">Identity</span>
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-4">
             <div className="bg-white border border-gray-100 px-10 py-8 rounded-[2.5rem] shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                      <User className="w-5 h-5 text-lime-500" />
                   </div>
                   <div>
                      <div className="text-[8px] font-black tracking-widest text-gray-400 uppercase">ACTIVE OPERATOR</div>
                      <div className="text-xl font-black uppercase tracking-tight">{currentUser.name}</div>
                   </div>
                </div>
                <div className="flex items-center gap-8 border-t border-gray-50 pt-6 mt-2">
                   <div>
                      <div className="text-[8px] font-black tracking-widest text-gray-400 uppercase">CORP ID</div>
                      <div className="font-black text-sm text-lime-600">{currentUser.employeeId || 'FMPG-000'}</div>
                   </div>
                   <div>
                      <div className="text-[8px] font-black tracking-widest text-gray-400 uppercase">DEPT</div>
                      <div className="font-black text-sm">{currentUser.department || 'GENERAL'}</div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Stats & Action */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
           <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'PENDING RECS', val: stats.pending, icon: Clock, color: 'text-amber-500' },
                { label: 'TOTAL SUBMITTED', val: stats.total, icon: Send, color: 'text-lime-500' },
                { label: 'QUOTA STATUS', val: `${stats.pending}/5`, icon: Shield, color: 'text-blue-500' }
              ].map((s, i) => (
                <div key={i} className="bg-white border border-gray-100 p-8 rounded-[2rem] shadow-lg">
                   <div className="flex items-center gap-3 mb-4">
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                      <span className="text-[8px] font-black tracking-widest text-gray-400 uppercase">{s.label}</span>
                   </div>
                   <div className="text-4xl font-black tracking-tighter">{s.val}</div>
                </div>
              ))}
           </div>
           <div className="lg:col-span-4">
              <button 
                onClick={() => setShowForm(true)}
                disabled={stats.pending >= 5}
                className={`w-full h-full p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center transition-all group ${stats.pending >= 5 ? 'bg-gray-50 border-2 border-dashed border-gray-100 cursor-not-allowed' : 'bg-[#0a0a0a] text-white hover:bg-lime-400 hover:text-black shadow-2xl'}`}
              >
                 <Plus className={`w-10 h-10 mb-4 transition-transform group-hover:rotate-90 ${stats.pending >= 5 ? 'text-gray-200' : 'text-lime-400 group-hover:text-black'}`} />
                 <h3 className="text-xl font-black uppercase tracking-tight mb-2">Initialize Recommendation</h3>
                 <p className={`text-[10px] font-bold uppercase tracking-widest ${stats.pending >= 5 ? 'text-gray-400' : 'text-gray-500 group-hover:text-black/60'}`}>
                    {stats.pending >= 5 ? 'COMMAND LIMIT REACHED' : 'Support Internal Talent Growth'}
                 </p>
              </button>
           </div>
        </div>

        {/* Recommendations List */}
        <div className="mb-20">
           <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-black uppercase tracking-tighter">Recommendation <span className="text-lime-500">Registry</span></h2>
              <div className="h-[2px] flex-1 bg-gray-100 mx-10 hidden md:block" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {recommendations.length === 0 ? (
                  <div className="col-span-full bg-white border border-gray-100 p-20 rounded-[3rem] text-center">
                     <Info className="w-12 h-12 text-gray-100 mx-auto mb-6" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Zero Referral Transmissions Detected</p>
                  </div>
                ) : (
                  recommendations.map((rec) => (
                    <motion.div 
                      key={rec._id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden"
                    >
                       <div className="flex justify-between items-start mb-6">
                          <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest ${
                            rec.status === 'selected' ? 'bg-lime-100 text-lime-600' :
                            rec.status === 'rejected' ? 'bg-red-100 text-red-600' :
                            'bg-amber-100 text-amber-600'
                          }`}>
                            {rec.status}
                          </span>
                          {rec.status === 'pending' && (
                            <button onClick={() => handleDelete(rec._id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                               <Trash className="w-4 h-4" />
                            </button>
                          )}
                       </div>
                       <h3 className="text-xl font-black uppercase tracking-tight mb-2 group-hover:text-lime-500 transition-colors">{rec.recommendedUserName}</h3>
                       <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">{rec.recommendedUserEmail}</div>
                       
                       <div className="bg-gray-50 p-6 rounded-2xl mb-6">
                          <div className="flex items-center gap-3 mb-2">
                             <Briefcase className="w-3 h-3 text-lime-500" />
                             <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">TARGET MISSION</span>
                          </div>
                          <div className="text-xs font-black uppercase tracking-tight">{rec.jobId?.title || 'GENERAL'}</div>
                       </div>

                       <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-gray-300">
                          <span>Transmission Date</span>
                          <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                       </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>

      {/* Recommendation Form Modal */}
      <AnimatePresence>
         {showForm && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl flex items-center justify-center p-6">
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white border border-gray-100 w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12">
                 <div className="flex items-center justify-between mb-12">
                    <div>
                       <span className="text-lime-500 font-black text-[10px] tracking-widest uppercase mb-2 block">NEW TRANSMISSION</span>
                       <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Referral <br /> Intelligence</h2>
                    </div>
                    <button onClick={() => setShowForm(false)} className="p-4 bg-gray-50 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all">
                       <XCircle className="w-6 h-6" />
                    </button>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-8">
                    <div>
                       <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-4 block">SELECT CANDIDATE FROM RECENT APPLICATIONS</label>
                       <select 
                        className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-10 outline-none focus:border-lime-500 transition-all font-black uppercase tracking-widest text-xs"
                        value={form.applicationId}
                        onChange={(e) => handleAppChange(e.target.value)}
                        required
                       >
                          <option value="">SCANNING DIRECTORY...</option>
                          {availableApplications.map(app => (
                            <option key={app._id} value={app._id}>{app.fullName} - {app.jobId?.title}</option>
                          ))}
                       </select>
                       <p className="mt-3 text-[8px] font-bold text-gray-400 uppercase tracking-widest">Only pending candidates who applied directly are eligible for recommendation.</p>
                    </div>

                    <AnimatePresence>
                       {selectedApp && (
                         <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-lime-50/50 border border-lime-100 p-8 rounded-[2rem]">
                            <div className="flex items-center gap-6">
                               <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl text-lime-500 shadow-sm">
                                  {selectedApp.fullName.charAt(0)}
                               </div>
                               <div>
                                  <div className="font-black uppercase tracking-tight text-lg">{selectedApp.fullName}</div>
                                  <div className="text-[10px] font-bold text-lime-600 uppercase tracking-widest">{selectedApp.jobId?.title}</div>
                               </div>
                            </div>
                         </motion.div>
                       )}
                    </AnimatePresence>

                    <div>
                       <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-4 block">MISSION JUSTIFICATION</label>
                       <textarea 
                        placeholder="WHY IS THIS CANDIDATE A HIGH-VALUE ASSET?"
                        className="w-full h-40 bg-gray-50 border-2 border-transparent rounded-[2.5rem] py-8 px-10 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] resize-none"
                        value={form.recommendationMessage}
                        onChange={(e) => setForm(f => ({ ...f, recommendationMessage: e.target.value }))}
                        maxLength={500}
                        required
                       />
                       <div className="flex justify-between mt-3 px-4">
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">MIN 20 CHARACTERS</span>
                          <span className="text-[8px] font-black text-lime-500 uppercase tracking-widest">{form.recommendationMessage.length}/500</span>
                       </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                       <button 
                        type="button" 
                        onClick={() => setShowForm(false)}
                        className="flex-1 py-6 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all"
                       >
                          ABORT
                       </button>
                       <button 
                        type="submit" 
                        disabled={submitting || !selectedApp}
                        className="flex-[2] py-6 bg-[#0a0a0a] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-lime-400 hover:text-black transition-all shadow-2xl disabled:opacity-30 disabled:cursor-not-allowed"
                       >
                          {submitting ? 'TRANSMITTING...' : 'FINALIZE RECOMMENDATION'}
                       </button>
                    </div>
                 </form>
              </motion.div>
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}
