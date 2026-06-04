"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Inbox, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Clock,
  ArrowLeft,
  X,
  Mail,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import JobUpdateNotificationCard from "@/components/notifications/JobUpdateNotificationCard";
import { 
  getUserNotificationsAction, 
  markNotificationReadAction, 
  markAllNotificationsReadAction, 
  deleteNotificationAction 
} from "@/app/actions/jobs";
import { getMeAction } from "@/app/actions/auth";

interface Notification {
  _id: string;
  type: "job_update" | "application_status" | "system";
  title: string;
  message: string;
  relatedJobId?: {
    _id: string;
    title: string;
    slug: string;
  } | null;
  relatedApplicationId?: string;
  isRead: boolean;
  jobUpdateDetails?: any;
  priority: "low" | "medium" | "high";
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    async function checkAuth() {
      const meRes = await getMeAction();
      if (!meRes.success || !meRes.data) {
        toast.error("Please log in to view your notifications.");
        router.push("/login");
        return;
      }
      setUser(meRes.data);
    }
    checkAuth();
  }, []);

  const fetchNotifications = async (p = page, f = filter) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getUserNotificationsAction({
        page: p,
        limit,
        unreadOnly: f === "unread" ? true : undefined
      });

      if (res.success && res.data) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
        setTotal(f === "unread" ? res.data.unreadCount : (res.data as any).pagination?.total ?? 0);
      } else {
        toast.error("Failed to load notifications.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred fetching notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications(1, filter);
      setPage(1);
    }
  }, [user, filter]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchNotifications(newPage, filter);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await markNotificationReadAction(id);
      if (res.success) {
        setNotifications(prev =>
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        if (filter === "unread") {
          setTotal(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsReadAction();
      if (res.success) {
        toast.success(res.message || "All notifications marked as read.");
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        if (filter === "unread") {
          setNotifications([]);
          setTotal(0);
        }
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Failed to mark notifications as read.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;

    try {
      const res = await deleteNotificationAction(id);
      if (res.success) {
        toast.success("Notification deleted successfully");
        fetchNotifications(page, filter);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      await handleMarkAsRead(n._id);
    }

    if (n.relatedJobId) {
      router.push(`/jobs/${n.relatedJobId.slug || n.relatedJobId._id}`);
    } else if (n.relatedApplicationId) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden text-foreground">
      <Navbar />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <main className="flex-grow pt-28 pb-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
            <div>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-emerald-600 mb-3 transition-colors duration-300 group"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back
              </button>
              <h1 className="font-heading text-2xl md:text-3xl font-black uppercase tracking-wider text-foreground flex items-center gap-3">
                Notification <span className="text-emerald-600">Center</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Stay updated with vacancy changes, application reviews, and system alerts.
              </p>
            </div>
            
            <div className="flex items-center gap-3 self-start md:self-auto">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 px-4 py-2 bg-muted hover:bg-muted/70 text-foreground border border-border/40 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-300 cursor-pointer shadow-sm"
                >
                  <CheckCheck className="h-4 w-4 text-emerald-600" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => fetchNotifications(page, filter)}
                disabled={loading}
                className="h-10 w-10 bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground rounded-xl border border-border/40 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
                title="Refresh feed"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Filters and counters */}
          <div className="bg-card border border-border/40 rounded-2xl p-4 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setFilter("all")}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  filter === "all"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "bg-muted/40 border border-border/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                All Messages
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer relative ${
                  filter === "unread"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "bg-muted/40 border border-border/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                Unread Messages
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-amber-500 border border-background text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <Bell className="h-4 w-4 text-emerald-600" />
              <span>Unread: <span className="text-foreground font-black">{unreadCount}</span></span>
            </div>
          </div>

          {/* Main Feed Container */}
          {loading ? (
            <div className="py-24 text-center">
              <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
              <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Updating notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-24 bg-card border border-border/40 rounded-3xl p-8 text-center backdrop-blur-xl space-y-4 shadow-sm">
              <div className="mx-auto h-16 w-16 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground border border-border/30">
                <Inbox className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground mb-1">Catch Up Complete</h3>
                <p className="text-muted-foreground text-xs max-w-sm mx-auto leading-relaxed">
                  {filter === "unread" 
                    ? "Excellent! You are all caught up with your candidate updates."
                    : "Your notification inbox is completely empty. We'll alert you here of application changes."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((n) => {
                if (n.type === "job_update") {
                  return (
                    <JobUpdateNotificationCard
                      key={n._id}
                      notification={n}
                      onMarkAsRead={handleMarkAsRead}
                      onDismiss={handleDelete}
                    />
                  );
                }

                // Default Notification Card
                return (
                  <div 
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`bg-card border border-border/40 hover:border-primary/20 rounded-2xl p-5 backdrop-blur-xl transition-all duration-300 cursor-pointer border-l-4 flex gap-4 shadow-sm ${
                      !n.isRead 
                        ? n.priority === "high"
                          ? "border-l-amber-500 bg-amber-500/5"
                          : "border-l-blue-500 bg-blue-500/5"
                        : "border-l-muted-foreground/30"
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 ${
                      n.type === "application_status" 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" 
                        : "bg-muted border-border/20 text-muted-foreground"
                    }`}>
                      {n.type === "application_status" ? (
                        <UserCheck className="h-5 w-5" />
                      ) : (
                        <Bell className="h-5 w-5" />
                      )}
                    </div>

                    <div className="flex-grow space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className={`font-semibold text-sm leading-snug ${
                            !n.isRead ? "text-foreground" : "text-foreground/70"
                          }`}>
                            {n.title}
                          </h3>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                            <Clock className="h-3.5 w-3.5" /> {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!n.isRead && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                          )}
                        </div>
                      </div>

                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {n.message}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(n._id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                      title="Delete notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between bg-card border border-border/40 rounded-2xl px-6 py-4 backdrop-blur-xl shadow-sm">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-2 bg-muted border border-border/30 rounded-xl hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-foreground transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 bg-muted border border-border/30 rounded-xl hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-foreground transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
