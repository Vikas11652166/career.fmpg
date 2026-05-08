'use client';

import { useState } from 'react';
import { jobService } from '@/services/api';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function CreateJobPage() {
  const [formData, setFormData] = useState({
    title: '',
    company: 'OM Softwares',
    location: '',
    description: '',
    requirements: '',
    responsibilities: '',
    salary: '',
    type: 'Full-time',
    department: '',
    position: '',
    hrContact: {
      name: '',
      email: '',
      phone: ''
    },
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        requirements: formData.requirements.split('\n').filter(r => r.trim()),
        responsibilities: formData.responsibilities.split('\n').filter(r => r.trim())
      };
      const res = await jobService.createJob(payload);
      toast.success('Job position deployed successfully');
      router.push(`/admin/jobs/edit/${res.data.job._id}`);
    } catch (err) {
      toast.error('Deployment failed: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-20">
          <Link href="/admin/jobs" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-500 transition-colors mb-8 block">
            ← Return to Registry
          </Link>
          <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">DEPLOYMENT PROTOCOL</span>
          <h1 className="text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-[0.85]">
            New <br />
            <span className="text-lime-500">Position</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Core Identification */}
          <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-2xl space-y-10">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b border-gray-50 pb-6">Core Identification</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="relative group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-white px-2 z-10 transition-colors group-focus-within:text-lime-500">Position Title</label>
                <input
                  type="text"
                  name="title"
                  className="w-full px-8 py-5 bg-transparent border-2 border-gray-100 rounded-3xl outline-none focus:border-lime-500 transition-all font-bold text-gray-800"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="E.G. SENIOR SYSTEMS ARCHITECT"
                />
              </div>

              <div className="relative group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-white px-2 z-10">Department</label>
                <input
                  type="text"
                  name="department"
                  className="w-full px-8 py-5 bg-transparent border-2 border-gray-100 rounded-3xl outline-none focus:border-lime-500 transition-all font-bold text-gray-800"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  placeholder="E.G. ENGINEERING"
                />
              </div>

              <div className="relative group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-white px-2 z-10">Location</label>
                <input
                  type="text"
                  name="location"
                  className="w-full px-8 py-5 bg-transparent border-2 border-gray-100 rounded-3xl outline-none focus:border-lime-500 transition-all font-bold text-gray-800"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="E.G. REMOTE / HEADQUARTERS"
                />
              </div>

              <div className="relative group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-white px-2 z-10">Employment Type</label>
                <select
                  name="type"
                  className="w-full px-8 py-5 bg-transparent border-2 border-gray-100 rounded-3xl outline-none focus:border-lime-500 transition-all font-bold text-gray-800 appearance-none"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="Full-time">FULL-TIME</option>
                  <option value="Part-time">PART-TIME</option>
                  <option value="Contract">CONTRACT</option>
                  <option value="Internship">INTERNSHIP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Operational Details */}
          <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-2xl space-y-10">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b border-gray-50 pb-6">Operational Details</h2>
            
            <div className="space-y-10">
              <div className="relative group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-white px-2 z-10">Position Description</label>
                <textarea
                  name="description"
                  rows="5"
                  className="w-full px-8 py-6 bg-transparent border-2 border-gray-100 rounded-[2rem] outline-none focus:border-lime-500 transition-all font-bold text-gray-800"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="DESCRIBE THE MISSION OBJECTIVES..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="relative group">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-white px-2 z-10">Requirements (ONE PER LINE)</label>
                  <textarea
                    name="requirements"
                    rows="5"
                    className="w-full px-8 py-6 bg-transparent border-2 border-gray-100 rounded-[2rem] outline-none focus:border-lime-500 transition-all font-bold text-gray-800"
                    value={formData.requirements}
                    onChange={handleChange}
                    placeholder="REQUIRED SYSTEMS SKILLS..."
                  />
                </div>
                <div className="relative group">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-white px-2 z-10">Responsibilities (ONE PER LINE)</label>
                  <textarea
                    name="responsibilities"
                    rows="5"
                    className="w-full px-8 py-6 bg-transparent border-2 border-gray-100 rounded-[2rem] outline-none focus:border-lime-500 transition-all font-bold text-gray-800"
                    value={formData.responsibilities}
                    onChange={handleChange}
                    placeholder="OPERATIONAL DUTIES..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* HR Intelligence */}
          <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-2xl space-y-10">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 border-b border-gray-50 pb-6">HR Intelligence</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="relative group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-white px-2 z-10">HR Name</label>
                <input
                  type="text"
                  name="hrContact.name"
                  className="w-full px-8 py-5 bg-transparent border-2 border-gray-100 rounded-3xl outline-none focus:border-lime-500 transition-all font-bold text-gray-800"
                  value={formData.hrContact.name}
                  onChange={handleChange}
                  placeholder="AGENT NAME"
                />
              </div>
              <div className="relative group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-white px-2 z-10">HR Email</label>
                <input
                  type="email"
                  name="hrContact.email"
                  className="w-full px-8 py-5 bg-transparent border-2 border-gray-100 rounded-3xl outline-none focus:border-lime-500 transition-all font-bold text-gray-800"
                  value={formData.hrContact.email}
                  onChange={handleChange}
                  placeholder="AGENT@SYSTEM.COM"
                />
              </div>
              <div className="relative group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-white px-2 z-10">HR Phone</label>
                <input
                  type="text"
                  name="hrContact.phone"
                  className="w-full px-8 py-5 bg-transparent border-2 border-gray-100 rounded-3xl outline-none focus:border-lime-500 transition-all font-bold text-gray-800"
                  value={formData.hrContact.phone}
                  onChange={handleChange}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-8 bg-[#0a0a0a] text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-lime-400 hover:text-black transition-all shadow-2xl disabled:opacity-50"
          >
            {loading ? 'DEPLOYING PROTOCOL...' : 'EXECUTE POSITION DEPLOYMENT'}
          </button>
        </form>
      </div>
    </div>
  );
}
