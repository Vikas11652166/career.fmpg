'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  Briefcase, 
  LayoutDashboard, 
  Award, 
  Star, 
  HeartHandshake, 
  Users, 
  ShieldCheck, 
  History, 
  UserCircle, 
  ChevronDown, 
  MoreHorizontal,
  LogOut,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Shield,
  FileText,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { currentUser, logout, isAdmin, isSuperAdmin, isHR, isEmployee, hasDashboardAccess } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileMoreMenuOpen, setMobileMoreMenuOpen] = useState(false);
  
  const userMenuRef = useRef(null);
  const moreMenuRef = useRef(null);
  const mobileMoreMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target)) setUserMenuOpen(false);
      if (moreMenuOpen && moreMenuRef.current && !moreMenuRef.current.contains(event.target)) setMoreMenuOpen(false);
      if (mobileMoreMenuOpen && mobileMoreMenuRef.current && !mobileMoreMenuRef.current.contains(event.target)) setMobileMoreMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen, moreMenuOpen, mobileMoreMenuOpen]);

  useEffect(() => {
    setUserMenuOpen(false);
    setMoreMenuOpen(false);
    setMobileMoreMenuOpen(false);
  }, [pathname, searchParams]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getNavigationItems = () => {
    const baseItems = [
      { to: '/', label: 'Home', icon: Home },
      { to: '/jobs', label: 'Jobs', icon: Briefcase }
    ];

    let additionalItems = [];

    if (!currentUser) {
      additionalItems = [
        { to: '/login', label: 'Login', icon: UserCircle }
      ];
    } else {
      if (currentUser.role === 'user') {
        additionalItems.push({ to: '/my-applications', label: 'My Applications', icon: FileText });
        if (currentUser.role === 'employee') {
          additionalItems.push({ to: '/employee/profile', label: 'Employee Profile', icon: UserCircle });
          if (['active', 'former'].includes(currentUser.status)) {
            additionalItems.push({ to: '/reviews/submit', label: 'Write Review', icon: Star });
          }
        }
      } else if (isAdmin || isHR || isEmployee) {
        const perms = currentUser.permissions || {};

        if (hasDashboardAccess) {
          additionalItems.push({ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard });
        }

        if (isAdmin || (isHR && perms.canGenerateCertificate)) {
          additionalItems.push({ to: '/admin/certificates', label: 'Certificates', icon: Award });
        }

        if (isAdmin || (isHR && perms.canManageReviews)) {
          additionalItems.push({ to: '/admin/reviews', label: 'Reviews', icon: Star });
        }

        if (isAdmin || (isEmployee && perms.canManageRecommendations)) {
          additionalItems.push({ to: '/admin/recommendations', label: 'Referrals', icon: HeartHandshake });
        }

        if (isAdmin) {
          additionalItems.push({ to: '/admin/users', label: 'Users', icon: Users });
        }

        if (isAdmin || (isHR && perms.canManageEmployees)) {
          additionalItems.push({ to: '/admin/employees', label: 'Employees', icon: UserPlus });
        }

        if (isSuperAdmin) {
          additionalItems.push({ to: '/admin/manage-hr', label: 'HR Admin', icon: ShieldCheck });
          additionalItems.push({ to: '/admin/audit-logs', label: 'Audit Logs', icon: History });
        }

        if (currentUser.role === 'employee') {
          additionalItems.push({ to: '/employee/profile', label: 'Profile', icon: UserCircle });
          if (['active', 'former'].includes(currentUser.status)) {
            additionalItems.push({ to: '/reviews/submit', label: 'Write Review', icon: Star });
          }
        }
      }
    }

    return [...baseItems, ...additionalItems];
  };

  const allNavItems = getNavigationItems();
  const shouldShowMore = allNavItems.length > 5;
  const visibleItems = shouldShowMore ? allNavItems.slice(0, 4) : allNavItems;
  const moreItems = shouldShowMore ? allNavItems.slice(4) : [];

  const isActive = (to) => pathname === to;

  if (pathname && pathname.includes('/admin/templates/build')) return null;

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-b border-gray-100 py-4' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-[#0a0a0a] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-2xl">
              <span className="text-lime-400 font-black text-xl italic">F</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#0a0a0a] font-black text-xl tracking-tighter leading-none">FMPG</span>
              <span className="text-gray-400 font-bold text-[8px] tracking-[0.3em] uppercase mt-1">Careers</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-1 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
              {visibleItems.map((item) => (
                <Link
                  key={item.to}
                  href={item.to}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isActive(item.to) ? 'bg-[#0a0a0a] text-white shadow-xl' : 'text-gray-400 hover:text-black hover:bg-white'}`}
                >
                  {item.label}
                </Link>
              ))}

              {shouldShowMore && (
                <div className="relative" ref={moreMenuRef}>
                  <button
                    onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${moreMenuOpen ? 'bg-white text-black' : 'text-gray-400 hover:text-black hover:bg-white'}`}
                  >
                    More <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${moreMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {moreMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-64 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden py-3"
                      >
                        {moreItems.map((item) => (
                          <Link
                            key={item.to}
                            href={item.to}
                            className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                          >
                            <item.icon className="w-4 h-4 text-gray-400 group-hover:text-lime-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-black">{item.label}</span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {currentUser && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-2xl border border-gray-100 hover:border-lime-500 transition-all shadow-sm group"
                >
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center font-black text-lime-500 group-hover:bg-lime-500 group-hover:text-white transition-colors">
                    {currentUser.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-[10px] font-black uppercase tracking-tighter leading-none">{currentUser.name}</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">{currentUser.role}</p>
                  </div>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-72 bg-[#0a0a0a] text-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
                    >
                      <div className="mb-8 pb-8 border-b border-white/10">
                        <p className="text-[10px] font-black text-lime-400 uppercase tracking-[0.3em] mb-4">Identity Profile</p>
                        <h4 className="text-xl font-black tracking-tight mb-1">{currentUser.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{currentUser.email}</p>
                      </div>

                      <div className="space-y-4">
                        <Link href="/profile" className="flex items-center gap-4 text-gray-400 hover:text-white transition-colors group">
                          <UserCircle className="w-4 h-4 group-hover:text-lime-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Account Matrix</span>
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className="flex items-center gap-4 text-red-400 hover:text-red-300 transition-colors group w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar - MERN Parity Alignment */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around py-4 px-6 z-[100] shadow-2xl">
        {visibleItems.map((item) => (
          <Link
            key={item.to}
            href={item.to}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive(item.to) ? 'text-black scale-110' : 'text-gray-300'}`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </Link>
        ))}
        
        {shouldShowMore && (
          <button
            onClick={() => setMobileMoreMenuOpen(true)}
            className="flex flex-col items-center gap-1.5 text-gray-300"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-widest">More</span>
          </button>
        )}
      </div>

      {/* Mobile More Menu Overlay */}
      <AnimatePresence>
        {mobileMoreMenuOpen && (
          <div className="fixed inset-0 z-[200] md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMoreMenuOpen(false)}
              className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3.5rem] p-12 pb-24"
              ref={mobileMoreMenuRef}
            >
              <div className="flex justify-between items-center mb-12">
                <span className="text-lime-500 font-black text-[10px] tracking-[0.3em] uppercase">Extended Menu</span>
                <button onClick={() => setMobileMoreMenuOpen(false)}>
                  <XCircle className="w-8 h-8 text-gray-200" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {moreItems.map((item) => (
                  <Link
                    key={item.to}
                    href={item.to}
                    className="bg-gray-50 p-8 rounded-[2rem] flex flex-col items-center gap-4 text-center border border-transparent hover:border-lime-500 transition-all"
                  >
                    <item.icon className="w-6 h-6 text-gray-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.label}</span>
                  </Link>
                ))}
                {currentUser && (
                  <button 
                    onClick={handleLogout}
                    className="col-span-2 mt-4 py-8 bg-red-50 rounded-[2rem] flex items-center justify-center gap-4 text-red-500 font-black uppercase tracking-widest text-[10px]"
                  >
                    <LogOut className="w-4 h-4" /> Terminate Session
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
