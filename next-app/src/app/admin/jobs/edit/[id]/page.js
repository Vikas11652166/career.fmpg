'use client';

import { useState, useEffect } from 'react';
import { jobService } from '@/services/api';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import JobQuestionManager from '@/components/JobQuestionManager';

export default function EditJobPage() {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    company: '',
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const router = useRouter();

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const res = await jobService.getJobById(id);
      const job = res.data;
      setFormData({
        ...job,
        requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : job.requirements || '',
        responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.join('\n') : job.responsibilities || '',
        hrContact: {
          name: job.hrContact?.name || '',
          email: job.hrContact?.email || '',
          phone: job.hrContact?.phone || ''
        }
      });
    } catch (err) {
      toast.error('Failed to load position intelligence');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        requirements: typeof formData.requirements === 'string' ? formData.requirements.split('\n').filter(r => r.trim()) : formData.requirements,
        responsibilities: typeof formData.responsibilities === 'string' ? formData.responsibilities.split('\n').filter(r => r.trim()) : formData.responsibilities
      };
      await jobService.updateJob(id, payload);
      toast.success('Intelligence updated');
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse">Accessing Intelligence...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-16">
          <Link href="/admin/jobs" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-500 transition-colors mb-8 block">
            ← Return to Registry
          </Link>
          <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">INTELLIGENCE CONFIGURATION</span>
          <h1 className="text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-[0.85]">
            Edit <br />
            <span className="text-lime-500">Position</span>
          </h1>
        </div>

        <div className="flex gap-4 mb-12">
          {['details', 'questions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all border-2 ${activeTab === tab ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]' : 'bg-white text-gray-400 border-gray-100'}`}
            >
              {tab === 'details' ? 'Core Parameters' : 'Question Matrix'}
            </button>
          ))}
        </div>

        {activeTab === 'details' ? (
          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-2xl space-y-10">
              <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Parameter Calibration</h2>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Operational Status</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="isActive" 
                      checked={formData.isActive} 
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-gray-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-lime-400"></div>
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="relative group">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-white px-2 z-10">Position Title</label>
                  <input
                    type="text"
                    name="title"
                    className="w-full px-8 py-5 bg-transparent border-2 border-gray-100 rounded-3xl outline-none focus:border-lime-500 transition-all font-bold text-gray-800"
                    value={formData.title}
                    onChange={handleChange}
                    required
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

              <div className="relative group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-white px-2 z-10">Description</label>
                <textarea
                  name="description"
                  rows="5"
                  className="w-full px-8 py-6 bg-transparent border-2 border-gray-100 rounded-[2rem] outline-none focus:border-lime-500 transition-all font-bold text-gray-800"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="relative group">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-white px-2 z-10">Requirements</label>
                  <textarea
                    name="requirements"
                    rows="5"
                    className="w-full px-8 py-6 bg-transparent border-2 border-gray-100 rounded-[2rem] outline-none focus:border-lime-500 transition-all font-bold text-gray-800"
                    value={formData.requirements}
                    onChange={handleChange}
                  />
                </div>
                <div className="relative group">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-white px-2 z-10">Responsibilities</label>
                  <textarea
                    name="responsibilities"
                    rows="5"
                    className="w-full px-8 py-6 bg-transparent border-2 border-gray-100 rounded-[2rem] outline-none focus:border-lime-500 transition-all font-bold text-gray-800"
                    value={formData.responsibilities}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

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
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full py-8 bg-[#0a0a0a] text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-lime-400 hover:text-black transition-all shadow-2xl disabled:opacity-50"
            >
              {saving ? 'UPDATING PARAMETERS...' : 'EXECUTE PARAMETER UPDATE'}
            </button>
          </form>
        ) : (
          <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-2xl">
            <JobQuestionManager jobId={id} onQuestionsChanged={() => {}} />
          </div>
        )}
      </div>
    </div>
  );
}
