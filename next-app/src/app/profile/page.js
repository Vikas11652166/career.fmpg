'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfileRedirect() {
  const { currentUser, isAdmin, isHR, isEmployee, isUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (isAdmin || isHR) {
      router.push('/dashboard');
    } else if (isEmployee) {
      router.push('/employee/profile');
    } else {
      router.push('/my-applications');
    }
  }, [currentUser, isAdmin, isHR, isEmployee, router]);

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-[10px] animate-pulse">
      Rerouting to Identity Cockpit...
    </div>
  );
}
