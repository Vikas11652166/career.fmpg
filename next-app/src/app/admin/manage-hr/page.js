'use client';

import { useState, useEffect } from 'react';
import { hrService, userService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Users, Lock, Check, X, 
  Briefcase, FileText, Search, History, 
  UserPlus, ChevronRight, Info, Activity,
  Globe, Zap, Filter
} from 'lucide-react';

export default function ManageHRPage() {
  const { isSuperAdmin } = useAuth();
  const [hrs, setHrs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHR, setSelectedHR] = useState(null);
  
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [configForm, setConfigForm] = useState({
    permissions: {
      canGenerateCertificate: false,
      canGenerateOfferLetter: false,
      canCreateJob: false,
      canViewApplicants: false,
      canManageReviews: false,
      canManageEmployees: false,
      canManageRecommendations: false,
      canAccessDashboard: false
    },
    assignedJobs: []
  });

  useEffect(() => {
    if (isSuperAdmin) {
      fetchInitialData();
    }
  }, [isSuperAdmin]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [hrsRes, logsRes, jobsRes] = await Promise.all([
        hrService.getAllHRs(),
        hrService.getAuditLogs(),
        hrService.getAvailableJobs()
      ]);
      setHrs(hrsRes.data.data);
      setAuditLogs(logsRes.data.data);
      setAvailableJobs(jobsRes.data.data);
    } catch (error) {
      toast.error('Protocol failure: Could not retrieve HR governance data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchUserQuery.trim()) return;
    setSearching(true);
    try {
      const res = await userService.getAllUsers({ search: searchUserQuery });
      const filtered = res.data.users.filter(u => u.department !== 'HR');
      setSearchResults(filtered);
    } catch (error) {
      toast.error('Search aborted: Infrastructure timeout');
    } finally {
      setSearching(false);
    }
  };

  const handleOpenConfig = (hr) => {
    setSelectedHR(hr);
    setConfigForm({
      permissions: {
        canGenerateCertificate: hr.permissions?.canGenerateCertificate || false,
        canGenerateOfferLetter: hr.permissions?.canGenerateOfferLetter || false,
        canCreateJob: hr.permissions?.canCreateJob || false,
        canViewApplicants: hr.permissions?.canViewApplicants || false,
        canManageReviews: hr.permissions?.canManageReviews || false,
        canManageEmployees: hr.permissions?.canManageEmployees || false,
        canManageRecommendations: hr.permissions?.canManageRecommendations || false,
        canAccessDashboard: hr.permissions?.canAccessDashboard || false
      },
      assignedJobs: hr.assignedJobs?.map(j => (typeof j === 'object' ? j._id : j)) || []
    });
    setShowConfigModal(true);
  };

  const handleTogglePermission = (name) => {
    setConfigForm(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [name]: !prev.permissions[name] }
    }));
  };

  const handleToggleJob = (jobId) => {
    setConfigForm(prev => {
      const isAssigned = prev.assignedJobs.includes(jobId);
      return {
        ...prev,
        assignedJobs: isAssigned 
          ? prev.assignedJobs.filter(id => id !== jobId)
          : [...prev.assignedJobs, jobId]
      };
    });
  };

  const handlePromoteToHR = async (user) => {
    try {
      await hrService.createHR({ userId: user._id });
      toast.success(`${user.name} elevated to HR department status`);
      setShowAddModal(false);
      setSearchUserQuery('');
      setSearchResults([]);
      fetchInitialData();
    } catch (error) {
      toast.error('Promotion failed: Security constraint violation');
    }
  };

  const handleRevokeHR = async (hrId, name) => {
    if (!confirm(`Revoke HR clearance for ${name}? Access will be immediately terminated.`)) return;
    try {
      await hrService.revokeHR(hrId);
      toast.success(`HR clearance revoked for ${name}`);
      fetchInitialData();
    } catch (error) {
      toast.error('Revocation failed: System integrity protected');
    }
  };

  const handleSaveConfig = async () => {
    try {
      await hrService.updateHRPermissions(selectedHR._id, configForm);
      toast.success('Governance parameters updated successfully');
      setShowConfigModal(false);
      fetchInitialData();
    } catch (error) {
      toast.error('Update failed: Transmission corrupted');
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-[10px]">
        Access Denied: SuperAdmin Authority Required
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20">
          <div>
            <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">GOVERNANCE COMMAND</span>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
              HR <br />
              <span className="text-lime-500">Authority</span>
            </h1>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-12 py-6 bg-[#0a0a0a] text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-lime-400 hover:text-black transition-all shadow-2xl flex items-center gap-4"
          >
            <UserPlus className="w-5 h-5" /> Elevate Staff Member
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-12">
           {['list', 'logs'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${
                 activeTab === tab ? 'bg-white border border-gray-100 shadow-lg text-lime-500' : 'text-gray-400 hover:text-black'
               }`}
             >
               {tab === 'list' ? 'STAFF DIRECTORY' : 'AUDIT PROTOCOLS'}
             </button>
           ))}
        </div>

        {loading ? (
          <div className="p-40 flex flex-col items-center gap-6">
             <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
             <span className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-400">Synchronizing Data...</span>
          </div>
        ) : activeTab === 'list' ? (
          <div className="grid grid-cols-1 gap-6">
             {hrs.length === 0 ? (
               <div className="bg-white border border-gray-100 rounded-[3rem] p-20 text-center shadow-xl">
                  <Users className="w-16 h-16 mx-auto mb-6 text-gray-100" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No HR Personnel Detected in Registry</p>
               </div>
             ) : (
               hrs.map((hr) => (
                 <motion.div 
                   key={hr._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                   className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-xl group hover:shadow-2xl transition-all"
                 >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                       <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center font-black text-2xl group-hover:bg-lime-400 transition-colors">
                             {hr.name?.charAt(0)}
                          </div>
                          <div>
                             <h3 className="text-xl font-black uppercase tracking-tight">{hr.name}</h3>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{hr.email}</p>
                          </div>
                       </div>

                       <div className="flex-1 flex flex-wrap gap-2">
                          {[
                            { id: 'canGenerateCertificate', icon: FileText, label: 'CERT' },
                            { id: 'canGenerateOfferLetter', icon: Briefcase, label: 'OFFER' },
                            { id: 'canCreateJob', icon: Zap, label: 'JOBS' },
                            { id: 'canViewApplicants', icon: Users, label: 'APPS' },
                            { id: 'canManageReviews', icon: Check, label: 'REV' },
                            { id: 'canManageEmployees', icon: Globe, label: 'EMP' },
                            { id: 'canAccessDashboard', icon: Activity, label: 'DASH' }
                          ].map(p => (
                            <div key={p.id} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${
                              hr.permissions?.[p.id] ? 'bg-lime-50 border-lime-100 text-lime-600' : 'bg-gray-50 border-transparent text-gray-300'
                            }`}>
                               <p.icon className="w-3 h-3" /> {p.label}
                            </div>
                          ))}
                       </div>

                       <div className="flex items-center gap-6">
                          <div className="text-right">
                             <div className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">JOB AUTHORITY</div>
                             <div className="font-black text-lime-500">{hr.assignedJobs?.length || 0} ASSIGNED</div>
                          </div>
                          <button 
                            onClick={() => handleOpenConfig(hr)}
                            className="px-8 py-4 bg-gray-50 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#0a0a0a] hover:text-white transition-all"
                          >
                             Configure
                          </button>
                          <button 
                            onClick={() => handleRevokeHR(hr._id, hr.name)}
                            className="px-8 py-4 bg-red-50 text-red-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all"
                          >
                             Revoke
                          </button>
                       </div>
                    </div>
                 </motion.div>
               ))
             )}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-[3rem] shadow-2xl overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100 text-left">
                         <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Timestamp</th>
                         <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Originator</th>
                         <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Target</th>
                         <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Operation</th>
                         <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Delta</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {auditLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-gray-50/30 transition-colors group">
                           <td className="px-10 py-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(log.createdAt).toLocaleString()}</td>
                           <td className="px-10 py-8">
                              <div className="font-black uppercase tracking-tight text-xs">{log.actor?.name || 'SYSTEM'}</div>
                              <div className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">{log.actor?.email || 'AUTOMATED'}</div>
                           </td>
                           <td className="px-10 py-8">
                              <div className="font-black uppercase tracking-tight text-xs">{log.resourceId?.name || 'N/A'}</div>
                           </td>
                           <td className="px-10 py-8">
                              <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest ${
                                log.action === 'ASSIGN' ? 'bg-blue-100 text-blue-600' : 
                                log.action === 'REVOKE' ? 'bg-red-100 text-red-600' : 
                                'bg-amber-100 text-amber-600'
                              }`}>
                                {log.action}
                              </span>
                           </td>
                           <td className="px-10 py-8">
                              <button onClick={() => alert(JSON.stringify(log.changes, null, 2))} className="text-[8px] font-black text-lime-500 underline uppercase tracking-widest">View Changes</button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* Promote Modal */}
        <AnimatePresence>
           {showAddModal && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl flex items-center justify-center p-6">
                <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white border border-gray-100 w-full max-w-xl rounded-[3.5rem] shadow-2xl p-12">
                   <div className="flex items-center justify-between mb-12">
                      <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Elevate <br /> Operator</h2>
                      <button onClick={() => setShowAddModal(false)} className="p-4 bg-gray-50 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all">
                        <X className="w-6 h-6" />
                      </button>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="relative group">
                         <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-lime-500 transition-colors" />
                         <input
                           type="text"
                           placeholder="SEARCH BY NAME OR EMAIL..."
                           className="w-full bg-gray-50 border-2 border-transparent rounded-[2rem] py-8 pl-20 pr-8 outline-none focus:border-lime-500 transition-all font-black uppercase tracking-widest text-[10px]"
                           value={searchUserQuery}
                           onChange={(e) => setSearchUserQuery(e.target.value)}
                           onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                         />
                      </div>
                      
                      <button
                        onClick={handleSearchUsers}
                        disabled={searching}
                        className="w-full py-6 bg-[#0a0a0a] text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-lime-400 hover:text-black transition-all shadow-xl shadow-black/10"
                      >
                        {searching ? 'QUERYING DATABASE...' : 'INITIATE SEARCH'}
                      </button>

                      <div className="max-h-60 overflow-y-auto space-y-4 pr-2">
                        {searchResults.map(user => (
                          <div key={user._id} className="flex items-center justify-between p-6 bg-gray-50/50 rounded-[2rem] border border-transparent hover:border-lime-400 transition-all group">
                            <div>
                               <div className="font-black uppercase tracking-tight text-xs">{user.name}</div>
                               <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{user.email}</div>
                            </div>
                            <button
                              onClick={() => handlePromoteToHR(user)}
                              className="px-6 py-3 bg-white border border-gray-100 rounded-xl font-black text-[8px] uppercase tracking-widest hover:bg-lime-400 transition-all"
                            >
                              Elevate
                            </button>
                          </div>
                        ))}
                      </div>
                   </div>
                </motion.div>
             </motion.div>
           )}
        </AnimatePresence>

        {/* Configuration Modal */}
        <AnimatePresence>
           {showConfigModal && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl flex items-center justify-center p-6">
                <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white border border-gray-100 w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[4rem] shadow-2xl flex flex-col">
                   <div className="p-12 border-b border-gray-50 flex justify-between items-center">
                      <div>
                         <span className="text-lime-500 font-black text-[10px] tracking-widest uppercase mb-2 block">GOVERNANCE CONFIGURATION</span>
                         <h2 className="text-4xl font-black tracking-tighter uppercase">{selectedHR?.name}</h2>
                      </div>
                      <button onClick={() => setShowConfigModal(false)} className="p-4 bg-gray-50 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all">
                        <X className="w-6 h-6" />
                      </button>
                   </div>

                   <div className="flex-1 overflow-y-auto p-12">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                         <div>
                            <div className="flex items-center gap-4 mb-10">
                               <div className="p-3 bg-amber-50 rounded-xl">
                                  <Lock className="w-5 h-5 text-amber-500" />
                               </div>
                               <h3 className="text-2xl font-black uppercase tracking-tight">Granular Permissions</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                               {[
                                 { id: 'canGenerateCertificate', label: 'CERTIFICATE GENERATION', desc: 'Authorizes issuance and signing of credentials.' },
                                 { id: 'canGenerateOfferLetter', label: 'OFFER LETTER GENERATION', desc: 'Authorizes expansion of professional contracts.' },
                                 { id: 'canCreateJob', label: 'OPERATIONAL JOB CREATION', desc: 'Authorizes management of job postings.' },
                                 { id: 'canViewApplicants', label: 'APPLICANT DEEP INSIGHTS', desc: 'Authorizes viewing of full candidate dossiers.' },
                                 { id: 'canManageReviews', label: 'FEEDBACK MODERATION', desc: 'Authorizes review oversight and moderation.' },
                                 { id: 'canManageEmployees', label: 'STAFF REGISTRY TRACKING', desc: 'Authorizes full access to employee monitoring.' },
                                 { id: 'canManageRecommendations', label: 'REFERRAL PROTOCOL OVERSIGHT', desc: 'Authorizes management of candidate referrals.' },
                                 { id: 'canAccessDashboard', label: 'SYSTEM TELEMETRY DASHBOARD', desc: 'Authorizes access to organizational analytics.' }
                               ].map(perm => (
                                 <div 
                                   key={perm.id} 
                                   onClick={() => handleTogglePermission(perm.id)}
                                   className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${
                                     configForm.permissions[perm.id] ? 'bg-lime-50 border-lime-400' : 'bg-gray-50 border-transparent hover:border-gray-100'
                                   }`}
                                 >
                                    <div className="flex justify-between items-center mb-2">
                                       <span className="font-black uppercase tracking-tight text-[10px]">{perm.label}</span>
                                       <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-colors ${
                                         configForm.permissions[perm.id] ? 'bg-lime-500 border-lime-500 text-black' : 'border-gray-200'
                                       }`}>
                                          {configForm.permissions[perm.id] && <Check className="w-4 h-4" />}
                                       </div>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{perm.desc}</p>
                                 </div>
                               ))}
                            </div>
                         </div>

                         <div>
                            <div className="flex items-center gap-4 mb-10">
                               <div className="p-3 bg-blue-50 rounded-xl">
                                  <Briefcase className="w-5 h-5 text-blue-500" />
                               </div>
                               <h3 className="text-2xl font-black uppercase tracking-tight">Mission Authority</h3>
                            </div>
                            <div className="bg-gray-50 rounded-[3rem] p-4 max-h-[600px] overflow-y-auto">
                               {availableJobs.map(job => (
                                 <div 
                                   key={job._id}
                                   onClick={() => handleToggleJob(job._id)}
                                   className={`p-6 m-2 rounded-[2rem] flex items-center justify-between cursor-pointer transition-all ${
                                     configForm.assignedJobs.includes(job._id) ? 'bg-white shadow-xl' : 'hover:bg-white/50'
                                   }`}
                                 >
                                    <div>
                                       <p className="font-black uppercase tracking-tight text-xs">{job.title}</p>
                                       <p className="text-[8px] text-gray-400 uppercase font-bold tracking-[0.2em]">{job.company} • {job.location}</p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-lg border-2 transition-colors ${
                                      configForm.assignedJobs.includes(job._id) ? 'bg-blue-500 border-blue-500 flex items-center justify-center text-white' : 'border-gray-200'
                                    }`}>
                                       {configForm.assignedJobs.includes(job._id) && <Check className="w-4 h-4" />}
                                    </div>
                                 </div>
                               ))}
                            </div>
                            <div className="mt-8 p-8 bg-gray-50 rounded-[2rem] flex items-start gap-6 border border-gray-100">
                               <Info className="w-6 h-6 text-gray-300 flex-shrink-0" />
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                                  Operator will only be authorized to view transmissions and generate intelligence for the specific missions checked above. Null selection results in zero data accessibility.
                               </p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="p-12 border-t border-gray-50 bg-gray-50/50 flex justify-end gap-6">
                      <button onClick={() => setShowConfigModal(false)} className="px-10 py-6 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:text-black">Abort</button>
                      <button onClick={handleSaveConfig} className="px-12 py-6 bg-lime-400 text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:scale-[1.02] transition-all shadow-xl shadow-lime-400/20">Authorize Changes</button>
                   </div>
                </motion.div>
             </motion.div>
           )}
        </AnimatePresence>
      </div>
    </div>
  );
}
