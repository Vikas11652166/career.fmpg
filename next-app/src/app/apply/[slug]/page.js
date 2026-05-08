'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jobService, applicationService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import ReCAPTCHA from 'react-google-recaptcha';

export default function ApplyPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    experience: '',
    education: '',
    skills: '',
    coverLetter: '',
    resume: null,
    questionAnswers: {}
  });

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    const fetchJob = async () => {
      try {
        const res = await jobService.getJobById(slug);
        setJob(res.data);
        
        // Initialize questionAnswers with default structure
        const initialAnswers = {};
        (res.data.questions || []).forEach(q => {
          initialAnswers[q._id] = {
            questionId: q._id,
            questionText: q.questionText,
            questionType: q.questionType,
            answer: q.questionType === 'checkbox' ? [] : ''
          };
        });

        setFormData(prev => ({ 
          ...prev, 
          email: currentUser.email || '', 
          fullName: currentUser.name || '',
          questionAnswers: initialAnswers
        }));
      } catch (err) {
        toast.error('Job not found');
        router.push('/jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [slug, currentUser, router]);

  const handleQuestionChange = (questionId, answer, fileUrl = null) => {
    setFormData(prev => ({
      ...prev,
      questionAnswers: {
        ...prev.questionAnswers,
        [questionId]: {
          ...prev.questionAnswers[questionId],
          answer,
          fileUrl
        }
      }
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData(prev => ({ ...prev, resume: file }));
    
    // Auto-parse resume
    toast.info('Analyzing credentials...');
    try {
      const data = new FormData();
      data.append('resume', file);
      const res = await applicationService.parseResume(data);
      
      if (res.data) {
        setFormData(prev => ({
          ...prev,
          fullName: res.data.fullName || prev.fullName,
          email: res.data.email || prev.email,
          phone: res.data.phone || prev.phone,
          skills: res.data.skills || prev.skills,
          experience: res.data.experience || prev.experience,
          education: res.data.education || prev.education,
        }));
        toast.success('System synchronization complete');
      }
    } catch (err) {
      console.error('Parsing failed', err);
      toast.warn('Manual data entry required');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const maxSteps = job?.questions?.length > 0 ? 5 : 4;
    if (currentStep < maxSteps) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    if (currentStep === totalSteps && !recaptchaToken) {
      toast.error('Protocol requires human verification');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('jobId', job._id);
      data.append('recaptchaToken', recaptchaToken);
      
      Object.keys(formData).forEach(key => {
        if (key === 'resume' && formData[key]) {
          data.append('resume', formData[key]);
        } else if (key === 'questionAnswers') {
          const answersArray = Object.values(formData.questionAnswers);
          data.append('questionAnswers', JSON.stringify(answersArray));
        } else if (key !== 'resume') {
          data.append(key, formData[key]);
        }
      });

      await applicationService.createApplication(data);
      toast.success('Transmission Successful');
      router.push('/my-applications');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transmission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse">Synchronizing...</div>;

  const totalSteps = job?.questions?.length > 0 ? 5 : 4;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/jobs" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-500 mb-12 transition-colors">
          <ArrowLeft className="w-3 h-3 mr-2" /> Return to Terminal
        </Link>

        <div className="mb-20">
          <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">APPLICATION PHASE 0{currentStep} / 0{totalSteps}</span>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-[0.85] mb-6">
            Apply for <br />
            <span className="text-lime-500">{job?.title || 'Position'}</span>
          </h1>
        </div>

        <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-2xl">
          <form className="space-y-12" onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                   <div className="bg-gray-50/50 p-12 rounded-[3rem] border border-gray-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-lime-500 mb-6 block">MISSION PARAMETERS</span>
                      <h2 className="text-3xl font-black uppercase tracking-tight mb-8">{job?.title}</h2>
                      <div className="grid grid-cols-2 gap-8 mb-10">
                         <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">LOCATION</p>
                            <p className="text-sm font-bold uppercase">{job?.location || 'REMOTE'}</p>
                         </div>
                         <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">COMPENSATION</p>
                            <p className="text-sm font-bold uppercase">{job?.salary || 'COMMENSURATE'}</p>
                         </div>
                      </div>
                      <div className="prose prose-sm max-w-none text-gray-500 font-medium">
                         {job?.description}
                      </div>
                   </div>
                </motion.div>
              )}
              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                   <div className="relative group border-4 border-dashed border-gray-50 rounded-[3rem] p-16 text-center hover:border-lime-400 transition-all cursor-pointer">
                      <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <Upload className="w-12 h-12 mx-auto mb-6 text-gray-200 group-hover:text-lime-500 transition-colors" />
                      <p className="text-sm font-black uppercase tracking-widest text-gray-400">
                        {formData.resume ? formData.resume.name : 'Upload Credentials (PDF/DOCX)'}
                      </p>
                      <p className="text-[8px] font-bold text-lime-500 uppercase tracking-widest mt-4">AI SYNC ENABLED</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="FULL LEGAL NAME" className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]" />
                      <input name="email" value={formData.email} onChange={handleChange} placeholder="COMMUNICATION EMAIL" className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]" />
                      <input name="phone" value={formData.phone} onChange={handleChange} placeholder="CONTACT NUMBER" className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]" />
                   </div>
                </motion.div>
              )}
              {currentStep === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                   <textarea name="skills" value={formData.skills} onChange={handleChange} placeholder="TECHNICAL SKILLSET (COMMA SEPARATED)" className="w-full h-32 bg-gray-50 border-2 border-transparent rounded-[2rem] py-8 px-10 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] resize-none" />
                   <textarea name="experience" value={formData.experience} onChange={handleChange} placeholder="PROFESSIONAL CHRONOLOGY (YEARS)" className="w-full h-32 bg-gray-50 border-2 border-transparent rounded-[2rem] py-8 px-10 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] resize-none" />
                   <textarea name="education" value={formData.education} onChange={handleChange} placeholder="ACADEMIC BACKGROUND" className="w-full h-32 bg-gray-50 border-2 border-transparent rounded-[2rem] py-8 px-10 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] resize-none" />
                </motion.div>
              )}
              {currentStep === 4 && job?.questions?.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
                   {job.questions.map((q) => (
                      <div key={q._id} className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-lime-500 mb-6">Supplemental Requirement</p>
                        <h3 className="text-xl font-black uppercase tracking-tighter mb-8">{q.questionText}</h3>
                        <div className="space-y-4">
                          {q.questionType === 'text' && (
                            <textarea 
                              className="w-full h-32 bg-white border-2 border-gray-100 rounded-[1.5rem] py-6 px-8 outline-none focus:border-lime-500 transition-all font-bold text-sm"
                              value={formData.questionAnswers[q._id]?.answer || ''}
                              onChange={(e) => handleQuestionChange(q._id, e.target.value)}
                              placeholder="YOUR RESPONSE..."
                            />
                          )}
                          {q.questionType === 'multipleChoice' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {q.options.map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleQuestionChange(q._id, opt)}
                                  className={`py-4 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 transition-all ${formData.questionAnswers[q._id]?.answer === opt ? 'bg-lime-400 border-lime-400 text-black' : 'bg-white border-gray-100 text-gray-400'}`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                   ))}
                </motion.div>
              )}
              {((currentStep === 4 && !job?.questions?.length) || currentStep === 5) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                   <textarea name="coverLetter" value={formData.coverLetter} onChange={handleChange} placeholder="MISSION STATEMENT / COVER LETTER" className="w-full h-60 bg-gray-50 border-2 border-transparent rounded-[2rem] py-8 px-10 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] resize-none" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-4">
              {currentStep > 1 && (
                <button type="button" onClick={() => setCurrentStep(prev => prev - 1)} className="flex-1 py-6 border-2 border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all">Back</button>
              )}
              <button type="submit" className="flex-[2] py-6 bg-lime-400 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-all shadow-xl shadow-lime-400/20">
                {submitting ? 'Transmitting Data...' : currentStep === totalSteps ? 'Finalize Submission' : 'Continue Phase'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
