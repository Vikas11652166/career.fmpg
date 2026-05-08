'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const { currentUser, logout, isAdmin, isHR } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'JOBS', path: '/jobs', show: true },
    { label: 'MY APPLICATIONS', path: '/my-applications', show: currentUser && !isAdmin && !isHR },
    { label: 'GOVERNANCE', path: '/admin/jobs', show: isAdmin || isHR },
    { label: 'CANDIDATES', path: '/admin/applications', show: isAdmin || isHR },
    { label: 'USERS', path: '/admin/users', show: isAdmin || isHR },
    { label: 'STAFF', path: '/admin/employees', show: isAdmin || isHR },
    { label: 'CERTIFICATES', path: '/admin/certificates', show: isAdmin || isHR },
    { label: 'MANAGE HR', path: '/admin/manage-hr', show: isAdmin && currentUser?.role === 'super-admin' },
    { label: 'PROFILE', path: '/employee/profile', show: currentUser?.role === 'employee' },
    { label: 'TELEMETRY', path: '/admin/audit-logs', show: isAdmin },
    { label: 'DASHBOARD', path: '/dashboard', show: isAdmin || isHR },
  ].filter(item => item.show !== false);

  return (
    <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-2xl py-4 shadow-xl shadow-gray-100/20' : 'bg-transparent py-8'}`}>
      <div className="max-w-7xl mx-auto px-10 flex items-center justify-between">
        <Link href="/" className="group">
          <span className="text-3xl font-black tracking-tighter uppercase">FMPG<span className="text-lime-500 group-hover:rotate-12 inline-block transition-transform">.</span></span>
        </Link>

        <div className="hidden lg:flex items-center gap-12">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path} 
              className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:text-lime-500 ${pathname === item.path ? 'text-lime-500' : 'text-gray-400'}`}
            >
              {item.label}
            </Link>
          ))}
          
          {currentUser ? (
            <div className="flex items-center gap-8 pl-8 border-l border-gray-100">
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{currentUser.name}</p>
                <p className="text-[8px] font-bold text-lime-500 uppercase tracking-[0.2em]">{currentUser.role}</p>
              </div>
              <button 
                onClick={logout}
                className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all group"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="px-10 py-4 bg-lime-400 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all shadow-xl shadow-lime-400/20"
            >
              Access System
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
