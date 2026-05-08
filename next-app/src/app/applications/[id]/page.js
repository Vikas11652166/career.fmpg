'use client';

import { useState, useEffect } from 'react';
import { applicationService, offerLetterService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ApplicationOfferForm from '@/components/applications/ApplicationOfferForm';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { currentUser, isAdmin, isHR } = useAuth();
  const router = useRouter();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerLetter, setOfferLetter] = useState(null);

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const res = await applicationService.getApplicationById(id);
      setApplication(res.data);
      
      if (res.data.offerLetterId) {
        try {
          const offerRes = await applicationService.getApplicationOfferLetter(id);
          setOfferLetter(offerRes.data);
        } catch (e) {
          console.error("Offer letter load failed", e);
        }
      }
    } catch (err) {
      toast.error('Failed to access candidate transmission');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOffer = async (offerData) => {
    setProcessing(true);
    try {
      await applicationService.generateOfferLetter(id, offerData);
      toast.success('OFFER GENERATED & TRANSMITTED');
      setShowOfferForm(false);
      loadApplication();
    } catch (err) {
      toast.error('OFFER GENERATION FAILED');
    } finally {
      setProcessing(false);
    }
  };

  const updateStatus = async (newStatus) => {
    if (newStatus === 'rejected') {
      setShowRejectModal(true);
      return;
    }

    if (newStatus === 'offered') {
      setShowOfferForm(true);
      return;
    }

    try {
      setProcessing(true);
      await applicationService.updateApplicationStatus(id, newStatus);
      toast.success(`Protocol state shifted to: ${newStatus.toUpperCase()}`);
      loadApplication();
    } catch (err) {
      toast.error('Failed to shift protocol state');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Protocol requires a rejection reason');
      return;
    }

    try {
      setProcessing(true);
      const res = await fetch(`/api/applications/${id}/reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ reason: rejectionReason })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Candidate termination protocol executed');
        setShowRejectModal(false);
        loadApplication();
      } else {
        toast.error(data.message || 'Termination failed');
      }
    } catch (err) {
      toast.error('Network failure during termination');
    } finally {
      setProcessing(false);
    }
  };

  const isStatusChangeAllowed = (targetStatus) => {
    const statusOrder = ['pending', 'reviewing', 'shortlisted', 'offered', 'hired'];
    const currentIndex = statusOrder.indexOf(application?.status);
    const targetIndex = statusOrder.indexOf(targetStatus);
    
    if (currentIndex >= 3) { // offered or hired
      return targetIndex > currentIndex || targetStatus === 'rejected';
    }
    return true;
  };

  if (loading) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse">Decrypting Transmission...</div>;
  if (!application) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs">Transmission Not Found</div>;

  const statusPhases = ['pending', 'reviewing', 'shortlisted', 'offered', 'hired', 'rejected'];
  const currentPhaseIndex = statusPhases.indexOf(application.status);

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
            <div className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-10 space-y-8">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Termination Protocol</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">State the technical or cultural grounds for candidate rejection. This will be transmitted via email.</p>
              <textarea 
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl p-6 outline-none focus:border-red-500 transition-all font-medium"
                rows="4"
                placeholder="REASON FOR REJECTION..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-5 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                  ABORT
                </button>
                <button 
                  onClick={handleReject}
                  disabled={processing}
                  className="flex-2 px-10 py-5 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
                >
                  EXECUTE TERMINATION
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Offer Form Modal */}
        <AnimatePresence>
          {showOfferForm && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowOfferForm(false)} />
              <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <ApplicationOfferForm 
                  application={application}
                  job={application.jobId}
                  onSubmit={handleGenerateOffer}
                  loading={processing}
                  onCancel={() => setShowOfferForm(false)}
                />
              </div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20">
          <div>
            <Link href="/admin/applications" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-500 transition-colors mb-8 block">
              ← Return to Directory
            </Link>
            <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">CANDIDATE INTELLIGENCE</span>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
              {application.fullName} <br />
              <span className="text-lime-500 text-4xl lg:text-6xl">{application.jobId?.title}</span>
            </h1>
          </div>
          
          <div className="flex gap-4">
            {application.resumeUrl && (
              <a 
                href={application.resumeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-10 py-6 bg-lime-400 text-black rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.05] transition-all shadow-xl shadow-lime-400/20"
              >
                Access Resume
              </a>
            )}
          </div>
        </div>

        {/* Phase Indicator */}
        <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-2xl mb-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {statusPhases.map((phase, i) => (
              <div key={phase} className="flex flex-col items-center gap-4 flex-1 relative">
                <div className={`w-4 h-4 rounded-full z-10 ${i <= currentPhaseIndex ? (phase === 'rejected' ? 'bg-red-500' : 'bg-lime-500') : 'bg-gray-100'}`} />
                <span className={`text-[9px] font-black uppercase tracking-widest ${i <= currentPhaseIndex ? 'text-black' : 'text-gray-300'}`}>{phase}</span>
                {i < statusPhases.length - 1 && phase !== 'rejected' && (
                  <div className="hidden md:block absolute top-2 left-1/2 w-full h-[2px] bg-gray-50 -z-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Intelligence */}
          <div className="lg:col-span-2 space-y-12">
            <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-2xl space-y-10">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b border-gray-50 pb-6">Candidate Parameters</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Email Identity</span>
                  <p className="font-bold text-lg">{application.email}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Communication Line</span>
                  <p className="font-bold text-lg">{application.phone || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Academic Background</span>
                  <p className="font-bold text-lg">{application.education || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Operational Experience</span>
                  <p className="font-bold text-lg">{application.experience || '0'} YEARS</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-2xl space-y-10">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b border-gray-50 pb-6">Transmission Content</h2>
              <div className="space-y-10">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-4">Cover Protocol</span>
                  <p className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">{application.coverLetter || 'NO COVER LETTER TRANSMITTED'}</p>
                </div>
                {application.skills && application.skills.length > 0 && (
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-4">Skill Matrix</span>
                    <div className="flex flex-wrap gap-3">
                      {application.skills.map(skill => (
                        <span key={skill} className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {application.questionAnswers && application.questionAnswers.length > 0 && (
              <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-2xl space-y-10">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b border-gray-50 pb-6">Supplemental Intelligence</h2>
                <div className="space-y-12">
                  {application.questionAnswers.map((qa, i) => (
                    <div key={i} className="space-y-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-lime-500 block">Question {i + 1}</span>
                      <p className="font-black uppercase tracking-tighter text-xl">{qa.questionText}</p>
                      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        {qa.questionType === 'file' && qa.fileUrl ? (
                          <a href={qa.fileUrl} target="_blank" rel="noopener noreferrer" className="text-lime-500 font-bold hover:underline">ACCESS ATTACHMENT →</a>
                        ) : (
                          <p className="font-bold text-gray-700 whitespace-pre-wrap">{qa.answer || 'NO RESPONSE'}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Cockpit */}
          <div className="space-y-12">
            {offerLetter && (
              <div className="bg-white border-2 border-lime-400 p-12 rounded-[3.5rem] shadow-2xl space-y-10">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-lime-500 border-b border-gray-50 pb-6">Offer Protocol</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Protocol Status</span>
                    <p className="font-black text-xl uppercase text-lime-500">{offerLetter.status}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Issued On</span>
                    <p className="font-bold text-lg">{new Date(offerLetter.issuedAt).toLocaleDateString()}</p>
                  </div>
                  {offerLetter.acceptedAt && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Accepted On</span>
                      <p className="font-bold text-lg">{new Date(offerLetter.acceptedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <button 
                      onClick={async () => {
                        try {
                          const res = await offerLetterService.downloadOfferLetter(offerLetter._id);
                          const url = window.URL.createObjectURL(res.data);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `offer-letter-${application.fullName.replace(/\s+/g, '_')}.pdf`;
                          link.click();
                        } catch (e) { toast.error("Download failed"); }
                      }}
                      className="text-lime-500 font-black uppercase tracking-widest text-[10px] hover:underline"
                    >
                      Download Transmitted Copy →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(isAdmin || isHR) && (
              <div className="bg-[#0a0a0a] text-white p-12 rounded-[3.5rem] shadow-2xl space-y-10">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-lime-400 border-b border-white/10 pb-6">Command Cockpit</h2>
                <div className="space-y-4">
                  {statusPhases.map((phase) => (
                    <button
                      key={phase}
                      onClick={() => updateStatus(phase)}
                      disabled={processing || application.status === phase || !isStatusChangeAllowed(phase)}
                      className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all border-2 
                        ${application.status === phase ? 'bg-lime-400 border-lime-400 text-black' : 
                          !isStatusChangeAllowed(phase) ? 'bg-transparent border-white/5 text-gray-600 cursor-not-allowed' :
                          'bg-transparent border-white/10 hover:border-lime-400 hover:text-lime-400'}`}
                    >
                      {application.status === phase ? `Current: ${phase}` : `Transition to ${phase}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-2xl space-y-8">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Position Context</h2>
              <div>
                <p className="font-black uppercase tracking-tighter text-2xl mb-2">{application.jobId?.title}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{application.jobId?.company} • {application.jobId?.department}</p>
              </div>
              <Link 
                href={`/jobs/${application.jobId?.slug || application.jobId?._id}`}
                className="text-lime-500 font-black uppercase tracking-widest text-[10px] hover:underline block"
              >
                View Position Specs →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
