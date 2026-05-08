'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldCheck, ShieldAlert, Save, X, Search, User as UserIcon, Lock, Unlock } from 'lucide-react';
import Link from 'next/link';

export default function ManageHRPage() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users?view=staff&search=${searchTerm}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStaff(data.users);
      } else {
        toast.error(data.message || 'Failed to fetch staff');
      }
    } catch (err) {
      toast.error('Synchronization failed');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'super-admin') {
      router.push('/dashboard');
      return;
    }
    fetchStaff();
  }, [fetchStaff, currentUser, router]);

  const handlePermissionToggle = (permission) => {
    setSelectedStaff(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission]
      }
    }));
  };

  const handleSavePermissions = async () => {
    try {
      setUpdating(true);
      const res = await fetch(`/api/admin/users/${selectedStaff._id}/permissions`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ permissions: selectedStaff.permissions })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Permissions updated');
        setSelectedStaff(null);
        fetchStaff();
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch (err) {
      toast.error('Network failure');
    } finally {
      setUpdating(false);
    }
  };

  const permissionList = [
    { key: 'canCreateJob', label: 'Job Creation', desc: 'Allow deploying new operational vacancies.' },
    { key: 'canViewApplicants', label: 'Candidate Oversight', desc: 'Access to application directory and candidate data.' },
    { key: 'canGenerateOfferLetter', label: 'Offer Generation', desc: 'Capability to synthesize and issue offer letters.' },
    { key: 'canGenerateCertificate', label: 'Credential Issuance', desc: 'Allow generating internship/experience certificates.' },
    { key: 'canManageEmployees', label: 'Resource Management', desc: 'Governance over active employee/intern records.' },
    { key: 'canAccessDashboard', label: 'Cockpit Access', desc: 'Access to high-level administrative dashboards.' }
  ];

  if (loading && staff.length === 0) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse">Scanning Authorization Matrix...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-500 transition-colors mb-8 block">
            ← Return to Cockpit
          </Link>
          <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">GOVERNANCE PROTOCOLS</span>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
            HR <br />
            <span className="text-lime-500">Permissions</span>
          </h1>
        </div>

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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-100 rounded-[3.5rem] shadow-2xl overflow-hidden h-fit">
            <div className="p-10 border-b border-gray-50">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Authorization Registry</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {staff.map((member) => (
                <div 
                  key={member._id}
                  onClick={() => setSelectedStaff(member)}
                  className={`p-8 flex items-center justify-between cursor-pointer transition-all ${selectedStaff?._id === member._id ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black ${member.role === 'super-admin' ? 'bg-lime-400 text-black' : 'bg-gray-100 text-gray-300'}`}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black uppercase tracking-widest text-xs mb-1">{member.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{member.role} / {member.department || 'GENERAL'}</p>
                    </div>
                  </div>
                  {member.role === 'super-admin' ? <ShieldCheck className="w-5 h-5 text-lime-500" /> : <Shield className="w-5 h-5 text-gray-200" />}
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedStaff ? (
              <motion.div 
                key={selectedStaff._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white border border-gray-100 rounded-[3.5rem] shadow-2xl p-12 space-y-10"
              >
                <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                  <div>
                    <span className="text-lime-500 font-black text-[10px] tracking-[0.3em] uppercase mb-2 block">Protocol Configuration</span>
                    <h3 className="text-3xl font-black uppercase tracking-tighter">{selectedStaff.name}</h3>
                  </div>
                  <button onClick={() => setSelectedStaff(null)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-6">
                  {permissionList.map((perm) => (
                    <div 
                      key={perm.key}
                      onClick={() => handlePermissionToggle(perm.key)}
                      className={`p-6 border-2 rounded-3xl cursor-pointer transition-all flex items-center justify-between group ${selectedStaff.permissions?.[perm.key] ? 'border-lime-400 bg-lime-50/20' : 'border-gray-50 hover:border-gray-200'}`}
                    >
                      <div className="flex gap-6 items-center">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${selectedStaff.permissions?.[perm.key] ? 'bg-lime-400 text-black' : 'bg-gray-50 text-gray-300'}`}>
                          {selectedStaff.permissions?.[perm.key] ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className={`font-black uppercase tracking-widest text-[10px] mb-1 ${selectedStaff.permissions?.[perm.key] ? 'text-black' : 'text-gray-400'}`}>{perm.label}</p>
                          <p className="text-[10px] font-bold text-gray-400 tracking-tight">{perm.desc}</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedStaff.permissions?.[perm.key] ? 'border-lime-500 bg-lime-500 text-white' : 'border-gray-100'}`}>
                        {selectedStaff.permissions?.[perm.key] && <Save className="w-3 h-3" />}
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleSavePermissions}
                  disabled={updating}
                  className="w-full py-8 bg-[#0a0a0a] text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-lime-400 hover:text-black transition-all shadow-2xl disabled:opacity-50"
                >
                  {updating ? 'SYNCHRONIZING PROTOCOLS...' : 'SAVE AUTHORIZATION STATE'}
                </button>
              </motion.div>
            ) : (
              <div className="bg-gray-50 border-4 border-dashed border-gray-100 rounded-[3.5rem] flex flex-col items-center justify-center p-20 text-center">
                <ShieldAlert className="w-16 h-16 text-gray-200 mb-8" />
                <h3 className="text-xl font-black uppercase tracking-widest text-gray-300">Select Protocol Actor</h3>
                <p className="text-sm font-bold text-gray-400 mt-4 uppercase tracking-widest">Select a staff member from the registry to calibrate their authorization matrix.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
