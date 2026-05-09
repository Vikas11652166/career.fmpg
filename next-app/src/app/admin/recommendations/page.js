'use client';

import { useState, useEffect } from 'react';
import { recommendationService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Eye, Check, X, User, Users, 
  Briefcase, ClipboardList, Settings, TrendingUp, 
  ArrowRight, Shield, Clock, Mail
} from 'lucide-react';

export default function RecommendationManagementPage() {
  const { isAdmin, isHR } = useAuth();
  const { hasPermission } = usePermissions();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, selected: 0, rejected: 0 });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: '', adminNotes: '' });

  useEffect(() => {
    if (isAdmin || isHR) {
      fetchRecommendations();
      fetchStats();
    }
  }, [filters, isAdmin, isHR]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await recommendationService.getAllRecommendations(filters);
      setRecommendations(response.data.data.recommendations);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Protocol failure: Could not retrieve recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await recommendationService.getRecommendationStats();
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Stats synchronization failed');
    }
  };

  const handleStatusUpdate = async (id, status, notes = '') => {
    try {
      await recommendationService.updateRecommendationStatus(id, {
        status,
        adminNotes: notes
      });
      toast.success(`Candidate status transitioned to ${status.toUpperCase()}`);
      setSelectedRecommendation(null);
      setReviewForm({ status: '', adminNotes: '' });
      fetchRecommendations();
      fetchStats();
    } catch (error) {
      toast.error('System failure: Status transition aborted');
    }
  };

  if (!isAdmin && !isHR) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-[10px]">
        Access Restricted: Admin Credentials Required
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20">
          <div>
            <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">GOVERNANCE TERMINAL</span>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
              Recommendation <br />
              <span className="text-lime-500">Registry</span>
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-4">
             {[
               { label: 'TOTAL', val: stats.total, icon: ClipboardList, color: 'text-gray-400' },
               { label: 'PENDING', val: stats.pending, icon: Clock, color: 'text-amber-500' },
               { label: 'SELECTED', val: stats.selected, icon: Check, color: 'text-lime-500' },
               { label: 'REJECTED', val: stats.rejected, icon: X, color: 'text-red-500' }
             ].map((s, i) => (
               <div key={i} className="bg-white border border-gray-100 px-8 py-6 rounded-[2rem] shadow-xl min-w-[160px]">
                 <div className="flex items-center gap-3 mb-2">
                   <s.icon className={`w-4 h-4 ${s.color}`} />
                   <span className="text-[8px] font-black tracking-widest text-gray-400 uppercase">{s.label}</span>
                 </div>
                 <div className="text-3xl font-black tracking-tighter">{s.val}</div>
               </div>
             ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-2xl mb-12 flex flex-wrap items-center gap-6">
          <div className="flex-1 min-w-[300px] relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-lime-500 transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH CANDIDATE OR EMAIL..." 
              className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-lime-500 transition-all font-black uppercase tracking-widest text-[10px]"
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <select 
              className="bg-gray-50 border-2 border-transparent rounded-xl py-4 px-6 outline-none focus:border-lime-500 transition-all font-black uppercase tracking-widest text-[10px]"
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
            >
              <option value="">ALL STATUS</option>
              <option value="pending">PENDING</option>
              <option value="reviewed">REVIEWED</option>
              <option value="selected">SELECTED</option>
              <option value="rejected">REJECTED</option>
            </select>
            
            <button 
              onClick={() => setFilters({ status: '', search: '', page: 1, limit: 10 })}
              className="px-8 py-4 bg-[#0a0a0a] text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-lime-400 hover:text-black transition-all"
            >
              RESET
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-100 rounded-[3rem] shadow-2xl overflow-hidden">
          {loading ? (
            <div className="p-20 flex flex-col items-center gap-6">
              <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-400">Synchronizing Data...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-left">
                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Candidate</th>
                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Target Position</th>
                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Originator</th>
                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recommendations.map((rec) => (
                    <motion.tr key={rec._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-lg group-hover:bg-lime-400 transition-colors">
                            {rec.recommendedUserName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black uppercase tracking-tight text-sm">{rec.recommendedUserName}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{rec.recommendedUserEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="font-black uppercase tracking-tight text-sm">{rec.jobId?.title || 'GENERAL'}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{rec.jobId?.department || 'ANY'}</div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-lime-100 transition-colors">
                            <User className="w-4 h-4 text-gray-400 group-hover:text-lime-600" />
                          </div>
                          <div>
                            <div className="font-black uppercase tracking-tight text-xs">{rec.recommender?.name}</div>
                            <div className="text-[8px] font-bold text-lime-500 uppercase tracking-widest">ID: {rec.recommenderId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] ${
                          rec.status === 'selected' ? 'bg-lime-100 text-lime-600' :
                          rec.status === 'rejected' ? 'bg-red-100 text-red-600' :
                          rec.status === 'reviewed' ? 'bg-blue-100 text-blue-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setSelectedRecommendation(rec);
                              setReviewForm({ status: rec.status, adminNotes: rec.adminNotes || '' });
                            }}
                            className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-lime-400 transition-all shadow-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-10 flex justify-center gap-4">
             <button 
               disabled={filters.page === 1}
               onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
               className="px-8 py-4 bg-white border border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] disabled:opacity-30 hover:bg-lime-400 transition-all"
             >
               PREV
             </button>
             <button 
               disabled={filters.page === pagination.totalPages}
               onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
               className="px-8 py-4 bg-[#0a0a0a] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] disabled:opacity-30 hover:bg-lime-400 hover:text-black transition-all"
             >
               NEXT
             </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedRecommendation && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white border border-gray-100 w-full max-w-2xl rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden"
            >
               <div className="p-12">
                  <div className="flex items-center justify-between mb-12">
                    <div>
                      <span className="text-lime-500 font-black text-[10px] tracking-widest uppercase mb-2 block">CANDIDATE ANALYSIS</span>
                      <h2 className="text-4xl font-black tracking-tighter uppercase">{selectedRecommendation.recommendedUserName}</h2>
                    </div>
                    <button onClick={() => setSelectedRecommendation(null)} className="p-4 bg-gray-50 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-12">
                     <div className="bg-gray-50/50 p-8 rounded-[2rem]">
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-4 block text-center">MISSION OBJECTIVE</span>
                        <div className="text-center">
                           <Briefcase className="w-6 h-6 mx-auto mb-3 text-lime-500" />
                           <div className="font-black uppercase text-sm">{selectedRecommendation.jobId?.title || 'GENERAL'}</div>
                           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedRecommendation.jobId?.department || 'ALL DEPTS'}</div>
                        </div>
                     </div>
                     <div className="bg-gray-50/50 p-8 rounded-[2rem]">
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-4 block text-center">INTELLIGENCE SOURCE</span>
                        <div className="text-center">
                           <User className="w-6 h-6 mx-auto mb-3 text-blue-500" />
                           <div className="font-black uppercase text-sm">{selectedRecommendation.recommender?.name}</div>
                           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {selectedRecommendation.recommenderId}</div>
                        </div>
                     </div>
                  </div>

                  {selectedRecommendation.recommendationMessage && (
                    <div className="mb-12">
                       <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-4 block">RECOMMENDER STATEMENT</span>
                       <div className="bg-gray-50 p-8 rounded-[2rem] text-sm font-medium text-gray-600 leading-relaxed italic border-l-8 border-lime-400">
                          "{selectedRecommendation.recommendationMessage}"
                       </div>
                    </div>
                  )}

                  <div className="space-y-6">
                     <div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-4 block">COMMAND DECISION</span>
                        <select 
                          className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-10 outline-none focus:border-lime-500 transition-all font-black uppercase tracking-widest text-xs"
                          value={reviewForm.status}
                          onChange={(e) => setReviewForm(f => ({ ...f, status: e.target.value }))}
                        >
                           <option value="pending">PENDING</option>
                           <option value="reviewed">REVIEWED</option>
                           <option value="selected">SELECT CANDIDATE</option>
                           <option value="rejected">REJECT CANDIDATE</option>
                        </select>
                     </div>

                     <div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-4 block">INTERNAL NOTES</span>
                        <textarea 
                          placeholder="ADD OPERATIONAL CONTEXT..."
                          className="w-full h-32 bg-gray-50 border-2 border-transparent rounded-[2rem] py-8 px-10 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] resize-none"
                          value={reviewForm.adminNotes}
                          onChange={(e) => setReviewForm(f => ({ ...f, adminNotes: e.target.value }))}
                        />
                     </div>
                  </div>

                  <div className="mt-12 flex gap-4">
                     <button 
                        onClick={() => setSelectedRecommendation(null)}
                        className="flex-1 py-6 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all"
                     >
                        ABORT
                     </button>
                     <button 
                        onClick={() => handleStatusUpdate(selectedRecommendation._id, reviewForm.status, reviewForm.adminNotes)}
                        className="flex-[2] py-6 bg-lime-400 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-all shadow-xl shadow-lime-400/20"
                     >
                        FINALIZE DECISION
                     </button>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
