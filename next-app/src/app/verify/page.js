'use client';

import { useState, useEffect } from 'react';
import { certificateService } from '@/services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Calendar, 
  User, 
  Award,
  ArrowRight
} from 'lucide-react';
import { useParams } from 'next/navigation';

export default function VerifyCertificatePage() {
  const { id } = useParams();
  const [certificateId, setCertificateId] = useState(id || '');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState(null);

  useEffect(() => {
    if (id) {
      handleVerify(id);
    }
  }, [id]);

  const handleVerify = async (cid) => {
    const targetId = cid || certificateId;
    if (!targetId) return;

    setLoading(true);
    setCertificate(null);
    try {
      const res = await certificateService.verifyCertificate(targetId);
      setCertificate(res.data.certificate);
      toast.success('CERTIFICATE AUTHENTICATED');
    } catch (err) {
      toast.error('INVALID OR EXPIRED CREDENTIALS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <span className="text-lime-500 font-black text-xs tracking-[0.4em] uppercase mb-8 block">SECURITY PROTOCOL</span>
          <h1 className="text-6xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.8] mb-12">
            Verify <br />
            <span className="text-lime-500">Credential</span>
          </h1>
        </div>

        <div className="bg-white border border-gray-100 p-12 rounded-[4rem] shadow-2xl mb-12">
          <div className="flex gap-4">
            <input 
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              placeholder="ENTER CERTIFICATE ID (E.G. FMPG-2026-0001)"
              className="flex-1 bg-gray-50 border-2 border-transparent rounded-3xl py-6 px-10 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-xs"
            />
            <button 
              onClick={() => handleVerify()}
              disabled={loading}
              className="px-12 py-6 bg-black text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-lime-400 hover:text-black transition-all disabled:opacity-50"
            >
              {loading ? 'SYNCING...' : 'VALIDATE'}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {certificate && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-4 border-lime-400 p-16 rounded-[5rem] shadow-2xl relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-12">
                  <ShieldCheck className="w-20 h-20 text-lime-400 opacity-20" />
               </div>

               <div className="relative z-10 space-y-12">
                  <div className="flex items-center gap-6">
                     <div className="bg-lime-400 p-5 rounded-2xl">
                        <Award className="w-8 h-8 text-black" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-500 mb-2">AUTHENTICATED RECORD</p>
                        <h2 className="text-4xl font-black uppercase tracking-tight">{certificate.certificateId}</h2>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-y border-gray-100 py-12">
                     <div className="space-y-8">
                        <div>
                           <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">RECIPIENT</p>
                           <p className="text-xl font-black uppercase">{certificate.candidateName}</p>
                        </div>
                        <div>
                           <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">DOMAIN</p>
                           <p className="text-xl font-black uppercase">{certificate.domain}</p>
                        </div>
                     </div>
                     <div className="space-y-8">
                        <div>
                           <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">ISSUED ON</p>
                           <p className="text-xl font-black uppercase">{new Date(certificate.issuedAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                           <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">VALIDITY</p>
                           <p className="text-xl font-black uppercase">PERMANENT</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-between items-center">
                     <button className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-lime-500 hover:gap-6 transition-all">
                        <Download className="w-4 h-4" /> Download Official Copy
                     </button>
                     <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">FMPG TRUSTED SYSTEM SECURED</span>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
