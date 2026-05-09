'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, FileText, Search, Plus, Filter, Download, Mail, 
  Trash2, ExternalLink, Calendar, User, Briefcase, 
  CheckCircle2, Clock, AlertCircle, X, ChevronLeft, 
  ChevronRight, RefreshCw, Send, History, MapPin, 
  Building2, Phone, DollarSign, BriefcaseIcon, GraduationCap,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { generateCertificatePDF, generateOfferLetterPDF } from '@/utils/pdfGenerator';
import { certificateService, offerLetterService } from '@/services/api';
// import { format } from 'date-fns';
const format = (date, formatStr) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export default function CertificationManagementPage() {
  const { currentUser, isAdmin, isHR } = useAuth();
  const [activeTab, setActiveTab] = useState('certificates'); // 'certificates' or 'offers'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);

  const [issueData, setIssueData] = useState({
    // Certificate fields
    name: '',
    email: '',
    domain: '',
    jobrole: '',
    fromDate: '',
    toDate: '',
    issuedBy: 'FMPG',
    // Offer fields
    candidateName: '',
    position: '',
    department: '',
    salary: '',
    startDate: '',
    joiningLocation: 'Indore',
    workType: 'On-site',
    validUntil: '',
    offerType: 'Job',
    payoutFrequency: 'Monthly'
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'certificates' ? '/api/certification' : '/api/admin/offer-letters';
      const query = new URLSearchParams({
        page: currentPage,
        search: searchTerm,
        limit: 10
      });
      
      const res = await fetch(`${endpoint}?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const result = await res.json();
      
      if (res.ok) {
        setItems(activeTab === 'certificates' ? result.certificates : result.offerLetters);
        setTotalPages(result.pagination.totalPages);
      } else {
        toast.error(result.message || 'Synchronization failed');
      }
    } catch (err) {
      toast.error('Network protocol failure');
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleIssue = async (e) => {
    e.preventDefault();
    try {
      setIsIssuing(true);
      const endpoint = activeTab === 'certificates' ? '/api/certification' : '/api/admin/offer-letters'; // Use separate POST for offers if needed
      
      // For now, let's assume we use /api/certification for both or handle separate
      // Actually, MERN uses issueOfferLetter for offers.
      // I'll need a POST for /api/admin/offer-letters too.
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(activeTab === 'certificates' ? {
          name: issueData.name,
          recipientEmail: issueData.email,
          domain: issueData.domain,
          jobrole: issueData.jobrole,
          fromDate: issueData.fromDate,
          toDate: issueData.toDate,
          issuedBy: issueData.issuedBy
        } : {
          candidateName: issueData.candidateName,
          email: issueData.email,
          position: issueData.position,
          department: issueData.department,
          salary: issueData.salary,
          startDate: issueData.startDate,
          joiningLocation: issueData.joiningLocation,
          workType: issueData.workType,
          validUntil: issueData.validUntil,
          offerType: issueData.offerType,
          payoutFrequency: issueData.payoutFrequency
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`${activeTab === 'certificates' ? 'Certificate' : 'Offer'} sanctioned successfully`);
        setShowIssueModal(false);
        fetchData();
      } else {
        toast.error(data.message || 'Protocol execution failure');
      }
    } catch (err) {
      toast.error('System synchronization failure');
    } finally {
      setIsIssuing(false);
    }
  };

  const renderCertificateTable = () => (
    <table className="w-full text-left">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-100">
          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Recipient</th>
          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Credential</th>
          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Duration</th>
          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Issued On</th>
          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {items.map((cert) => (
          <tr key={cert._id} className="hover:bg-gray-50/50 transition-colors group">
            <td className="px-10 py-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-lime-50 flex items-center justify-center font-black text-lime-500 text-xs">
                  {cert.name.charAt(0)}
                </div>
                <div>
                  <p className="font-black uppercase tracking-widest text-xs mb-1">{cert.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cert.recipientEmail}</p>
                </div>
              </div>
            </td>
            <td className="px-10 py-8">
              <p className="font-black uppercase tracking-widest text-[10px] mb-1">{cert.jobrole}</p>
              <p className="text-[10px] font-bold text-lime-500 uppercase tracking-widest">{cert.domain}</p>
            </td>
            <td className="px-10 py-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {format(new Date(cert.fromDate), 'MMM yyyy')} - {format(new Date(cert.toDate), 'MMM yyyy')}
            </td>
            <td className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">
              {format(new Date(cert.issuedOn || cert.createdAt), 'dd MMM yyyy')}
            </td>
            <td className="px-10 py-8 text-right">
              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={async () => {
                    try {
                      await certificateService.sendCertificateEmail(cert._id, { email: cert.recipientEmail });
                      toast.success('Certificate dispatched via email');
                    } catch(err) {
                      toast.error('Failed to dispatch email');
                    }
                  }}
                  className="p-3 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all">
                  <Mail className="w-4 h-4 text-gray-400" />
                </button>
                <button 
                  onClick={async () => {
                    toast.info('Generating PDF...');
                    try {
                      const res = await fetch('/api/admin/templates?documentType=certificate');
                      const data = await res.json();
                      const defaultTemplate = data.templates?.find(t => t.isDefault) || null;
                      await generateCertificatePDF(cert, defaultTemplate);
                    } catch (err) {
                      await generateCertificatePDF(cert, null);
                    }
                  }}
                  className="p-3 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all">
                  <Download className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderOfferTable = () => (
    <table className="w-full text-left">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-100">
          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Candidate</th>
          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Position</th>
          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Start Date</th>
          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">State</th>
          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {items.map((offer) => (
          <tr key={offer._id} className="hover:bg-gray-50/50 transition-colors group">
            <td className="px-10 py-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-500 text-xs">
                  {(offer.candidateName || offer.name || '?').charAt(0)}
                </div>
                <div>
                  <p className="font-black uppercase tracking-widest text-xs mb-1">{offer.candidateName || offer.name || 'Unknown'}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{offer.email}</p>
                </div>
              </div>
            </td>
            <td className="px-10 py-8">
              <p className="font-black uppercase tracking-widest text-[10px] mb-1">{offer.position}</p>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{offer.department}</p>
            </td>
            <td className="px-10 py-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {format(new Date(offer.startDate), 'dd MMM yyyy')}
            </td>
            <td className="px-10 py-8">
              <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest 
                ${offer.status === 'Accepted' ? 'bg-emerald-50 text-emerald-500' : 
                  offer.status === 'Rejected' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                {offer.status}
              </span>
            </td>
            <td className="px-10 py-8 text-right">
              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={async () => {
                    try {
                      await offerLetterService.sendOfferLetterEmail(offer._id, { email: offer.email });
                      toast.success('Offer Letter dispatched via email');
                    } catch(err) {
                      toast.error('Failed to dispatch email');
                    }
                  }}
                  className="p-3 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all">
                  <Mail className="w-4 h-4 text-gray-400" />
                </button>
                <button 
                  onClick={async () => {
                    toast.info('Generating PDF...');
                    try {
                      const res = await fetch('/api/admin/templates?documentType=offerLetter');
                      const data = await res.json();
                      const defaultTemplate = data.templates?.find(t => t.isDefault) || null;
                      await generateOfferLetterPDF(offer, defaultTemplate);
                    } catch (err) {
                      await generateOfferLetterPDF(offer, null);
                    }
                  }}
                  className="p-3 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all">
                  <Download className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (!isAdmin && !isHR) return null;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
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
            <Link 
              href="/admin/templates"
              className="px-8 py-6 bg-white border-2 border-gray-100 text-black rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:border-lime-500 hover:scale-[1.05] transition-all shadow-sm hover:shadow-xl flex items-center gap-4"
            >
              <FileText className="w-4 h-4 text-gray-400" />
              Template Studio
            </Link>
            <button 
              onClick={() => setShowIssueModal(true)}
              className="px-10 py-6 bg-[#0a0a0a] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.05] transition-all shadow-xl flex items-center gap-4"
            >
              <Plus className="w-4 h-4 text-lime-400" />
              Issue {activeTab === 'certificates' ? 'Certificate' : 'Offer Letter'}
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-10 mb-12 border-b border-gray-100">
          {[
            { id: 'certificates', label: 'INTERNSHIP CERTIFICATES', icon: Award },
            { id: 'offers', label: 'OFFER LETTERS', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              className={`pb-8 flex items-center gap-3 transition-all relative ${activeTab === tab.id ? 'text-black' : 'text-gray-300 hover:text-gray-400'}`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-lime-500" />
              )}
            </button>
          ))}
        </div>

        {/* Filter Matrix */}
        <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm mb-12 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-lime-500 transition-colors" />
            <input 
              type="text" 
              placeholder={`SEARCH ${activeTab.toUpperCase()} REGISTRY...`}
              className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 pl-14 pr-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* High-Density Matrix Table */}
        <div className="bg-white border border-gray-100 rounded-[3.5rem] shadow-2xl overflow-hidden">
          {loading && items.length === 0 ? (
            <div className="p-20 flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse text-gray-300">
              Accessing Vault Registry...
            </div>
          ) : (
            <>
              {activeTab === 'certificates' ? renderCertificateTable() : renderOfferTable()}
              {items.length === 0 && (
                <div className="p-20 text-center">
                  <AlertCircle className="w-16 h-16 text-gray-100 mx-auto mb-6" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Zero entries detected in this segment</p>
                </div>
              )}
            </>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-10 border-t border-gray-50 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Segment {currentPage} of {totalPages}</span>
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
          )}
        </div>
      </div>

      {/* Issue Modal */}
      <AnimatePresence>
        {showIssueModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIssueModal(false)}
              className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-12">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <span className="text-lime-500 font-black text-[10px] tracking-[0.3em] uppercase mb-4 block">REGISTRY SANCTION</span>
                    <h3 className="text-4xl font-black tracking-tighter uppercase">
                      Issue {activeTab === 'certificates' ? 'Certificate' : 'Offer Letter'}
                    </h3>
                  </div>
                  <button onClick={() => setShowIssueModal(false)} className="p-4 hover:bg-gray-50 rounded-2xl transition-colors text-gray-400">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleIssue} className="space-y-10">
                  {activeTab === 'certificates' ? (
                    <>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Recipient Identity</label>
                          <input 
                            required
                            type="text" 
                            placeholder="FULL LEGAL NAME"
                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-xs"
                            value={issueData.name}
                            onChange={(e) => setIssueData({...issueData, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Communication Node</label>
                          <input 
                            required
                            type="email" 
                            placeholder="EMAIL ADDRESS"
                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-xs"
                            value={issueData.email}
                            onChange={(e) => setIssueData({...issueData, email: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Academic Domain</label>
                          <input 
                            required
                            type="text" 
                            placeholder="E.G. SOFTWARE ENGINEERING"
                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-xs"
                            value={issueData.domain}
                            onChange={(e) => setIssueData({...issueData, domain: e.target.value})}
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Assigned Role</label>
                          <input 
                            required
                            type="text" 
                            placeholder="E.G. FULL STACK INTERN"
                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-xs"
                            value={issueData.jobrole}
                            onChange={(e) => setIssueData({...issueData, jobrole: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Activation Date</label>
                          <input 
                            required
                            type="date" 
                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-xs"
                            value={issueData.fromDate}
                            onChange={(e) => setIssueData({...issueData, fromDate: e.target.value})}
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Termination Date</label>
                          <input 
                            required
                            type="date" 
                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-xs"
                            value={issueData.toDate}
                            onChange={(e) => setIssueData({...issueData, toDate: e.target.value})}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Candidate Identity</label>
                          <input 
                            required
                            type="text" 
                            placeholder="FULL LEGAL NAME"
                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-8 outline-none focus:border-blue-500 transition-all font-bold uppercase tracking-widest text-xs"
                            value={issueData.candidateName}
                            onChange={(e) => setIssueData({...issueData, candidateName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Communication Node</label>
                          <input 
                            required
                            type="email" 
                            placeholder="EMAIL ADDRESS"
                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-8 outline-none focus:border-blue-500 transition-all font-bold uppercase tracking-widest text-xs"
                            value={issueData.email}
                            onChange={(e) => setIssueData({...issueData, email: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Target Position</label>
                          <input 
                            required
                            type="text" 
                            placeholder="E.G. SR. DEVELOPER"
                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-8 outline-none focus:border-blue-500 transition-all font-bold uppercase tracking-widest text-xs"
                            value={issueData.position}
                            onChange={(e) => setIssueData({...issueData, position: e.target.value})}
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Organizational Unit</label>
                          <input 
                            required
                            type="text" 
                            placeholder="E.G. TECHNOLOGY"
                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-8 outline-none focus:border-blue-500 transition-all font-bold uppercase tracking-widest text-xs"
                            value={issueData.department}
                            onChange={(e) => setIssueData({...issueData, department: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Offer Architecture</label>
                          <select 
                            required
                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-8 outline-none focus:border-blue-500 transition-all font-bold uppercase tracking-widest text-xs appearance-none"
                            value={issueData.offerType}
                            onChange={(e) => setIssueData({...issueData, offerType: e.target.value})}
                          >
                            <option value="Job">FULL-TIME CAREER</option>
                            <option value="Internship">INTERNSHIP CYCLE</option>
                          </select>
                        </div>
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Financial Matrix (ANNUAL CTC / STIPEND)</label>
                          <input 
                            required
                            type="text" 
                            placeholder="E.G. 1,200,000"
                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-8 outline-none focus:border-blue-500 transition-all font-bold uppercase tracking-widest text-xs"
                            value={issueData.salary}
                            onChange={(e) => setIssueData({...issueData, salary: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Activation Date</label>
                          <input 
                            required
                            type="date" 
                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-8 outline-none focus:border-blue-500 transition-all font-bold uppercase tracking-widest text-xs"
                            value={issueData.startDate}
                            onChange={(e) => setIssueData({...issueData, startDate: e.target.value})}
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Offer Expiration</label>
                          <input 
                            required
                            type="date" 
                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-8 outline-none focus:border-blue-500 transition-all font-bold uppercase tracking-widest text-xs"
                            value={issueData.validUntil}
                            onChange={(e) => setIssueData({...issueData, validUntil: e.target.value})}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex gap-4 pt-6">
                    <button 
                      type="button"
                      onClick={() => setShowIssueModal(false)}
                      className="flex-1 py-8 border-2 border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all"
                    >
                      Abort Protocol
                    </button>
                    <button 
                      type="submit"
                      disabled={isIssuing}
                      className={`flex-[2] py-8 ${activeTab === 'certificates' ? 'bg-lime-500' : 'bg-blue-600'} text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 hover:scale-[1.02] transition-all shadow-xl disabled:opacity-50`}
                    >
                      {activeTab === 'certificates' ? <Award className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      {isIssuing ? 'SYNCHRONIZING...' : `EXECUTE ${activeTab === 'certificates' ? 'CERTIFICATE' : 'OFFER'} SANCTION`}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
