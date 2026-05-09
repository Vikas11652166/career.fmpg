'use client';

import { useState } from 'react';
import { contactService } from '@/services/api';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, ArrowUpRight } from 'lucide-react';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await contactService.submitContactForm(formData);
      toast.success("TRANSMISSION SUCCESSFUL");
      setFormData({ name: '', email: '', phone: '', company: '', message: '' });
    } catch (err) {
      toast.error('TRANSMISSION FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-20">
          <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">COMMUNICATIONS HUB</span>
          <h1 className="text-6xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.8] mb-8">
            Contact <br />
            <span className="text-lime-500">Terminal</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Info Side */}
          <div className="lg:col-span-5 space-y-12">
            <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-2xl space-y-12">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-500 mb-6">PHYSICAL VECTOR</p>
                <div className="flex gap-6">
                  <MapPin className="w-5 h-5 text-gray-300" />
                  <p className="text-sm font-bold uppercase tracking-tight leading-relaxed">
                    #51, BHAKRA ROAD, NANGAL,<br />PUNJAB-140124
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-500 mb-6">DIGITAL LINK</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <Mail className="w-5 h-5 text-gray-300" />
                    <p className="text-sm font-bold uppercase tracking-tight">fmpg974@gmail.com</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <Phone className="w-5 h-5 text-gray-300" />
                    <p className="text-sm font-bold uppercase tracking-tight">+91 73218-35093</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-500 mb-6">SOCIAL FREQUENCIES</p>
                <div className="flex gap-4">
                  <button className="bg-gray-50 p-4 rounded-2xl hover:bg-lime-400 transition-all group">
                    <FaInstagram className="w-5 h-5 text-gray-300 group-hover:text-black" />
                  </button>
                  <button className="bg-gray-50 p-4 rounded-2xl hover:bg-lime-400 transition-all group">
                    <FaFacebook className="w-5 h-5 text-gray-300 group-hover:text-black" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-12">
               <p className="text-2xl font-black uppercase tracking-tighter leading-tight text-gray-300">
                 SHARE YOUR CREATIVE IDEAS WITH US, AND RECEIVE DESIGNS THAT CAPTIVATE.
               </p>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="bg-white border border-gray-100 p-16 rounded-[4rem] shadow-2xl space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">IDENTIFIER</p>
                   <input
                     name="name"
                     value={formData.name}
                     onChange={handleChange}
                     placeholder="FULL NAME"
                     className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                     required
                   />
                </div>
                <div className="space-y-3">
                   <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">EMAIL VECTOR</p>
                   <input
                     type="email"
                     name="email"
                     value={formData.email}
                     onChange={handleChange}
                     placeholder="YOUR.EMAIL@ACCESS.COM"
                     className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                     required
                   />
                </div>
                <div className="space-y-3">
                   <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">CONTACT FREQUENCY</p>
                   <input
                     name="phone"
                     value={formData.phone}
                     onChange={handleChange}
                     placeholder="PHONE / SKYPE"
                     className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                   />
                </div>
                <div className="space-y-3">
                   <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">ORGANIZATION</p>
                   <input
                     name="company"
                     value={formData.company}
                     onChange={handleChange}
                     placeholder="COMPANY NAME"
                     className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                   />
                </div>
              </div>

              <div className="space-y-3">
                 <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">TRANSMISSION CONTENT</p>
                 <textarea
                   name="message"
                   value={formData.message}
                   onChange={handleChange}
                   placeholder="HOW CAN WE ASSIST YOUR MISSION?"
                   rows="6"
                   className="w-full bg-gray-50 border-2 border-transparent rounded-[2.5rem] py-8 px-10 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px] resize-none"
                   required
                 />
              </div>

              <div className="pt-8 flex justify-end">
                <button
                  disabled={loading}
                  className="w-32 h-32 bg-lime-400 text-black rounded-full font-black uppercase tracking-widest text-[10px] flex items-center justify-center hover:scale-110 transition-all shadow-2xl shadow-lime-400/20 disabled:opacity-50"
                >
                  {loading ? 'SYNCING...' : <span className="flex flex-col items-center">SEND <ArrowUpRight className="w-4 h-4 mt-1" /></span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
