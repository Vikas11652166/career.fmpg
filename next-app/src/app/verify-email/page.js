'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/api';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Email context missing');
    
    setLoading(true);
    try {
      await authService.verifyEmail({ otp, email });
      toast.success('Identity validated successfully');
      router.push('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-center">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-lime-500/10 blur-[80px] rounded-full" />
          
          <div className="relative z-10">
            <div className="mb-12">
              <div className="w-20 h-20 bg-lime-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <ShieldCheck className="w-10 h-10 text-lime-500" />
              </div>
              <span className="text-lime-500 font-black text-[10px] tracking-[0.3em] uppercase mb-4 block">IDENTITY VALIDATION</span>
              <h1 className="text-5xl font-black tracking-tighter uppercase leading-[0.85] mb-6">
                Verify <br />
                <span className="text-lime-500">Email</span>
              </h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                Check your inbox for the transmission code sent to <br />
                <span className="text-black">{email || 'your email'}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-8">
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-lime-500 transition-colors" />
                <input 
                  type="text" 
                  maxLength={6}
                  required
                  placeholder="6-DIGIT CODE" 
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-[0.5em] text-center text-lg"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <button 
                disabled={loading}
                className="w-full py-6 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 hover:scale-[1.02] transition-all shadow-xl shadow-gray-200"
              >
                {loading ? 'Validating...' : (
                  <>Authorize Identity <ArrowRight className="w-4 h-4 text-lime-400" /></>
                )}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-gray-50 flex flex-col gap-4">
               <button className="text-[10px] font-black uppercase tracking-widest text-lime-500 hover:text-lime-600 transition-colors">
                Resend Validation Code
               </button>
              <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
                Return to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
