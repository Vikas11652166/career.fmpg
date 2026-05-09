'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit3, Trash2, CheckCircle2, 
  FileText, Briefcase, GraduationCap, Copy, ChevronLeft,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TemplateStudioPage() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, certificate, offerLetter, lor

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/templates', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const result = await res.json();
      if (res.ok) {
        setTemplates(result.templates || []);
      } else {
        toast.error(result.message || 'Failed to fetch templates');
      }
    } catch (err) {
      toast.error('Network error while fetching templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser || !isAdmin) {
      router.push('/login');
      return;
    }
    fetchTemplates();
  }, [currentUser, isAdmin, router, fetchTemplates]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.success('Template deleted successfully');
        fetchTemplates();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to delete template');
      }
    } catch (err) {
      toast.error('Error executing deletion');
    }
  };

  const handleSetDefault = async (template) => {
    try {
      const res = await fetch(`/api/admin/templates/${template._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ ...template, isDefault: true })
      });
      if (res.ok) {
        toast.success('Default template updated');
        fetchTemplates();
      } else {
        toast.error('Failed to update template');
      }
    } catch (err) {
      toast.error('Error updating template');
    }
  };

  const handleSeedTemplate = async () => {
    try {
      toast.info('Seeding Standard Template...');
      const res = await fetch('/api/admin/templates/seed', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.success('Standard template successfully seeded!');
        fetchTemplates();
      } else {
        toast.error('Failed to seed template');
      }
    } catch (err) {
      toast.error('Error seeding template');
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || t.documentType === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getDocTypeIcon = (type) => {
    switch (type) {
      case 'certificate': return <GraduationCap className="w-5 h-5 text-lime-500" />;
      case 'offerLetter': return <Briefcase className="w-5 h-5 text-blue-500" />;
      case 'extendedOfferLetter': return <Copy className="w-5 h-5 text-amber-500" />;
      case 'lor': return <FileText className="w-5 h-5 text-purple-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading && templates.length === 0) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-lime-500 rounded-full"></div>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-400">INITIALIZING STUDIO...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-20">
      {/* Dynamic Header */}
      <div className="bg-white border-b border-gray-100 pt-32 pb-12 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-500 transition-colors mb-6">
                <ChevronLeft className="w-4 h-4" /> Return to Command Center
              </Link>
              <h1 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-none">
                Template <br /><span className="text-lime-500">Studio</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={handleSeedTemplate}
                className="group flex items-center gap-4 px-8 py-5 bg-white border border-gray-100 text-black rounded-2xl hover:border-lime-500 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-xl bg-gray-50 group-hover:bg-lime-50 flex items-center justify-center transition-colors">
                  <Sparkles className="w-4 h-4 text-gray-500 group-hover:text-lime-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Seed Defaults</span>
              </button>
              
              <Link 
                href="/admin/templates/build"
                className="group flex items-center gap-4 px-8 py-5 bg-black text-white rounded-2xl hover:bg-lime-400 hover:text-black transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Create New Template</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm mb-12 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-lime-500 transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH TEMPLATES..."
              className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 pl-14 pr-8 outline-none focus:border-lime-500 transition-all font-bold uppercase tracking-widest text-[10px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 p-2 bg-gray-50 rounded-2xl overflow-x-auto">
            {['all', 'certificate', 'offerLetter', 'lor'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeFilter === filter 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-gray-400 hover:text-black hover:bg-gray-100'
                }`}
              >
                {filter === 'all' ? 'All Types' : filter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredTemplates.map((template) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={template._id}
                className={`bg-white border-2 rounded-[2rem] p-8 transition-all hover:-translate-y-1 shadow-sm hover:shadow-xl ${
                  template.isDefault ? 'border-lime-500' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 rounded-2xl bg-gray-50">
                    {getDocTypeIcon(template.documentType)}
                  </div>
                  {template.isDefault && (
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-lime-600 bg-lime-50 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 className="w-3 h-3" /> Active Default
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-black uppercase mb-2 line-clamp-1" title={template.name}>
                  {template.name}
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">
                  {template.documentType} • {template.elements?.length || 0} Elements
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                  <div className="flex gap-2">
                    <Link 
                      href={`/admin/templates/build?id=${template._id}`}
                      className="p-3 bg-gray-50 text-gray-600 hover:bg-black hover:text-white rounded-xl transition-colors"
                      title="Edit Canvas"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => handleDelete(template._id)}
                      className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {!template.isDefault && (
                    <button 
                      onClick={() => handleSetDefault(template)}
                      className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-500 transition-colors"
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-20 bg-white border border-gray-100 rounded-[3rem] mt-6">
            <FileText className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h3 className="text-2xl font-black uppercase mb-2">No Templates Found</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">
              Create a new template to get started
            </p>
            <Link 
              href="/admin/templates/build"
              className="inline-flex items-center gap-2 px-8 py-4 bg-lime-400 text-black rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Design
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
