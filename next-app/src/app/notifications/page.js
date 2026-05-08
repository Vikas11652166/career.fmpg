'use client';

import { useState, useEffect } from 'react';
import { notificationService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  Trash2, 
  ChevronRight, 
  Search,
  Filter,
  CheckCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, unreadCount: 0 });

  useEffect(() => {
    if (!currentUser) return;
    fetchNotifications();
  }, [currentUser, filter, pagination.page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        unreadOnly: filter === 'unread'
      };
      const res = await notificationService.getUserNotifications(params);
      setNotifications(res.data.notifications);
      setPagination(prev => ({
        ...prev,
        totalPages: res.data.pagination.totalPages,
        unreadCount: res.data.pagination.unreadCount
      }));
    } catch (err) {
      toast.error('Failed to synchronize notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setPagination(prev => ({ ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) }));
    } catch (err) {
      toast.error('Sync failed');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setPagination(prev => ({ ...prev, unreadCount: 0 }));
      toast.success('System synchronization complete');
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Record purged');
    } catch (err) {
      toast.error('Purge failed');
    }
  };

  if (loading && notifications.length === 0) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-black uppercase tracking-widest text-xs animate-pulse text-gray-400">ACCESSING ENCRYPTED FEED...</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end justify-between mb-20">
          <div>
            <span className="text-lime-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">SECURITY FEED</span>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.8]">
              Alert <br />
              <span className="text-lime-500 text-7xl lg:text-9xl">Matrix</span>
            </h1>
          </div>
          {pagination.unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-lime-500 hover:text-black transition-colors"
            >
              <CheckCheck className="w-4 h-4" /> Synchronize All
            </button>
          )}
        </div>

        <div className="flex gap-4 mb-12">
           <button 
             onClick={() => setFilter('all')}
             className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${filter === 'all' ? 'bg-black text-white' : 'bg-white border border-gray-100 text-gray-400 hover:border-gray-200'}`}
           >
             All Logs
           </button>
           <button 
             onClick={() => setFilter('unread')}
             className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${filter === 'unread' ? 'bg-black text-white' : 'bg-white border border-gray-100 text-gray-400 hover:border-gray-200'}`}
           >
             Unread ({pagination.unreadCount})
           </button>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white border border-gray-100 p-20 rounded-[4rem] text-center shadow-2xl">
            <Bell className="w-16 h-16 mx-auto text-gray-100 mb-8" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Zero active transmissions detected</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {notifications.map((n) => (
                <motion.div 
                  key={n._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-10 rounded-[3rem] border transition-all relative group ${n.isRead ? 'bg-white/50 border-gray-100' : 'bg-white border-lime-400 shadow-xl'}`}
                >
                  <div className="flex items-start justify-between mb-8">
                     <div className="flex items-center gap-6">
                        <div className={`p-4 rounded-2xl ${n.isRead ? 'bg-gray-50' : 'bg-lime-400'}`}>
                           {n.type === 'job_update' ? <Clock className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                        </div>
                        <div>
                           <h3 className={`text-xl font-black uppercase tracking-tight ${n.isRead ? 'text-gray-400' : 'text-black'}`}>{n.title}</h3>
                           <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.isRead && (
                          <button onClick={() => handleMarkRead(n._id)} className="p-3 bg-gray-50 rounded-xl hover:bg-lime-400 transition-all">
                             <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(n._id)} className="p-3 bg-gray-50 rounded-xl hover:bg-red-400 hover:text-white transition-all">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500 leading-relaxed mb-8">{n.message}</p>
                  
                  {n.relatedJobId && (
                    <button 
                      onClick={() => router.push(`/jobs`)}
                      className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-lime-500 hover:gap-6 transition-all"
                    >
                      Inspect Source <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
