'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, FileDown, Search, Filter, MoreHorizontal, 
  Shield, User, UserCheck, UserMinus, Trash2, Mail, Phone,
  Briefcase, Building2, Calendar, Download, Upload, X, Check,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { ROLES, STATUS, DEPARTMENTS, DEPARTMENT_POSITIONS, POSITION_LEVELS } from '@/utils/constants';

export default function EmployeeManagementPage() {
  const { currentUser, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        view: 'staff',
        page: currentPage,
        limit: 10,
        search: searchTerm,
        role: filterRole,
        status: filterStatus
      });
      
      const res = await fetch(`/api/admin/users?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setEmployees(data.users);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
        setTotalResults(data.pagination.total);
      } else {
        toast.error(data.message || 'Failed to fetch employees');
      }
    } catch (err) {
      toast.error('Synchronization failed');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterRole, filterStatus]);

  useEffect(() => {
    if (!currentUser || (!isAdmin && !isSuperAdmin)) {
      router.push('/dashboard');
      return;
    }
    fetchEmployees();
  }, [fetchEmployees, currentUser, isAdmin, isSuperAdmin, router]);

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast.error('Select CSV file first');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', bulkFile);

      const res = await fetch('/api/admin/users/bulk-upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setShowBulkModal(false);
        fetchEmployees();
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (err) {
      toast.error('Network failure');
    } finally {
      setUploading(false);
    }
  };

  const downloadSample = () => {
    const headers = ['name', 'email', 'phone', 'role', 'department', 'position', 'offerSalary', 'offerStartDate'];
    const sample = ['John Doe', 'john@fmpg.com', '9876543210', 'employee', 'Development', 'Software Engineer', '50000', '2024-05-15'];
    const csvContent = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fmpg_employee_template.csv';
    a.click();
  };

  if (loading && employees.length === 0) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse">Scanning Staff Registry...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-20 flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div>
            <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-500 transition-colors mb-8 block">
              ← Return to Cockpit
            </Link>
            <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">HUMAN CAPITAL MANAGEMENT</span>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
              Staff <br />
              <span className="text-lime-500">Registry</span>
            </h1>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setShowBulkModal(true)}
              className="px-10 py-6 bg-[#0a0a0a] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.05] transition-all shadow-xl flex items-center gap-4"
            >
              <Upload className="w-4 h-4 text-lime-400" />
              Bulk Import
            </button>
            <button 
              className="px-10 py-6 bg-white border border-gray-100 text-black rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.05] transition-all shadow-xl flex items-center gap-4"
            >
              <FileDown className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Intelligence Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {[
            { label: 'Active Staff', val: stats.activeStaff || 0, icon: UserCheck, color: 'text-lime-500' },
            { label: 'Administrators', val: (stats.totalAdmins || 0) + (stats.totalSuperAdmins || 0), icon: Shield, color: 'text-blue-500' },
            { label: 'Employees', val: stats.totalEmployees || 0, icon: Users, color: 'text-purple-500' },
            { label: 'Former Staff', val: stats.formerEmployees || 0, icon: UserMinus, color: 'text-gray-400' }
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">{stat.label}</span>
                <span className="text-4xl font-black tracking-tighter">{stat.val}</span>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          ))}
        </div>

        {/* Filter Matrix */}
        <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm mb-12 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-lime-500 transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH STAFF BY IDENTITY..."
              className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 pl-14 pr-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <select 
              className="bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] cursor-pointer"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">ALL ROLES</option>
              <option value="admin">ADMINS</option>
              <option value="employee">EMPLOYEES</option>
              <option value="super-admin">SUPER ADMINS</option>
            </select>
            <select 
              className="bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">ALL STATUS</option>
              <option value="active">ACTIVE</option>
              <option value="inactive">INACTIVE</option>
              <option value="former">FORMER</option>
              <option value="suspended">SUSPENDED</option>
            </select>
          </div>
        </div>

        {/* High-Density Registry Table */}
        <div className="bg-white border border-gray-100 rounded-[3.5rem] shadow-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Identity</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Position & Domain</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Authorization</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.map((staff) => (
                <tr key={staff._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black ${staff.role === 'super-admin' ? 'bg-lime-400 text-black' : 'bg-gray-100 text-gray-300'}`}>
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black uppercase tracking-widest text-xs mb-1">{staff.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{staff.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <p className="font-black uppercase tracking-widest text-[10px] mb-1">{staff.position || 'UNDEFINED POSITION'}</p>
                    <p className="text-[10px] font-bold text-lime-500 uppercase tracking-widest">{staff.department || 'GENERAL'}</p>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-2">
                      <Shield className={`w-3 h-3 ${staff.role === 'super-admin' ? 'text-lime-500' : 'text-gray-300'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{staff.role}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest 
                      ${staff.status === 'active' ? 'bg-lime-50 text-lime-500' : 
                        staff.status === 'suspended' ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>
                      {staff.status}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => router.push(`/admin/users?search=${staff.email}`)}
                        className="p-3 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all"
                        title="Manage Permissions"
                      >
                        <Shield className="w-4 h-4 text-gray-400" />
                      </button>
                      <button 
                        className="p-3 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all"
                        title="View Intelligence"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          <div className="p-10 border-t border-gray-50 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total: {totalResults} Staff Records</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      <AnimatePresence>
        {showBulkModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <div className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-10 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Bulk Import Matrix</h3>
                <button onClick={() => setShowBulkModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              
              <div 
                className="border-4 border-dashed border-gray-100 rounded-[2.5rem] p-12 text-center hover:border-lime-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById('csvInput').click()}
              >
                <input 
                  id="csvInput"
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={(e) => setBulkFile(e.target.files[0])}
                />
                {bulkFile ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-lime-400 rounded-2xl mx-auto flex items-center justify-center">
                      <Check className="w-8 h-8 text-black" />
                    </div>
                    <p className="font-black uppercase tracking-widest text-xs">{bulkFile.name}</p>
                    <p className="text-[10px] text-gray-400">READY FOR SYNCHRONIZATION</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-16 h-16 text-gray-200 mx-auto" />
                    <p className="font-black uppercase tracking-widest text-xs">Drop CSV Transmission</p>
                    <p className="text-[10px] text-gray-400">OR CLICK TO BROWSE FILES</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Requirement Checklist</span>
                  <button onClick={downloadSample} className="text-[10px] font-black uppercase tracking-widest text-lime-500 hover:underline">Download Template</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['NAME', 'EMAIL', 'ROLE', 'DOMAIN', 'POSITION', 'SALARY'].map(tag => (
                    <div key={tag} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                      <span className="text-[9px] font-black text-gray-500">{tag}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleBulkUpload}
                disabled={uploading || !bulkFile}
                className="w-full py-8 bg-[#0a0a0a] text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-lime-400 hover:text-black transition-all shadow-2xl disabled:opacity-50"
              >
                {uploading ? 'SYNCHRONIZING REGISTRY...' : 'EXECUTE BULK IMPORT'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
