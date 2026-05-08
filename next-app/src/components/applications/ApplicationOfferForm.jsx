'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ApplicationOfferForm({ application, job, onSubmit, loading, onCancel }) {
  const [formData, setFormData] = useState({
    position: job?.title || '',
    department: job?.department || 'General',
    salary: job?.salary || '',
    startDate: '',
    joiningLocation: job?.location || '',
    workType: 'On-site',
    benefits: '',
    reportingManager: '',
    hrContactName: job?.hrContact?.name || 'HR Team',
    hrContactEmail: job?.hrContact?.email || '',
    hrContactPhone: job?.hrContact?.phone || '',
    validUntil: '',
    additionalNotes: ''
  });

  useEffect(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 30);
    const validUntil = new Date(startDate);
    validUntil.setDate(startDate.getDate() - 14);
    
    setFormData(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      validUntil: validUntil.toISOString().split('T')[0]
    }));
  }, [job]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const processedData = {
      ...formData,
      benefits: formData.benefits ? formData.benefits.split(',').map(b => b.trim()).filter(b => b) : []
    };
    onSubmit(processedData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-2 border-lime-400 p-12 rounded-[3.5rem] shadow-2xl space-y-10"
    >
      <div className="flex justify-between items-center mb-10">
        <div>
          <span className="text-lime-500 font-black text-[10px] tracking-[0.3em] uppercase block mb-2">GENERATION UNIT</span>
          <h3 className="text-3xl font-black uppercase tracking-tight">Offer Parameters</h3>
        </div>
        <button onClick={onCancel} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors">Aborted</button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Position Vector</label>
            <input name="position" value={formData.position} onChange={handleChange} className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 outline-none focus:border-lime-500 font-bold uppercase text-[10px]" />
          </div>
          <div className="space-y-2">
            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Department</label>
            <input name="department" value={formData.department} onChange={handleChange} className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 outline-none focus:border-lime-500 font-bold uppercase text-[10px]" />
          </div>
          <div className="space-y-2">
            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Compensation (₹)</label>
            <input name="salary" value={formData.salary} onChange={handleChange} className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 outline-none focus:border-lime-500 font-bold uppercase text-[10px]" />
          </div>
          <div className="space-y-2">
            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Activation Date</label>
            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 outline-none focus:border-lime-500 font-bold uppercase text-[10px]" />
          </div>
          <div className="space-y-2">
            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Location</label>
            <input name="joiningLocation" value={formData.joiningLocation} onChange={handleChange} className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 outline-none focus:border-lime-500 font-bold uppercase text-[10px]" />
          </div>
          <div className="space-y-2">
            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Operational Mode</label>
            <select name="workType" value={formData.workType} onChange={handleChange} className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 outline-none focus:border-lime-500 font-bold uppercase text-[10px]">
              <option>On-site</option>
              <option>Remote</option>
              <option>Hybrid</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Protocol Benefits (Comma Separated)</label>
          <input name="benefits" value={formData.benefits} onChange={handleChange} className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 outline-none focus:border-lime-500 font-bold uppercase text-[10px]" />
        </div>

        <div className="flex gap-4 pt-6">
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-lime-400 hover:text-black transition-all shadow-xl shadow-black/10 disabled:opacity-50"
          >
            {loading ? 'GENERATING...' : 'AUTHORIZE & GENERATE OFFER'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
