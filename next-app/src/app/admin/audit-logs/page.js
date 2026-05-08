'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Activity, Shield, Clock, ChevronLeft, ChevronRight, User as UserIcon, Database, Terminal } from 'lucide-react';
import Link from 'next/link';

export default function AuditLogsPage() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/audit-logs?page=${currentPage}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();

      if (res.ok) {
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.message || 'Failed to fetch logs');
      }
    } catch (err) {
      toast.error('Synchronization failed');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'super-admin') {
      router.push('/dashboard');
      return;
    }
    fetchLogs();
  }, [fetchLogs, currentUser, router]);

  const getActionColor = (action) => {
    const colors = {
      CREATE: 'text-lime-500 bg-lime-50',
      UPDATE: 'text-blue-500 bg-blue-50',
      DELETE: 'text-red-500 bg-red-50',
      LOGIN: 'text-purple-500 bg-purple-50',
      DOWNLOAD: 'text-emerald-500 bg-emerald-50'
    };
    return colors[action] || 'text-gray-400 bg-gray-50';
  };

  if (loading && logs.length === 0) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse">Scanning System Core...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0a0a0a] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-500 transition-colors mb-8 block">
            ← Return to Cockpit
          </Link>
          <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">SYSTEM AUDIT</span>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
            Operational <br />
            <span className="text-lime-500">Telemetry</span>
          </h1>
        </div>

        <div className="bg-white border border-gray-100 rounded-[3.5rem] shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Timestamp</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Actor</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Protocol</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Entity</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Payload Overview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <motion.tr 
                    key={log._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <Clock className="w-3 h-3 text-lime-500" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-gray-300" />
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-widest text-[10px] mb-1">{log.actor?.name || 'SYSTEM'}</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{log.actorRole}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <Database className="w-3 h-3 text-blue-500" /> {log.resourceEntity}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3 bg-gray-100/50 p-4 rounded-xl border border-gray-100 group-hover:bg-white group-hover:shadow-md transition-all">
                        <Terminal className="w-3 h-3 text-gray-300" />
                        <code className="text-[9px] font-mono font-bold text-gray-400 truncate max-w-[200px]">
                          {JSON.stringify(log.changes || {})}
                        </code>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Command */}
          {totalPages > 1 && (
            <div className="px-10 py-8 bg-gray-50/50 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Data Stream Page {currentPage} OF {totalPages}
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-lime-400 hover:text-black transition-all disabled:opacity-50 shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-lime-400 hover:text-black transition-all disabled:opacity-50 shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
