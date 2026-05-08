'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export default function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#fcfcfc] py-32 px-6">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-lime-400/5 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, -50, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-400/5 blur-[150px] rounded-full" 
        />
      </div>

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-3 bg-white border border-gray-100 px-6 py-3 rounded-2xl shadow-xl shadow-gray-100/50 mb-10"
        >
          <Sparkles className="w-4 h-4 text-lime-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Join the Elite Ops Team</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[14vw] lg:text-[10vw] font-black tracking-tighter uppercase leading-[0.8] mb-12"
        >
          Build the <br />
          <span className="text-lime-500">Future.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto text-gray-400 text-lg lg:text-xl font-medium leading-relaxed mb-16 px-4"
        >
          FMPG is architecting the next generation of property management. Join our mission to redefine living through high-density innovation and operational excellence.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <button 
            onClick={() => router.push('/jobs')}
            className="px-12 py-6 bg-[#0a0a0a] text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-lime-400 hover:text-black hover:scale-105 transition-all shadow-2xl shadow-gray-200"
          >
            Explore Trajectories
          </button>
          <button 
            onClick={() => router.push('/login')}
            className="px-12 py-6 bg-white border border-gray-100 text-black rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] hover:border-lime-400 hover:scale-105 transition-all"
          >
            Access System
          </button>
        </motion.div>
      </div>
    </section>
  );
}
