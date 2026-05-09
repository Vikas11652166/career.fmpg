'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { reviewService } from '@/services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Send, ShieldCheck, Info, XCircle, 
  ThumbsUp, ThumbsDown, MessageSquare, Briefcase, 
  Clock, MapPin, ChevronRight, ChevronLeft
} from 'lucide-react';

export default function SubmitReviewPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    content: '',
    pros: '',
    cons: '',
    advice: '',
    department: '',
    position: '',
    workType: 'On-site',
    employmentDuration: '',
    isAnonymous: false
  });
  const [hoveredRating, setHoveredRating] = useState(0);

  if (!currentUser) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.rating === 0) {
      toast.error('Validation failure: Rating intensity required');
      return;
    }

    try {
      setLoading(true);
      await reviewService.submitReview({
        ...formData,
        userEmail: currentUser.email,
        userName: currentUser.name,
        reviewerType: currentUser.role === 'employee' ? 'employee' : 'offer_recipient'
      });
      toast.success('Intelligence transmission successful: Pending moderation');
      router.push('/');
    } catch (error) {
      toast.error('Transmission failure: Protocol rejected review entry');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-16">
          <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">OPERATIONAL FEEDBACK PROTOCOL</span>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
            Corporate <br />
            <span className="text-lime-500">Intelligence</span>
          </h1>
          <div className="flex items-center gap-8 mt-10">
             {[1, 2, 3].map(i => (
               <div key={i} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${step >= i ? 'bg-[#0a0a0a] text-white' : 'bg-gray-100 text-gray-300'}`}>
                    0{i}
                  </div>
                  <div className={`text-[10px] font-black uppercase tracking-widest hidden md:block ${step >= i ? 'text-black' : 'text-gray-300'}`}>
                    {i === 1 ? 'Core Metrics' : i === 2 ? 'Experience Data' : 'Contextual Metadata'}
                  </div>
                  {i < 3 && <div className="w-12 h-[2px] bg-gray-100" />}
               </div>
             ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 p-12 lg:p-16 rounded-[4rem] shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-10 block text-center">RATING INTENSITY</label>
                  <div className="flex justify-center gap-4 lg:gap-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star} type="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setFormData(f => ({ ...f, rating: star }))}
                        className="transition-transform hover:scale-125"
                      >
                        <Star className={`w-12 h-12 lg:w-16 lg:h-16 transition-all ${
                          (hoveredRating || formData.rating) >= star ? 'text-lime-400 fill-lime-400 drop-shadow-[0_0_15px_rgba(163,230,53,0.4)]' : 'text-gray-100'
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 block">TRANSMISSION TITLE</label>
                    <input 
                      type="text" name="title" value={formData.title} onChange={handleChange}
                      placeholder="SUMMARIZE YOUR EXPERIENCE IN ONE LINE..."
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-10 outline-none focus:border-lime-500 transition-all font-black uppercase tracking-widest text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 block">CORE STATEMENT</label>
                    <textarea 
                      name="content" value={formData.content} onChange={handleChange}
                      placeholder="DETAILED OPERATIONAL FEEDBACK..."
                      className="w-full h-40 bg-gray-50 border-2 border-transparent rounded-[2rem] py-8 px-10 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] resize-none"
                      required
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <ThumbsUp className="w-4 h-4 text-lime-500" />
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">OPERATIONAL PROS</label>
                      </div>
                      <textarea 
                        name="pros" value={formData.pros} onChange={handleChange}
                        placeholder="WHAT ARE THE SYSTEM ADVANTAGES?"
                        className="w-full h-32 bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] resize-none"
                      />
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <ThumbsDown className="w-4 h-4 text-red-500" />
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">OPERATIONAL CONS</label>
                      </div>
                      <textarea 
                        name="cons" value={formData.cons} onChange={handleChange}
                        placeholder="IDENTIFY SYSTEM FRICTION POINTS..."
                        className="w-full h-32 bg-gray-50 border-2 border-transparent rounded-2xl py-6 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] resize-none"
                      />
                   </div>
                </div>
                <div>
                   <div className="flex items-center gap-3 mb-4">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">ADVICE TO GOVERNANCE</label>
                   </div>
                   <textarea 
                     name="advice" value={formData.advice} onChange={handleChange}
                     placeholder="DIRECT FEEDBACK TO MANAGEMENT..."
                     className="w-full h-32 bg-gray-50 border-2 border-transparent rounded-3xl py-8 px-10 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] resize-none"
                   />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 block">DEPARTMENT / DOMAIN</label>
                      <input 
                        type="text" name="department" value={formData.department} onChange={handleChange}
                        className="w-full bg-gray-50 border-2 border-transparent rounded-xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-black uppercase tracking-widest text-[10px]"
                        placeholder="E.G. DEVELOPMENT, HR, MARKETING"
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 block">ACTIVE POSITION</label>
                      <input 
                        type="text" name="position" value={formData.position} onChange={handleChange}
                        className="w-full bg-gray-50 border-2 border-transparent rounded-xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-black uppercase tracking-widest text-[10px]"
                        placeholder="E.G. SENIOR ENGINEER"
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 block">WORK CONFIGURATION</label>
                      <select 
                        name="workType" value={formData.workType} onChange={handleChange}
                        className="w-full bg-gray-50 border-2 border-transparent rounded-xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-black uppercase tracking-widest text-[10px]"
                      >
                         <option value="On-site">ON-SITE OPERATIONS</option>
                         <option value="Remote">REMOTE TRANSMISSION</option>
                         <option value="Hybrid">HYBRID PROTOCOL</option>
                      </select>
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 block">EMPLOYMENT DURATION</label>
                      <input 
                        type="text" name="employmentDuration" value={formData.employmentDuration} onChange={handleChange}
                        className="w-full bg-gray-50 border-2 border-transparent rounded-xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-black uppercase tracking-widest text-[10px]"
                        placeholder="E.G. 2 YEARS, 6 MONTHS"
                      />
                   </div>
                </div>

                <div className="bg-gray-50 p-10 rounded-[2.5rem] flex items-center justify-between border-2 border-transparent hover:border-lime-100 transition-all">
                   <div className="flex gap-6 items-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${formData.isAnonymous ? 'bg-lime-400 text-black' : 'bg-white text-gray-200'}`}>
                         <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest mb-1">STEALTH TRANSMISSION</p>
                         <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">SUBMIT WITHOUT REVEALING SYSTEM IDENTITY</p>
                      </div>
                   </div>
                   <input 
                     type="checkbox" name="isAnonymous" checked={formData.isAnonymous} onChange={handleChange}
                     className="w-8 h-8 rounded-xl border-2 border-gray-200 text-lime-500 focus:ring-lime-500"
                   />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Bar */}
          <div className="flex gap-4 mt-16 pt-12 border-t border-gray-50">
            {step > 1 && (
              <button 
                type="button" onClick={prevStep}
                className="px-10 py-6 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-4 hover:bg-gray-100 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> PREV
              </button>
            )}
            
            {step < 3 ? (
              <button 
                type="button" onClick={nextStep}
                disabled={step === 1 && (!formData.rating || !formData.title || !formData.content)}
                className="flex-1 py-6 bg-[#0a0a0a] text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-4 hover:bg-lime-400 hover:text-black transition-all shadow-xl disabled:opacity-30"
              >
                CONTINUE <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                type="submit" disabled={loading}
                className="flex-1 py-6 bg-[#0a0a0a] text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-4 hover:bg-lime-400 hover:text-black transition-all shadow-xl shadow-lime-400/10"
              >
                {loading ? 'TRANSMITTING...' : 'EXECUTE SUBMISSION'} <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
