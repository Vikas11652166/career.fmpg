'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/api';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ShieldCheck, Lock, ArrowRight, ArrowLeft, RefreshCcw } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword({ email: formData.email });
      toast.success('Verification code transmitted');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transmission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('Credential mismatch');
    }
    setLoading(true);
    try {
      await authService.resetPassword({
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });
      toast.success('Security protocols updated');
      router.push('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset sequence failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
          {/* Decorative Gradient */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-lime-500/10 blur-[80px] rounded-full" />
          
          <div className="relative z-10">
            <div className="mb-12">
              <span className="text-lime-500 font-black text-[10px] tracking-[0.3em] uppercase mb-4 block">RECOVERY PROTOCOL</span>
              <h1 className="text-5xl font-black tracking-tighter uppercase leading-[0.85] mb-6">
                System <br />
                <span className="text-lime-500">Access</span>
              </h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                {step === 1 ? 'Initiate credential recovery sequence' : 'Enter transmission code and new credentials'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSendOTP} 
                  className="space-y-8"
                >
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-lime-500 transition-colors" />
                    <input 
                      type="email" 
                      name="email"
                      required
                      placeholder="IDENTIFIER EMAIL" 
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 pl-14 pr-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <button 
                    disabled={loading}
                    className="w-full py-6 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 hover:scale-[1.02] transition-all shadow-xl shadow-gray-200"
                  >
                    {loading ? 'Transmitting...' : (
                      <>Transmit Reset Code <ArrowRight className="w-4 h-4 text-lime-400" /></>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.form 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleResetPassword} 
                  className="space-y-6"
                >
                  <div className="relative group">
                    <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-lime-500 transition-colors" />
                    <input 
                      type="text" 
                      name="otp"
                      required
                      maxLength={6}
                      placeholder="TRANSMISSION CODE" 
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 pl-14 pr-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] text-center"
                      value={formData.otp}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-lime-500 transition-colors" />
                    <input 
                      type="password" 
                      name="newPassword"
                      required
                      placeholder="NEW CREDENTIAL" 
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 pl-14 pr-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                      value={formData.newPassword}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="relative group">
                    <RefreshCcw className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-lime-500 transition-colors" />
                    <input 
                      type="password" 
                      name="confirmPassword"
                      required
                      placeholder="CONFIRM CREDENTIAL" 
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 pl-14 pr-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>

                  <button 
                    disabled={loading}
                    className="w-full py-6 bg-lime-400 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 hover:scale-[1.02] transition-all shadow-xl shadow-lime-200"
                  >
                    {loading ? 'Verifying...' : 'Finalize Recovery'}
                  </button>

                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-3 h-3" /> Re-enter Email
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-12 pt-8 border-t border-gray-50 text-center">
              <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-500 transition-colors">
                Return to Login Matrix
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
