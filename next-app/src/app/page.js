'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { reviewService } from '@/services/api';
import HeroSection from '@/components/hero/HeroSection';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, 
  CheckCircle, 
  Zap, 
  Shield, 
  Heart, 
  Users, 
  Briefcase,
  Star,
  Quote
} from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await reviewService.getApprovedReviews({ limit: 10 });
        setReviews(res.data.reviews || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  return (
    <div className="bg-[#fcfcfc] text-[#0a0a0a] overflow-hidden min-h-screen">
      <HeroSection />

      {/* Welcome Section */}
      <section className="relative py-32 bg-[#fcfcfc]">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-24">
            <motion.div 
              className="w-full lg:w-1/2"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-lime-500 font-black text-[10px] tracking-[0.4em] uppercase mb-8 block">ESTABLISHED EXCELLENCE</span>
              <h2 className="text-6xl lg:text-8xl font-black mb-12 leading-[0.85] tracking-tighter uppercase">
                Welcome to <br />
                <span className="text-lime-500 text-7xl lg:text-9xl">FMPG</span>
              </h2>
              <div className="space-y-10 text-gray-500 text-xl leading-relaxed font-medium">
                <p>FMPG is your premier choice for hassle-free and comfortable living! We pride ourselves on creating a home away from home, offering a perfect blend of convenience, security, and community.</p>
                <p>We help students, working professionals, and travelers find the perfect living space that matches their needs. We believe in creating environments where comfort meets convenience and every stay feels like home.</p>
                <p>We cherish creativity, innovation, and passion amongst our team members to deliver exceptional living experiences.</p>
              </div>
            </motion.div>
            <motion.div 
              className="w-full lg:w-1/2"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
               <div className="relative aspect-square">
                  <div className="absolute inset-0 bg-lime-400 rounded-[5rem] rotate-3 opacity-10"></div>
                  <div className="relative h-full w-full rounded-[4rem] overflow-hidden shadow-2xl border-4 border-white">
                    <img src="/images/welcome.jpg" alt="Welcome" className="w-full h-full object-cover" />
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Work From Home */}
      <section className="py-32 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-24">
            <motion.div 
              className="w-full lg:w-1/2"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
               <h2 className="text-5xl lg:text-7xl font-black mb-12 leading-[0.9] tracking-tighter uppercase">
                 Work from <br />
                 <span className="text-lime-500">Anywhere</span>
               </h2>
               <p className="text-gray-500 text-lg font-medium mb-12 leading-relaxed">
                 Start your journey with FMPG. We believe that professional excellence can be achieved through dedication and a supportive work environment. Let your talent shine from the comfort of your chosen space.
               </p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    "Flexible working hours",
                    "Remote-first culture",
                    "Digital collaboration",
                    "Work-life balance"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <CheckCircle className="w-5 h-5 text-lime-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{item}</span>
                    </div>
                  ))}
               </div>
            </motion.div>
            <motion.div 
              className="w-full lg:w-1/2"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
               <div className="rounded-[4rem] overflow-hidden shadow-2xl border-4 border-white aspect-video relative">
                  <img src="/images/s_image_text.svg" alt="Work from home" className="w-full h-full object-cover" />
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-40 bg-[#fcfcfc]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <span className="text-lime-500 font-black text-[10px] tracking-[0.4em] uppercase mb-8 block">OPERATIONAL PROTOCOL</span>
            <h2 className="text-6xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.8] mb-12">
               How It <span className="text-lime-500">Works</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: "Find Jobs", desc: "Browse listings matched to your unique skill profile.", icon: Zap },
              { title: "Easy Apply", desc: "Submit with precision through our streamlined portal.", icon: Shield },
              { title: "Track Progress", desc: "Real-time synchronization of your application status.", icon: Users }
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="bg-white p-16 rounded-[4rem] border border-gray-100 shadow-2xl hover:border-lime-400 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 text-8xl font-black text-gray-50 group-hover:text-lime-50 transition-colors">0{i+1}</div>
                  <div className="bg-gray-50 w-20 h-20 rounded-3xl flex items-center justify-center mb-10 group-hover:bg-lime-400 transition-all">
                    <Icon className="w-8 h-8 text-gray-300 group-hover:text-black" />
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tight mb-6 relative z-10">{step.title}</h3>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] leading-relaxed relative z-10">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Policies */}
      <section className="py-32 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-24">
            <motion.div className="w-full lg:w-1/2">
               <h2 className="text-6xl lg:text-8xl font-black mb-12 tracking-tighter uppercase">Governance <br /> <span className="text-lime-500">& Policies</span></h2>
               <p className="text-xl font-medium text-gray-500 mb-12 leading-relaxed">
                  We have a direct and well-encompassing company policy that establishes the right expectations for our workforce and provides guidance on handling workplace situations.
               </p>
               <Link href="https://fmpg.in" className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-lime-500 hover:gap-6 transition-all">
                  Visit FMPG Infrastructure <ArrowUpRight className="w-4 h-4" />
               </Link>
            </motion.div>
            <motion.div className="w-full lg:w-1/2">
               <div className="rounded-[4rem] overflow-hidden shadow-2xl border-4 border-white aspect-square">
                  <img src="/images/policies.jpg" alt="Policies" className="w-full h-full object-cover" />
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Perks and Benefits */}
      <section className="py-40 bg-[#fcfcfc]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-32">
             <h2 className="text-6xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.8] mb-12">
                Perks & <br /> <span className="text-lime-500">Benefits</span>
             </h2>
             <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Exceptional Reward Ecosystem</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Global Workspace", desc: "Work from our flexible office spaces throughout the globe", icon: Briefcase },
              { title: "Supportive Culture", desc: "Nurturing creativity and versatility in a supportive environment", icon: Heart },
              { title: "Team Events", desc: "Team volunteering opportunities and local community events", icon: Users },
              { title: "Growth Benefits", desc: "Get hardware, software, and guidance you need to excel", icon: Zap },
              { title: "Flat Structure", desc: "Profitable company with a flat organizational structure", icon: Shield },
              { title: "Learn & Excel", desc: "Partner with us to learn, grow, and excel in your career", icon: Star }
            ].map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <div key={i} className="p-12 rounded-[3.5rem] bg-white border border-gray-50 shadow-xl hover:scale-[1.02] transition-all group">
                   <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-10 group-hover:bg-lime-400 transition-colors">
                      <Icon className="w-6 h-6 text-gray-300 group-hover:text-black" />
                   </div>
                   <h3 className="text-xl font-black uppercase tracking-tight mb-4">{benefit.title}</h3>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">{benefit.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {reviews.length > 0 && (
        <section className="py-40 bg-white border-y border-gray-100 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
             <div className="flex items-end justify-between mb-24">
                <h2 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter">Voice of <br /> <span className="text-lime-500">The Team</span></h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 hidden lg:block">Verifiable Testimonials</span>
             </div>
             
             <div className="flex gap-12 overflow-x-auto pb-12 snap-x no-scrollbar">
                {reviews.map((review, i) => (
                  <div key={i} className="min-w-[400px] snap-center bg-gray-50 p-16 rounded-[4rem] border border-gray-100 flex flex-col justify-between">
                     <div>
                        <Quote className="w-12 h-12 text-lime-400 mb-10 opacity-20" />
                        <p className="text-2xl font-black uppercase tracking-tighter mb-12 leading-tight">"{review.content}"</p>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-lime-400 rounded-2xl flex items-center justify-center font-black text-2xl uppercase">
                           {review.userName.charAt(0)}
                        </div>
                        <div>
                           <h4 className="text-sm font-black uppercase tracking-widest">{review.userName}</h4>
                           <p className="text-[8px] font-black uppercase tracking-[0.2em] text-lime-500 mt-2">{review.position || 'Professional'}</p>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-40 bg-[#fcfcfc]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-6xl lg:text-9xl font-black tracking-tighter uppercase mb-16 leading-[0.85]">
            Join the <br />
            <span className="text-lime-500">Movement</span>
          </h2>
          <Link 
            href="/jobs" 
            className="inline-flex items-center gap-6 px-20 py-8 bg-lime-400 text-black rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs hover:scale-110 transition-all shadow-2xl shadow-lime-400/30"
          >
            Apply Now <ArrowUpRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
