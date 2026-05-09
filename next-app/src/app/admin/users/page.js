'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Eye, Trash2, Mail, Phone, Calendar, CheckCircle, Ban, User, X, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import Link from 'next/link';

export default function UserManagementPage() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0 });
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        view: 'users'
      });
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();

      if (res.ok) {
        setUsers(data.users);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
        setTotalResults(data.pagination.total);
      } else {
        toast.error(data.message || 'Failed to fetch directory');
      }
    } catch (err) {
      toast.error('Synchronization failed');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterStatus]);

  useEffect(() => {
    if (!currentUser || !isAdmin) {
      router.push('/login');
      return;
    }
    fetchUsers();
  }, [fetchUsers, currentUser, isAdmin, router]);

  const handleUpdateStatus = async (status) => {
    try {
      setUpdating(true);
      const res = await fetch(`/api/admin/users/${selectedUser._id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('User status updated');
        setShowModal(false);
        fetchUsers();
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch (err) {
      toast.error('Network failure during update');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action is irreversible.')) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('User deleted successfully');
        fetchUsers();
      } else {
        toast.error(data.message || 'Deletion failed');
      }
    } catch (err) {
      toast.error('Network failure during deletion');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-500 bg-yellow-50 border-yellow-100',
      reviewing: 'text-blue-500 bg-blue-50 border-blue-100',
      shortlisted: 'text-purple-500 bg-purple-50 border-purple-100',
      rejected: 'text-red-500 bg-red-50 border-red-100',
      offered: 'text-lime-500 bg-lime-50 border-lime-100',
      hired: 'text-emerald-500 bg-emerald-50 border-emerald-100',
      'Not Applied': 'text-gray-400 bg-gray-50 border-gray-100'
    };
    return colors[status] || 'text-gray-400 bg-gray-50 border-gray-100';
  };

  if (loading && users.length === 0) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse">Accessing Directory Intelligence...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-500 transition-colors mb-8 block">
            ← Return to Cockpit
          </Link>
          <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">RESOURCES GOVERNANCE</span>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
            User <br />
            <span className="text-lime-500">Directory</span>
          </h1>
        </div>

        {/* Intelligence Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white border border-gray-100 p-10 rounded-[3rem] shadow-xl flex items-center gap-8">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <span className="text-gray-400 font-black uppercase tracking-widest text-[10px] block mb-2">Total Registrations</span>
              <p className="text-5xl font-black tracking-tighter">{stats.totalUsers}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 p-10 rounded-[3rem] shadow-xl flex items-center gap-8">
            <div className="w-16 h-16 bg-lime-50 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-lime-500" />
            </div>
            <div>
              <span className="text-gray-400 font-black uppercase tracking-widest text-[10px] block mb-2">Active Accounts</span>
              <p className="text-5xl font-black tracking-tighter text-lime-500">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        {/* Filters Cockpit */}
        <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm mb-12 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-lime-500 transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH BY IDENTITY / CONTACT..."
              className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 pl-14 pr-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="lg:w-72 relative">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <select 
              className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 pl-14 pr-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] appearance-none cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">ALL PROTOCOLS</option>
              <option value="pending">PENDING</option>
              <option value="reviewing">REVIEWING</option>
              <option value="shortlisted">SHORTLISTED</option>
              <option value="offered">OFFERED</option>
              <option value="hired">HIRED</option>
              <option value="rejected">REJECTED</option>
              <option value="Not Applied">NOT APPLIED</option>
            </select>
          </div>
          <button 
            onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
            className="px-10 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all"
          >
            RESET
          </button>
        </div>

        {/* Results Matrix */}
        <div className="bg-white border border-gray-100 rounded-[3.5rem] shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Identity</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Communication</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Protocol State</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <motion.tr 
                    key={user._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-xl font-black text-gray-300 group-hover:bg-lime-400 group-hover:text-black transition-all">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-widest text-xs mb-1">{user.name}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <Calendar className="w-3 h-3" />
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <Mail className="w-3 h-3 text-lime-500" /> {user.email}
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <Phone className="w-3 h-3 text-blue-500" /> {user.phoneNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`inline-flex px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusColor(user.applicationStatus)}`}>
                        {user.applicationStatus}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => { setSelectedUser(user); setShowModal(true); }}
                          className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-lime-400 hover:text-black transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user.role !== 'super-admin' && (
                          <button 
                            onClick={() => handleDeleteUser(user._id)}
                            className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-gray-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Command */}
          {totalPages > 1 && (
            <div className="px-10 py-8 bg-gray-50/50 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Matrix Page {currentPage} OF {totalPages}
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-lime-400 hover:text-black transition-all disabled:opacity-50 shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-lime-400 hover:text-black transition-all disabled:opacity-50 shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Identity Modal */}
      <AnimatePresence>
        {showModal && selectedUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 border-b border-gray-50 flex justify-between items-center">
                <div>
                  <span className="text-lime-500 font-black text-[10px] tracking-[0.3em] uppercase mb-2 block">Protocol Identification</span>
                  <h3 className="text-3xl font-black uppercase tracking-tighter">User Intelligence</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-10 space-y-10">
                <div className="flex items-center gap-8">
                  <div className="w-24 h-24 bg-gray-100 rounded-[2rem] flex items-center justify-center text-4xl font-black text-gray-300">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-2xl font-black uppercase tracking-tight mb-2">{selectedUser.name}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedUser.role} / {selectedUser.email}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-4">Operational Status Control</span>
                    <div className="grid grid-cols-3 gap-4">
                      {['active', 'inactive', 'suspended'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleUpdateStatus(status)}
                          disabled={updating}
                          className={`py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 transition-all ${selectedUser.status === status ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]' : 'bg-white text-gray-400 border-gray-100 hover:border-lime-400'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-8 rounded-[2rem] space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Communication Node</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-800">{selectedUser.phoneNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registry Timestamp</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-800">{new Date(selectedUser.createdAt).toLocaleString()}</span>
                    </div>
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
