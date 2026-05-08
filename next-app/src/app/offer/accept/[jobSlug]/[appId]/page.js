'use client';

import { useState, useEffect } from 'react';
import { contractService } from '@/services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Briefcase, 
  Calendar,
  IndianRupee,
  Building,
  User,
  CreditCard,
  FileText
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function OfferAcceptancePage() {
  const { appId } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState(null); // 'accept', 'reject'
  const [rejectionReason, setRejectionReason] = useState('');

  const [formData, setFormData] = useState({
    phone: '',
    personalInfo: {
      dateOfBirth: '',
      nationality: 'Indian',
      address: { street: '', city: '', state: '', zipCode: '', country: 'India' },
      emergencyContact: { name: '', relationship: '', phone: '', email: '' },
      identificationDocuments: { idType: 'Aadhar', idNumber: '' }
    },
    bankingInfo: {
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      accountType: 'Savings',
      branch: ''
    },
    agreementTerms: { termsAccepted: false, privacyPolicyAccepted: false }
  });

  useEffect(() => {
    fetchOffer();
  }, [appId]);

  const fetchOffer = async () => {
    try {
      const res = await contractService.getOfferForAcceptance(appId);
      setOffer(res.offerLetter);
      setFormData(prev => ({
        ...prev,
        bankingInfo: { ...prev.bankingInfo, accountHolderName: res.offerLetter.candidateName }
      }));
    } catch (err) {
      toast.error('OFFER RETRIEVAL FAILED');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!formData.agreementTerms.termsAccepted || !formData.agreementTerms.privacyPolicyAccepted) {
      toast.error('TERMS MUST BE AUTHENTICATED');
      return;
    }

    setSubmitting(true);
    try {
      await contractService.acceptOffer(appId, formData);
      toast.success('OFFER SECURED');
      router.push('/');
    } catch (err) {
      toast.error('TRANSMISSION FAILED');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.error('REJECTION LOG REQUIRED');
      return;
    }

    setSubmitting(true);
    try {
      await contractService.rejectOffer(appId, { rejectionReason });
      toast.success('OFFER DECLINED');
      router.push('/');
    } catch (err) {
      toast.error('DECLINE FAILED');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black text-xs tracking-[0.5em] animate-pulse">DECRYPTING OFFER DATA...</div>;
  if (!offer) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black text-xs tracking-[0.5em]">OFFER NOT FOUND</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-20">
          <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">ONBOARDING PROTOCOL</span>
          <h1 className="text-6xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.8]">
            Offer <br />
            <span className="text-lime-500 text-7xl lg:text-9xl">Terminal</span>
          </h1>
        </div>

        {/* Step Indicator */}
        <div className="flex gap-2 mb-12">
           {[1, 2, 3, 4].map(s => (
             <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-lime-400' : 'bg-gray-100'}`}></div>
           ))}
        </div>

        <div className="bg-white border border-gray-100 rounded-[4rem] shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
          <AnimatePresence mode="wait">
            {/* Step 1: Review */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-16 flex-1 flex flex-col"
              >
                <div className="flex items-center gap-6 mb-12">
                   <div className="bg-gray-50 p-4 rounded-2xl">
                      <Briefcase className="w-6 h-6 text-gray-300" />
                   </div>
                   <h2 className="text-3xl font-black uppercase tracking-tight">Review Payload</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                   <div className="space-y-8">
                      <div>
                         <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">DESIGNATION</p>
                         <p className="text-xl font-black uppercase">{offer.position}</p>
                      </div>
                      <div>
                         <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">COMPENSATION</p>
                         <p className="text-xl font-black uppercase">₹{offer.salary} {offer.payoutFrequency || '/ ANNUM'}</p>
                      </div>
                   </div>
                   <div className="space-y-8">
                      <div>
                         <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">START VECTOR</p>
                         <p className="text-xl font-black uppercase">{new Date(offer.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                         <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">WORK MODE</p>
                         <p className="text-xl font-black uppercase">{offer.workType}</p>
                      </div>
                   </div>
                </div>

                {decision === 'reject' ? (
                  <div className="space-y-6 mt-auto">
                     <textarea 
                       value={rejectionReason}
                       onChange={(e) => setRejectionReason(e.target.value)}
                       placeholder="SPECIFY REJECTION LOGICS..."
                       className="w-full bg-gray-50 border-2 border-red-100 rounded-3xl p-8 outline-none focus:border-red-400 font-bold uppercase text-[10px] tracking-widest resize-none"
                       rows="4"
                     />
                     <div className="flex gap-4">
                        <button onClick={() => setDecision(null)} className="flex-1 py-6 border border-gray-100 rounded-3xl font-black uppercase tracking-widest text-[10px]">Cancel</button>
                        <button onClick={handleReject} disabled={submitting} className="flex-1 py-6 bg-red-500 text-white rounded-3xl font-black uppercase tracking-widest text-[10px]">Confirm Rejection</button>
                     </div>
                  </div>
                ) : (
                  <div className="flex gap-4 mt-auto">
                    <button onClick={() => setDecision('reject')} className="flex-1 py-8 border-2 border-gray-100 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-red-50 transition-all">Decline</button>
                    <button onClick={() => setStep(2)} className="flex-[2] py-8 bg-lime-400 text-black rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-lime-400/20">Accept & Proceed</button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Personal */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-16 flex-1 flex flex-col"
              >
                <div className="flex items-center gap-6 mb-12">
                   <div className="bg-gray-50 p-4 rounded-2xl">
                      <User className="w-6 h-6 text-gray-300" />
                   </div>
                   <h2 className="text-3xl font-black uppercase tracking-tight">Personal Profile</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                   <div className="space-y-3">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">PHONE VECTOR</p>
                      <input 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                      />
                   </div>
                   <div className="space-y-3">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">CHRONO BIRTH</p>
                      <input 
                        type="date"
                        value={formData.personalInfo.dateOfBirth}
                        onChange={(e) => setFormData({...formData, personalInfo: {...formData.personalInfo, dateOfBirth: e.target.value}})}
                        className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                      />
                   </div>
                   <div className="md:col-span-2 space-y-3">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">PHYSICAL ADDRESS</p>
                      <input 
                        value={formData.personalInfo.address.street}
                        onChange={(e) => setFormData({...formData, personalInfo: {...formData.personalInfo, address: {...formData.personalInfo.address, street: e.target.value}}})}
                        placeholder="STREET / HOUSE NO"
                        className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                      />
                   </div>
                   <div className="space-y-3">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">CITY / STATE</p>
                      <div className="flex gap-4">
                        <input 
                          value={formData.personalInfo.address.city}
                          onChange={(e) => setFormData({...formData, personalInfo: {...formData.personalInfo, address: {...formData.personalInfo.address, city: e.target.value}}})}
                          className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                        />
                        <input 
                          value={formData.personalInfo.address.state}
                          onChange={(e) => setFormData({...formData, personalInfo: {...formData.personalInfo, address: {...formData.personalInfo.address, state: e.target.value}}})}
                          className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                        />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">IDENTIFICATION</p>
                      <div className="flex gap-4">
                        <select 
                          value={formData.personalInfo.identificationDocuments.idType}
                          onChange={(e) => setFormData({...formData, personalInfo: {...formData.personalInfo, identificationDocuments: {...formData.personalInfo.identificationDocuments, idType: e.target.value}}})}
                          className="bg-gray-50 border-2 border-transparent rounded-2xl px-4 outline-none focus:border-lime-500 font-bold uppercase text-[10px]"
                        >
                           <option>Aadhar</option>
                           <option>PAN</option>
                           <option>Passport</option>
                        </select>
                        <input 
                          value={formData.personalInfo.identificationDocuments.idNumber}
                          onChange={(e) => setFormData({...formData, personalInfo: {...formData.personalInfo, identificationDocuments: {...formData.personalInfo.identificationDocuments, idNumber: e.target.value}}})}
                          placeholder="ID NUMBER"
                          className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                        />
                      </div>
                   </div>
                </div>

                <div className="flex gap-4 mt-auto">
                  <button onClick={() => setStep(1)} className="flex-1 py-8 border-2 border-gray-100 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all">Back</button>
                  <button onClick={() => setStep(3)} className="flex-[2] py-8 bg-lime-400 text-black rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-lime-400/20">Banking Setup</button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Banking */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-16 flex-1 flex flex-col"
              >
                <div className="flex items-center gap-6 mb-12">
                   <div className="bg-gray-50 p-4 rounded-2xl">
                      <CreditCard className="w-6 h-6 text-gray-300" />
                   </div>
                   <h2 className="text-3xl font-black uppercase tracking-tight">Payout Configuration</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                   <div className="md:col-span-2 space-y-3">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">HOLDER IDENTITY</p>
                      <input 
                        value={formData.bankingInfo.accountHolderName}
                        onChange={(e) => setFormData({...formData, bankingInfo: {...formData.bankingInfo, accountHolderName: e.target.value}})}
                        className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                      />
                   </div>
                   <div className="space-y-3">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">ACCOUNT NUMBER</p>
                      <input 
                        value={formData.bankingInfo.accountNumber}
                        onChange={(e) => setFormData({...formData, bankingInfo: {...formData.bankingInfo, accountNumber: e.target.value}})}
                        className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                      />
                   </div>
                   <div className="space-y-3">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">BANKING FREQUENCY (IFSC)</p>
                      <input 
                        value={formData.bankingInfo.ifscCode}
                        onChange={(e) => setFormData({...formData, bankingInfo: {...formData.bankingInfo, ifscCode: e.target.value.toUpperCase()}})}
                        className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                      />
                   </div>
                   <div className="space-y-3">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">INSTITUTION</p>
                      <input 
                        value={formData.bankingInfo.bankName}
                        onChange={(e) => setFormData({...formData, bankingInfo: {...formData.bankingInfo, bankName: e.target.value}})}
                        className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                      />
                   </div>
                   <div className="space-y-3">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">BRANCH VECTOR</p>
                      <input 
                        value={formData.bankingInfo.branch}
                        onChange={(e) => setFormData({...formData, bankingInfo: {...formData.bankingInfo, branch: e.target.value}})}
                        className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                      />
                   </div>
                </div>

                <div className="flex gap-4 mt-auto">
                  <button onClick={() => setStep(2)} className="flex-1 py-8 border-2 border-gray-100 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all">Back</button>
                  <button onClick={() => setStep(4)} className="flex-[2] py-8 bg-lime-400 text-black rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-lime-400/20">Final Authentication</button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Authentication */}
            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-16 flex-1 flex flex-col"
              >
                <div className="flex items-center gap-6 mb-12">
                   <div className="bg-gray-50 p-4 rounded-2xl">
                      <ShieldCheck className="w-6 h-6 text-gray-300" />
                   </div>
                   <h2 className="text-3xl font-black uppercase tracking-tight">Final Authorization</h2>
                </div>

                <div className="space-y-8 mb-16">
                   <div className="p-8 bg-gray-50 rounded-3xl space-y-6">
                      <label className="flex items-start gap-6 cursor-pointer group">
                         <input 
                           type="checkbox"
                           checked={formData.agreementTerms.termsAccepted}
                           onChange={(e) => setFormData({...formData, agreementTerms: {...formData.agreementTerms, termsAccepted: e.target.checked}})}
                           className="mt-1 w-5 h-5 accent-lime-400"
                         />
                         <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">I authenticate that all provided data is true and I accept the terms of engagement with FMPG.</span>
                      </label>
                      <label className="flex items-start gap-6 cursor-pointer group">
                         <input 
                           type="checkbox"
                           checked={formData.agreementTerms.privacyPolicyAccepted}
                           onChange={(e) => setFormData({...formData, agreementTerms: {...formData.agreementTerms, privacyPolicyAccepted: e.target.checked}})}
                           className="mt-1 w-5 h-5 accent-lime-400"
                         />
                         <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">I authorize FMPG to process my identification and banking data for operational purposes.</span>
                      </label>
                   </div>
                </div>

                <div className="flex gap-4 mt-auto">
                  <button onClick={() => setStep(3)} className="flex-1 py-8 border-2 border-gray-100 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all">Back</button>
                  <button 
                    onClick={handleAccept} 
                    disabled={submitting} 
                    className="flex-[2] py-8 bg-lime-400 text-black rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-lime-400/20 disabled:opacity-50"
                  >
                    {submitting ? 'TRANSMITTING...' : 'AUTHENTICATE & SECURE OFFER'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
