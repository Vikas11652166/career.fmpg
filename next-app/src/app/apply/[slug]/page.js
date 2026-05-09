'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jobService, applicationService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Upload, 
  Check, 
  ShieldCheck, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Code, 
  User, 
  ChevronRight, 
  ChevronLeft,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

function ApplyPageContent() {
  const { slug } = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1 to 8
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
    coverLetterFile: null,
    isReferred: false,
    referrerEmployeeId: '',
    questionAnswers: {}
  });

  useEffect(() => {
    if (!currentUser) {
      router.push(`/login?redirect=/apply/${slug}`);
      return;
    }
    const fetchJob = async () => {
      try {
        const res = await jobService.getJobById(slug);
        setJob(res.data);
        
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData(prev => ({ ...prev, resume: file }));
    
    // Auto-parse resume
    setParsing(true);
    toast.info('AI Engine Initializing... Analyzing credentials');
    
    try {
      const data = new FormData();
      data.append('resume', file);
      const res = await applicationService.parseResume(data);
      
      if (res.data) {
        console.log('AI Extraction Payload:', res.data);
        if (res.data.error || res.data.parsingWarning) {
          toast.warn('AI Analysis limited. Manual verification required.');
        } else {
          toast.success('Synchronization successful. Profile mapped.');
        }

        setFormData(prev => ({
          ...prev,
          fullName: res.data.fullName || prev.fullName,
          email: res.data.email || prev.email,
          phone: res.data.phone || prev.phone,
          skills: res.data.skills || prev.skills,
          experience: res.data.experience || prev.experience,
          education: res.data.education || prev.education,
        }));
      }
    } catch (err) {
      console.error('Extraction failed', err);
      toast.warn('Automated mapping offline. Please fill manually.');
    } finally {
      setParsing(false);
    }
  };

  const handleCoverLetterChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData(prev => ({ ...prev, coverLetterFile: file }));
  };

  const validateStep = () => {
    switch(currentStep) {
      case 2: if (!formData.resume) { toast.error('Resume is mandatory'); return false; } break;
      case 3: if (!formData.skills) { toast.error('Please specify your skillset'); return false; } break;
      case 4: if (!formData.experience) { toast.error('Professional chronology required'); return false; } break;
      case 5: if (!formData.education) { toast.error('Academic history required'); return false; } break;
      case 8: if (!recaptchaToken) { toast.error('Human verification required'); return false; } break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) setCurrentStep(prev => Math.min(prev + 1, 8));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep < 8) {
      nextStep();
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
        } else if (key === 'coverLetterFile' && formData[key]) {
          data.append('coverLetterFile', formData[key]);
        } else if (key === 'questionAnswers') {
          const answersArray = Object.values(formData.questionAnswers);
          data.append('questionAnswers', JSON.stringify(answersArray));
        } else if (key !== 'resume' && key !== 'coverLetterFile') {
          data.append(key, formData[key]);
        }
      });

      await applicationService.createApplication(data);
      toast.success('Application logged. Welcome to FMPG.');
      router.push('/my-applications');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failure');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse">Initializing Terminal...</div>;

  const steps = [
    { id: 1, title: 'Mission Parameters', icon: ShieldCheck },
    { id: 2, title: 'Resume Transmission', icon: Upload },
    { id: 3, title: 'Skill Matrix', icon: Code },
    { id: 4, title: 'Professional History', icon: Briefcase },
    { id: 5, title: 'Academic History', icon: GraduationCap },
    { id: 6, title: 'Cover Letter', icon: FileText },
    { id: 7, title: 'Final Validation', icon: CheckCircle2 },
    { id: 8, title: 'Human Protocol', icon: ShieldCheck }
  ];

  const progress = (currentStep / 8) * 100;

  return (
    <div className="min-h-screen bg-[#fcfcfc] pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <Link href="/jobs" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-500 transition-all">
            <ArrowLeft className="w-3 h-3" /> System Exit
          </Link>
          <div className="flex gap-1">
            {steps.map(s => (
              <div key={s.id} className={`w-8 h-1 rounded-full ${currentStep >= s.id ? 'bg-lime-500' : 'bg-gray-100'} transition-all`} />
            ))}
          </div>
        </div>

        <div className="mb-16">
          <span className="text-lime-500 font-black text-[10px] tracking-[0.4em] uppercase mb-4 block">STEP 0{currentStep} — {steps[currentStep-1].title}</span>
          <h1 className="text-6xl font-black tracking-tighter uppercase leading-[0.8] mb-4">
            {job?.title}
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{job?.company} / {job?.location}</p>
        </div>

        {/* Wizard Card */}
        <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden min-h-[500px]">
          {parsing && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-[60] flex flex-col items-center justify-center">
              <div className="w-20 h-20 border-4 border-lime-100 border-t-lime-500 rounded-full animate-spin mb-8" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Analyzing Data Stream...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Step 1: Job Details */}
                  {currentStep === 1 && (
                    <div className="space-y-8">
                      <div className="bg-gray-50/50 p-10 rounded-[2.5rem] border border-gray-50">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-lime-500 mb-6">POSITION OVERVIEW</h3>
                        <div className="prose prose-sm max-w-none text-gray-500 font-medium leading-relaxed">
                          {job?.description}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="p-8 bg-gray-50/50 rounded-[2rem] border border-gray-50 text-center">
                           <p className="text-[8px] font-black text-gray-300 uppercase mb-2">TYPE</p>
                           <p className="font-bold text-xs uppercase">{job?.type || 'FULL-TIME'}</p>
                        </div>
                        <div className="p-8 bg-gray-50/50 rounded-[2rem] border border-gray-50 text-center">
                           <p className="text-[8px] font-black text-gray-300 uppercase mb-2">SALARY</p>
                           <p className="font-bold text-xs uppercase">{job?.salary || 'COMPETITIVE'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Resume & Personal */}
                  {currentStep === 2 && (
                    <div className="space-y-10">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-lime-50 rounded-[2.5rem] scale-[1.02] opacity-0 group-hover:opacity-100 transition-all blur-xl" />
                        <label className="relative block border-4 border-dashed border-gray-100 rounded-[2.5rem] p-16 text-center cursor-pointer bg-white hover:border-lime-400 transition-all">
                          <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                          <Upload className="w-12 h-12 mx-auto mb-6 text-gray-200 group-hover:text-lime-500 transition-colors" />
                          <p className="text-sm font-black uppercase tracking-widest mb-2">
                            {formData.resume ? formData.resume.name : 'Transmit Resume'}
                          </p>
                          <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">PDF, DOC, DOCX up to 10MB</p>
                        </label>
                      </div>

                      <div className="space-y-4">
                        <div className="relative">
                          <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                          <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="FULL LEGAL NAME" className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-14 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input name="email" value={formData.email} onChange={handleChange} placeholder="EMAIL NODE" className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]" />
                          <input name="phone" value={formData.phone} onChange={handleChange} placeholder="CONTACT PROTOCOL" className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Skills */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Code className="w-5 h-5 text-lime-500" />
                        <h3 className="text-xl font-black uppercase tracking-tight">Technical Skill Matrix</h3>
                      </div>
                      <textarea 
                        name="skills" 
                        value={formData.skills} 
                        onChange={handleChange} 
                        placeholder="E.G. NEXT.JS, TAILWIND, NODE, MONGODB..." 
                        className="w-full h-64 bg-gray-50 border-2 border-transparent rounded-[2.5rem] py-10 px-10 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-xs resize-none leading-relaxed" 
                      />
                    </div>
                  )}

                  {/* Step 4: Experience */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Briefcase className="w-5 h-5 text-lime-500" />
                        <h3 className="text-xl font-black uppercase tracking-tight">Professional Chronology</h3>
                      </div>
                      <textarea 
                        name="experience" 
                        value={formData.experience} 
                        onChange={handleChange} 
                        placeholder="DETAIL YOUR PREVIOUS ROLES AND ACCOMPLISHMENTS..." 
                        className="w-full h-80 bg-gray-50 border-2 border-transparent rounded-[2.5rem] py-10 px-10 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-xs resize-none leading-relaxed" 
                      />
                    </div>
                  )}

                  {/* Step 5: Education */}
                  {currentStep === 5 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <GraduationCap className="w-5 h-5 text-lime-500" />
                        <h3 className="text-xl font-black uppercase tracking-tight">Academic Background</h3>
                      </div>
                      <textarea 
                        name="education" 
                        value={formData.education} 
                        onChange={handleChange} 
                        placeholder="SPECIFY DEGREES, INSTITUTIONS, AND TIMELINES..." 
                        className="w-full h-80 bg-gray-50 border-2 border-transparent rounded-[2.5rem] py-10 px-10 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-xs resize-none leading-relaxed" 
                      />
                    </div>
                  )}

                  {/* Step 6: Cover Letter */}
                  {currentStep === 6 && (
                    <div className="space-y-10">
                      <div className="flex items-center gap-3 mb-4">
                        <FileText className="w-5 h-5 text-lime-500" />
                        <h3 className="text-xl font-black uppercase tracking-tight">Mission Statement</h3>
                      </div>
                      
                      <label className="block border-2 border-gray-50 rounded-[2rem] p-10 text-center cursor-pointer bg-gray-50/30 hover:bg-white hover:border-lime-400 transition-all group">
                        <input type="file" className="hidden" onChange={handleCoverLetterChange} accept=".pdf,.doc,.docx" />
                        <FileText className="w-8 h-8 mx-auto mb-4 text-gray-200 group-hover:text-lime-500 transition-colors" />
                        <p className="text-[10px] font-black uppercase tracking-widest">
                          {formData.coverLetterFile ? formData.coverLetterFile.name : 'Upload Cover Letter Document'}
                        </p>
                      </label>

                      <textarea 
                        name="coverLetter" 
                        value={formData.coverLetter} 
                        onChange={handleChange} 
                        placeholder="OR TYPE YOUR STATEMENT HERE..." 
                        className="w-full h-48 bg-gray-50 border-2 border-transparent rounded-[2rem] py-8 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] resize-none" 
                      />
                    </div>
                  )}

                  {/* Step 7: Summary Review */}
                  {currentStep === 7 && (
                    <div className="space-y-8">
                       <div className="grid grid-cols-2 gap-6">
                          <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-50">
                             <p className="text-[8px] font-black text-gray-300 uppercase mb-2">IDENTIFICATION</p>
                             <p className="font-bold text-[10px] uppercase">{formData.fullName || 'NOT SPECIFIED'}</p>
                          </div>
                          <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-50">
                             <p className="text-[8px] font-black text-gray-300 uppercase mb-2">COMMUNICATION</p>
                             <p className="font-bold text-[10px] uppercase truncate">{formData.email || 'NOT SPECIFIED'}</p>
                          </div>
                       </div>
                       <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-50">
                          <p className="text-[8px] font-black text-gray-300 uppercase mb-4">SKILLSET SUMMARY</p>
                          <p className="text-[10px] font-bold uppercase leading-relaxed text-gray-500 line-clamp-4">
                            {formData.skills || 'No skills logged.'}
                          </p>
                       </div>
                       <div className="bg-lime-50/50 p-8 rounded-[2rem] border border-lime-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <FileText className="w-6 h-6 text-lime-500" />
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-tight">RESUME ATTACHED</p>
                               <p className="text-[8px] font-bold text-lime-600 uppercase">{formData.resume?.name}</p>
                            </div>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-lime-500" />
                       </div>
                    </div>
                  )}

                  {/* Step 8: Human Protocol */}
                  {currentStep === 8 && (
                    <div className="text-center py-10 space-y-12">
                       <div className="w-24 h-24 bg-lime-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                          <ShieldCheck className="w-10 h-10 text-lime-500" />
                       </div>
                       <div>
                          <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Human Verification</h3>
                          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                            Acknowledge the FMPG recruitment protocol to authorize final transmission.
                          </p>
                       </div>

                       <button 
                        type="button"
                        onClick={() => setRecaptchaToken(recaptchaToken ? null : 'verified-manually')}
                        className={`w-full py-8 rounded-[2rem] border-2 transition-all flex items-center justify-center gap-4 ${recaptchaToken ? 'bg-lime-500 border-lime-500 text-black shadow-2xl shadow-lime-500/30' : 'bg-white border-gray-100 text-gray-300 hover:border-gray-200'}`}
                       >
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${recaptchaToken ? 'bg-black border-black' : 'bg-white border-gray-200'}`}>
                            {recaptchaToken && <Check className="w-4 h-4 text-lime-500" />}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">I AM A HUMAN ACTOR</span>
                       </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-4 mt-12 pt-10 border-t border-gray-50">
              {currentStep > 1 && (
                <button 
                  type="button" 
                  onClick={prevStep}
                  className="px-10 py-6 border-2 border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-gray-50 transition-all flex items-center gap-3"
                >
                  <ChevronLeft className="w-3 h-3" /> Previous
                </button>
              )}
              <button 
                type={currentStep === 8 ? 'submit' : 'button'}
                onClick={currentStep < 8 ? nextStep : undefined}
                disabled={submitting}
                className={`flex-1 py-6 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-lime-500 hover:text-black transition-all flex items-center justify-center gap-3 shadow-xl ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {submitting ? 'Transmitting...' : (
                  <>
                    {currentStep === 8 ? 'Finalize Submission' : 'Continue Phase'}
                    {currentStep < 8 && <ChevronRight className="w-3 h-3" />}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse">Initializing Interface...</div>}>
      <ApplyPageContent />
    </Suspense>
  );
}
