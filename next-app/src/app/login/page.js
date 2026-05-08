'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await login(formData);
      if (response.user && response.user.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center px-6 py-20">
      <div className="max-w-xl w-full">
        <div className="text-center mb-16">
          <Link href="/" className="inline-block mb-10">
            <span className="text-4xl font-black tracking-tighter uppercase">FMPG<span className="text-lime-500">.</span></span>
          </Link>
          <h2 className="text-5xl font-black tracking-tighter uppercase mb-4">Account <span className="text-lime-500">Access</span></h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Login to your operational cockpit</p>
        </div>
        
        <div className="bg-[#fcfcfc] p-12 rounded-[3rem] border border-gray-100 shadow-2xl">
          <form className="space-y-10" onSubmit={handleSubmit}>
            <div className="relative group">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-[#fcfcfc] px-2 z-10 transition-colors group-focus-within:text-lime-500">Email Protocol</label>
              <input
                type="email"
                name="email"
                className="w-full px-8 py-5 bg-transparent border-2 border-gray-100 rounded-3xl outline-none focus:border-lime-500 transition-all font-bold text-gray-800"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="USER@SYSTEM.COM"
              />
            </div>
            
            <div className="relative group">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 absolute -top-3 left-6 bg-[#fcfcfc] px-2 z-10 transition-colors group-focus-within:text-lime-500">Access Cipher</label>
              <input
                type="password"
                name="password"
                className="w-full px-8 py-5 bg-transparent border-2 border-gray-100 rounded-3xl outline-none focus:border-lime-500 transition-all font-bold text-gray-800"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full py-6 bg-lime-400 text-black rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-lime-400/20 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Establish Connection'}
            </button>
            
            <div className="text-center">
              <Link href="/register" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-500 transition-colors">
                Initialize new account registration
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
