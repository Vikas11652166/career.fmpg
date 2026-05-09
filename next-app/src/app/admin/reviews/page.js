'use client';

import { useState, useEffect } from 'react';
import { reviewService } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  User, 
  Calendar, 
  Briefcase,
  Check,
  X,
  AlertTriangle,
  Eye,
  MessageSquare,
  Search,
  ClipboardList,
  XCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function AdminReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: 'all',
    rating: 'all',
    reviewerType: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionData, setActionData] = useState({
    moderatorNotes: '',
    rejectionReason: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewService.getAllReviews(filters);
      setReviews(response.data.reviews || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to load reviews');
      toast.error('Registry synchronization failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }));
  };

  const openModal = (review, action) => {
    setSelectedReview(review);
    setActionType(action);
    setActionData({
      moderatorNotes: '',
      rejectionReason: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReview(null);
    setActionType(null);
    setActionData({
      moderatorNotes: '',
      rejectionReason: ''
    });
  };

  const handleAction = async () => {
    if (!selectedReview || !actionType) return;

    try {
      setActionLoading(true);
      
      if (actionType === 'approve') {
        await reviewService.approveReview(selectedReview._id, {
          moderatorNotes: actionData.moderatorNotes
        });
        toast.success('Review sanctioned and published');
      } else if (actionType === 'reject') {
        if (!actionData.rejectionReason.trim()) {
          toast.warning('Rejection justification required');
          return;
        }
        await reviewService.rejectReview(selectedReview._id, {
          rejectionReason: actionData.rejectionReason,
          moderatorNotes: actionData.moderatorNotes
        });
        toast.success('Review suppressed successfully');
      }

      await fetchReviews();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Protocol execution failure');
    } finally {
      setActionLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-3 h-3 ${
          index < rating ? 'text-lime-500 fill-lime-500' : 'text-gray-200'
        }`}
      />
    ));
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved': return { color: 'text-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle2, label: 'Sanctioned' };
      case 'rejected': return { color: 'text-red-500', bg: 'bg-red-50', icon: XCircle, label: 'Suppressed' };
      case 'pending': return { color: 'text-amber-500', bg: 'bg-amber-50', icon: Clock, label: 'Awaiting Audit' };
      default: return { color: 'text-gray-500', bg: 'bg-gray-50', icon: AlertCircle, label: status };
    }
  };

  if (loading && reviews.length === 0) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse">Accessing Feedback Vault...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-20">
          <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-500 transition-colors mb-8 block">
            ← Return to Cockpit
          </Link>
          <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">GOVERNANCE PROTOCOL</span>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
            Review <br />
            <span className="text-lime-500">Moderation</span>
          </h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Volume', value: pagination.total || 0, icon: MessageSquare, color: 'text-gray-400' },
            { label: 'Pending Audit', value: reviews.filter(r => r.status === 'pending').length, icon: Clock, color: 'text-amber-500' },
            { label: 'Sanctioned', value: reviews.filter(r => r.status === 'approved').length, icon: CheckCircle2, color: 'text-emerald-500' },
            { label: 'Suppressed', value: reviews.filter(r => r.status === 'rejected').length, icon: XCircle, color: 'text-red-500' }
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-6`} />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{stat.label}</p>
              <p className="text-4xl font-black tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm mb-12 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] appearance-none cursor-pointer"
            >
              <option value="all">ALL STATUSES</option>
              <option value="pending">PENDING</option>
              <option value="approved">SANCTIONED</option>
              <option value="rejected">SUPPRESSED</option>
            </select>

            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] appearance-none cursor-pointer"
            >
              <option value="all">ALL RATINGS</option>
              {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} STARS</option>)}
            </select>

            <select
              value={filters.reviewerType}
              onChange={(e) => handleFilterChange('reviewerType', e.target.value)}
              className="bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] appearance-none cursor-pointer"
            >
              <option value="all">ALL TYPES</option>
              <option value="employee">STAFF</option>
              <option value="offer_recipient">CANDIDATE</option>
            </select>

            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              className="bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] appearance-none cursor-pointer"
            >
              <option value="createdAt-desc">NEWEST FIRST</option>
              <option value="createdAt-asc">OLDEST FIRST</option>
              <option value="rating-desc">HIGHEST RATED</option>
              <option value="rating-asc">LOWEST RATED</option>
            </select>
          </div>
        </div>

        {/* Matrix */}
        <div className="bg-white border border-gray-100 rounded-[3.5rem] shadow-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Reviewer</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Feedback Matrix</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Protocol State</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reviews.map((review) => {
                const config = getStatusConfig(review.status);
                const StatusIcon = config.icon;
                return (
                  <tr key={review._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-lime-500 text-xs">
                          {review.userName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-widest text-xs mb-1">{review.userName}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{review.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-2">
                        <p className="font-black uppercase tracking-widest text-[10px] leading-tight max-w-xs">{review.title}</p>
                        <div className="flex gap-1">{renderStars(review.rating)}</div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                       <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[8px] ${config.bg} ${config.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                       </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openModal(review, 'view')}
                          className="p-3 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all"
                        >
                          <Eye className="w-4 h-4 text-gray-400 hover:text-black" />
                        </button>
                        {review.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => openModal(review, 'approve')}
                              className="p-3 hover:bg-emerald-50 rounded-xl border border-transparent hover:border-emerald-100 transition-all"
                            >
                              <Check className="w-4 h-4 text-emerald-500" />
                            </button>
                            <button 
                              onClick={() => openModal(review, 'reject')}
                              className="p-3 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all"
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {reviews.length === 0 && (
            <div className="p-20 text-center">
              <MessageSquare className="w-16 h-16 text-gray-100 mx-auto mb-6" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Zero feedback cycles detected</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-12 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button 
                disabled={filters.page === 1}
                onClick={() => handleFilterChange('page', filters.page - 1)}
                className="p-4 bg-white border border-gray-100 rounded-2xl disabled:opacity-20 hover:border-lime-500 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                disabled={filters.page === pagination.totalPages}
                onClick={() => handleFilterChange('page', filters.page + 1)}
                className="p-4 bg-white border border-gray-100 rounded-2xl disabled:opacity-20 hover:border-lime-500 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[3.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-12">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <span className="text-lime-500 font-black text-[10px] tracking-[0.3em] uppercase mb-4 block">MODERATION OVERRIDE</span>
                    <h3 className="text-4xl font-black tracking-tighter uppercase">
                      {actionType === 'view' ? 'Review Inspection' : actionType === 'approve' ? 'Sanction Review' : 'Suppress Review'}
                    </h3>
                  </div>
                  <button onClick={closeModal} className="p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                    <XCircle className="w-6 h-6 text-gray-300" />
                  </button>
                </div>

                <div className="space-y-10">
                  {/* Identity */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-8 rounded-[2rem]">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-4">REVIEWER IDENTITY</p>
                      <p className="font-black uppercase tracking-widest text-xs mb-1">{selectedReview.userName}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedReview.userEmail}</p>
                    </div>
                    <div className="bg-gray-50 p-8 rounded-[2rem]">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-4">RATING SCORE</p>
                      <div className="flex gap-2 mb-2">{renderStars(selectedReview.rating)}</div>
                      <p className="text-[10px] font-black text-lime-500 uppercase tracking-widest">{selectedReview.rating} OUT OF 5</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="bg-gray-50 p-8 rounded-[2rem]">
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-4">PRIMARY FEEDBACK</p>
                    <h4 className="font-black uppercase tracking-widest text-xs mb-4">{selectedReview.title}</h4>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed">{selectedReview.content}</p>
                  </div>

                  {/* Pros/Cons */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-emerald-50/50 border border-emerald-100 p-8 rounded-[2rem]">
                      <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                        <Check className="w-3 h-3" /> STRENGTHS
                      </p>
                      <p className="text-xs font-medium text-emerald-800 leading-relaxed">{selectedReview.pros || 'N/A'}</p>
                    </div>
                    <div className="bg-red-50/50 border border-red-100 p-8 rounded-[2rem]">
                      <p className="text-[8px] font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
                        <X className="w-3 h-3" /> FRICTION POINTS
                      </p>
                      <p className="text-xs font-medium text-red-800 leading-relaxed">{selectedReview.cons || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Action Fields */}
                  {actionType !== 'view' && (
                    <div className="space-y-6 pt-6 border-t border-gray-100">
                      {actionType === 'reject' && (
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">REJECTION JUSTIFICATION *</label>
                          <textarea 
                            value={actionData.rejectionReason}
                            onChange={(e) => setActionData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                            className="w-full bg-gray-50 border-2 border-transparent rounded-[2rem] p-8 outline-none focus:border-red-500 transition-all font-medium text-sm"
                            rows={4}
                            placeholder="Specify reason for suppression..."
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">INTERNAL MODERATOR NOTES</label>
                        <textarea 
                          value={actionData.moderatorNotes}
                          onChange={(e) => setActionData(prev => ({ ...prev, moderatorNotes: e.target.value }))}
                          className="w-full bg-gray-50 border-2 border-transparent rounded-[2rem] p-8 outline-none focus:border-lime-500 transition-all font-medium text-sm"
                          rows={2}
                          placeholder="Optional audit trail notes..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Controls */}
                  <div className="flex gap-4 pt-6">
                    <button 
                      onClick={closeModal}
                      className="flex-1 py-6 border-2 border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all"
                    >
                      Abort Protocol
                    </button>
                    {actionType === 'approve' && (
                      <button 
                        onClick={handleAction}
                        disabled={actionLoading}
                        className="flex-[2] py-6 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 hover:scale-[1.02] transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" /> {actionLoading ? 'SANCTIONING...' : 'CONFIRM SANCTION'}
                      </button>
                    )}
                    {actionType === 'reject' && (
                      <button 
                        onClick={handleAction}
                        disabled={actionLoading || !actionData.rejectionReason.trim()}
                        className="flex-[2] py-6 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 hover:scale-[1.02] transition-all shadow-xl shadow-red-500/20 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" /> {actionLoading ? 'SUPPRESSING...' : 'CONFIRM SUPPRESSION'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
