'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, FileText, CheckCircle2, ShieldCheck, Mail, Download, 
  Search, Plus, X, ArrowRight, Clock, Trash2, ExternalLink,
  ChevronLeft, ChevronRight, Filter, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function CertificationManagementPage() {
  const { currentUser, isAdmin, isHR } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'certificates');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'certificates' ? '/api/certification' : '/api/admin/offer-letters';
      const query = new URLSearchParams({
        page: currentPage,
        search: searchTerm
      });
      
      const res = await fetch(`${endpoint}?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const result = await res.json();
      
      if (res.ok) {
        setData(activeTab === 'certificates' ? result.certificates : result.offerLetters);
        setTotalPages(result.pagination?.totalPages || 1);
      } else {
        toast.error(result.message || 'Failed to sync registry');
      }
    } catch (err) {
      toast.error('Network synchronization failure');
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, searchTerm]);

  useEffect(() => {
    if (!currentUser || (!isAdmin && !isHR)) {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [fetchData, currentUser, isAdmin, isHR, router]);

  const handleIssueCertificate = async (formData) => {
    try {
      setProcessing(true);
      const res = await fetch('/api/certification', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Certificate synthesized successfully');
        setShowIssueModal(false);
        fetchData();
      } else {
        toast.error(result.message || 'Synthesis failed');
      }
    } catch (err) {
      toast.error('Protocol failure');
    } finally {
      setProcessing(false);
    }
  };

  if (loading && data.length === 0) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse">Accessing Credential Vault...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-20 flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div>
            <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-500 transition-colors mb-8 block">
              ← Return to Cockpit
            </Link>
            <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">CREDENTIAL GOVERNANCE</span>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
              System <br />
              <span className="text-lime-500">Registry</span>
            </h1>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setShowIssueModal(true)}
              className="px-10 py-6 bg-[#0a0a0a] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.05] transition-all shadow-xl flex items-center gap-4"
            >
              <Plus className="w-4 h-4 text-lime-400" />
              Issue {activeTab === 'certificates' ? 'Certificate' : 'Offer Letter'}
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
          {[
            { id: 'certificates', label: 'Internship Certificates', icon: Award },
            { id: 'offers', label: 'Offer Transmissions', icon: FileText },
            { id: 'contracts', label: 'Employment Contracts', icon: ShieldCheck }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              className={`px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-4 transition-all whitespace-nowrap
                ${activeTab === tab.id ? 'bg-[#0a0a0a] text-white shadow-xl' : 'bg-white border border-gray-100 text-gray-400 hover:border-lime-500 hover:text-lime-500'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Intelligence */}
        <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm mb-12 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-lime-500 transition-colors" />
            <input 
              type="text" 
              placeholder="FILTER REGISTRY BY IDENTITY OR ID..."
              className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 pl-14 pr-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Registry Matrix */}
        <div className="bg-white border border-gray-100 rounded-[3.5rem] shadow-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Identity</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Position / Domain</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Credential ID</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Timestamp</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-10 py-8">
                    <div>
                      <p className="font-black uppercase tracking-widest text-xs mb-1">{item.candidateName || item.fullName || 'UNKNOWN CANDIDATE'}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.email}</p>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <p className="font-black uppercase tracking-widest text-[10px] mb-1">{item.jobrole || item.position}</p>
                    <p className="text-[10px] font-bold text-lime-500 uppercase tracking-widest">{item.domain || item.department}</p>
                  </td>
                  <td className="px-10 py-8">
                    <span className="font-mono text-[10px] font-black text-gray-400 bg-gray-50 px-3 py-1 rounded-lg">
                      {item.certificateId || item._id.toString().slice(-8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {new Date(item.createdAt || item.issuedAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-3 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all">
                        <Download className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-3 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all">
                        <Mail className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-10 py-20 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="font-black uppercase tracking-widest text-gray-300 text-xs">No records found in current matrix</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
