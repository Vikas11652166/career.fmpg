'use client';

import { useState, useEffect } from 'react';
import { applicationService, jobService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    activeJobs: 0,
    certificatesIssued: 0,
    offersGenerated: 0
  });
  const { currentUser, isAdmin, isHR } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser || (!isAdmin && !isHR)) {
      router.push('/login');
      return;
    }
    loadDashboard();
  }, [currentUser, isAdmin, isHR, router]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, jobsRes] = await Promise.all([
        applicationService.getDashboardStats('all'),
        jobService.getAllJobs()
      ]);
      const s = statsRes.data;
      setStats({
        totalApplications: s.totalApplications || 0,
        activeJobs: jobsRes.data.filter(j => j.isActive).length,
        certificatesIssued: s.certificatesIssued || 0,
        offersGenerated: s.offersGenerated || 0
      });
    } catch (err) {
      toast.error('Failed to sync dashboard intelligence');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs">Synchronizing Intelligence...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">OPERATIONAL COMMAND</span>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
            Admin <br />
            <span className="text-lime-500">Cockpit</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {[
            { label: 'Applications', value: stats.totalApplications, color: 'text-lime-500' },
            { label: 'Active Jobs', value: stats.activeJobs, color: 'text-blue-500' },
            { label: 'Certificates', value: stats.certificatesIssued, color: 'text-purple-500' },
            { label: 'Offer Letters', value: stats.offersGenerated, color: 'text-pink-500' }
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-gray-100 p-10 rounded-[3rem] shadow-xl">
              <span className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-4 block">{stat.label}</span>
              <p className={`text-6xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              { title: 'Job Management', desc: 'Configure operational job openings.', path: '/admin/jobs' },
              { title: 'Application Directory', desc: 'Process candidate transmissions.', path: '/admin/applications' },
              { title: 'User Directory', desc: 'Manage system-wide user identities.', path: '/admin/users' },
              { title: 'Staff Registry', desc: 'Manage active employee records.', path: '/admin/employees' },
              { title: 'Certification Registry', desc: 'Issue and verify credentials.', path: '/admin/certificates' },
              { title: 'Operational Telemetry', desc: 'View system-wide audit logs.', path: '/admin/audit-logs' },
              { title: 'HR Governance', desc: 'Manage organizational permissions.', path: '/admin/manage-hr' }
            ].map((action, i) => (
             <button 
              key={i}
              onClick={() => router.push(action.path)}
              className="bg-white border-2 border-gray-50 p-12 rounded-[3.5rem] text-left hover:border-lime-400 transition-all group shadow-sm hover:shadow-2xl"
             >
                <h3 className="text-2xl font-black uppercase mb-4 group-hover:text-lime-500 transition-colors">{action.title}</h3>
                <p className="text-gray-500 font-medium">{action.desc}</p>
             </button>
           ))}
        </div>
      </div>
    </div>
  );
}
