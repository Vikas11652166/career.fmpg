"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  Users, 
  ShieldAlert, 
  Mail, 
  Phone, 
  UserCheck, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { getCandidatesAction, updateEmployeeAction, deleteUserAction } from "@/app/actions/admin";

interface UserCandidate {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: string;
  status: "active" | "inactive" | "suspended" | "former";
  applicationStatus: string;
  createdAt: string;
}

interface UserDirectoryPanelProps {
  initialData: {
    users: UserCandidate[];
    pagination: {
      currentPage: number;
      totalPages: number;
      total: number;
    };
  } | null;
  currentUserRole?: string;
}

export default function UserDirectoryPanel({ initialData, currentUserRole = "admin" }: UserDirectoryPanelProps) {
  const [users, setUsers] = useState<UserCandidate[]>(initialData?.users ?? []);
  const [currentPage, setCurrentPage] = useState(initialData?.pagination.currentPage ?? 1);
  const [totalPages, setTotalPages] = useState(initialData?.pagination.totalPages ?? 1);
  const [totalResults, setTotalResults] = useState(initialData?.pagination.total ?? 0);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAppStatus, setFilterAppStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserCandidate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [accountStatus, setAccountStatus] = useState<UserCandidate["status"]>("active");
  const [updating, setUpdating] = useState(false);

  const fetchCandidates = async (page = currentPage, search = searchTerm, appStatus = filterAppStatus) => {
    setLoading(true);
    try {
      const res = await getCandidatesAction({
        page,
        limit: 10,
        search: search || undefined,
        applicationStatus: appStatus || undefined,
      });

      if (res.success && res.data) {
        setUsers(res.data.users);
        setCurrentPage(res.data.pagination.currentPage);
        setTotalPages(res.data.pagination.totalPages);
        setTotalResults(res.data.pagination.total);
      } else {
        toast.error(res.message || "Failed to load candidate list");
      }
    } catch (err: any) {
      toast.error(err.message || "Error loading candidate directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCandidates(1, searchTerm, filterAppStatus);
    }, 400); // debounce input
    return () => clearTimeout(handler);
  }, [searchTerm, filterAppStatus]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchCandidates(newPage, searchTerm, filterAppStatus);
  };

  const handleOpenModal = (user: UserCandidate) => {
    setSelectedUser(user);
    setAccountStatus(user.status);
    setShowModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser) return;
    setUpdating(true);
    try {
      const res = await updateEmployeeAction(selectedUser._id, { status: accountStatus });
      if (res.success) {
        toast.success("User account status updated successfully");
        setShowModal(false);
        fetchCandidates(currentPage, searchTerm, filterAppStatus);
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while updating status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (currentUserRole !== "super-admin") {
      toast.error("Access Restricted: Only Super Admins can delete user accounts.");
      return;
    }

    if (!window.confirm(`Are you absolutely sure you want to permanently delete the account for ${userName}? This action is irreversible.`)) {
      return;
    }

    try {
      const res = await deleteUserAction(userId);
      if (res.success) {
        toast.success(res.message || "User deleted successfully");
        fetchCandidates(currentPage, searchTerm, filterAppStatus);
      } else {
        toast.error(res.message || "Failed to delete user account");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  const getAppStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "reviewing":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "shortlisted":
        return "bg-emerald-50 text-emerald-600 border border-emerald-600/20";
      case "rejected":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "offered":
      case "hired":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      default:
        return "bg-slate-800/40 text-slate-500 border border-slate-700/30";
    }
  };

  const getAccountStatusBadge = (status: UserCandidate["status"]) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Active
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
            Inactive
          </span>
        );
    }
  };

  const isSuperAdmin = currentUserRole === "super-admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
            User <span className="text-primary">Directory</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Search, filter, inspect and manage candidate accounts in FMPG Careers ecosystem.
          </p>
        </div>
        <button
          onClick={() => fetchCandidates(currentPage, searchTerm, filterAppStatus)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-300 border border-white/5 disabled:opacity-50 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Directory
        </button>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-100/50 border border-slate-200/60 rounded-2xl p-6 backdrop-blur-xl flex items-center gap-4">
          <div className="h-12 w-12 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total Registered Candidates</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalResults}</p>
          </div>
        </div>

        <div className="bg-slate-100/50 border border-slate-200/60 rounded-2xl p-6 backdrop-blur-xl flex items-center gap-4">
          <div className="h-12 w-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Active Accounts</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {users.filter(u => u.status === "active").length} <span className="text-xs text-slate-500 font-medium">on this page</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-slate-100/50 border border-slate-200/60 rounded-2xl p-5 backdrop-blur-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full bg-card border border-slate-200/60 text-slate-200 placeholder:text-slate-600 rounded-xl text-xs focus:border-primary transition-all outline-none"
          />
        </div>

        <div className="relative flex items-center">
          <Filter className="absolute left-3.5 text-slate-500 h-4 w-4 pointer-events-none" />
          <select
            value={filterAppStatus}
            onChange={(e) => setFilterAppStatus(e.target.value)}
            className="appearance-none pl-10 pr-4 py-2.5 w-full bg-card border border-slate-200/60 text-slate-250 rounded-xl text-xs focus:border-primary transition-all outline-none cursor-pointer font-bold uppercase tracking-wider"
          >
            <option value="">All Application Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="offered">Offered</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
            <option value="Not Applied">Not Applied</option>
          </select>
        </div>

        <button
          onClick={() => { setSearchTerm(""); setFilterAppStatus(""); }}
          className="py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          Clear Filters
        </button>
      </div>

      {/* Candidates List / Directory Table */}
      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Updating records...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="py-24 bg-slate-100/50 border border-slate-200/60 rounded-2xl p-8 text-center backdrop-blur-xl">
          <ShieldAlert className="h-10 w-10 text-slate-600 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-bold text-slate-900 mb-1">No Candidates Found</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
            There are no registered candidate accounts matching your criteria inside the careers directory.
          </p>
        </div>
      ) : (
        <div className="bg-slate-100/50 border border-slate-200/60 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-slate-100/50">
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4 text-left">Candidate Info</th>
                  <th className="px-6 py-4 text-left">Contact Channels</th>
                  <th className="px-6 py-4 text-left">Display Status</th>
                  <th className="px-6 py-4 text-left">Account Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center font-bold text-slate-200">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">{user.name}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" /> Registered: {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-350">
                          <Mail className="h-3.5 w-3.5 text-slate-500" /> {user.email}
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-1.5 text-slate-350">
                            <Phone className="h-3.5 w-3.5 text-slate-500" /> {user.phoneNumber}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getAppStatusColor(user.applicationStatus)}`}>
                        {user.applicationStatus}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAccountStatusBadge(user.status)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-white/5"
                          title="Inspect Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteUser(user._id, user.name)}
                            className="h-8 w-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete Account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-100/50 border border-slate-200/60 rounded-2xl px-6 py-4 backdrop-blur-xl">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 bg-slate-800 border border-white/5 rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 bg-slate-800 border border-white/5 rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Inspect/Edit Account Status Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-card/80 backdrop-blur-sm">
          <div className="bg-card border border-slate-200/60 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">
                  Candidate Credentials & Profile
                </span>
                <h3 className="font-heading text-lg font-black text-white">
                  Inspect User Details
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="h-8 w-8 rounded-full border border-white/5 flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-slate-900 transition-all cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold text-xl flex items-center justify-center shadow-lg">
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base leading-snug">{selectedUser.name}</h4>
                  <p className="text-xs text-slate-500">Member since {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-3 bg-card/40 border border-white/5 rounded-2xl p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Email</span>
                  <span className="text-slate-200 font-semibold">{selectedUser.email}</span>
                </div>
                {selectedUser.phoneNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Phone</span>
                    <span className="text-slate-200 font-semibold">{selectedUser.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">App Status</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getAppStatusColor(selectedUser.applicationStatus)}`}>
                    {selectedUser.applicationStatus}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Update Account Access Status
                </label>
                <select
                  value={accountStatus}
                  onChange={(e) => setAccountStatus(e.target.value as any)}
                  className="w-full bg-card border border-slate-200/60 rounded-xl px-4 py-3 text-slate-100 text-xs font-bold uppercase tracking-wider focus:border-primary outline-none cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <div className="flex gap-2 items-start bg-card/20 border border-white/5 rounded-xl p-3 mt-3 text-[10px] text-slate-500">
                  <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Changing the account status affects the user's ability to log in. Suspended users will be immediately locked out of the FMPG applicant platform.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-card/50 border-t border-white/5 flex justify-end gap-3 rounded-b-3xl">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border border-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="px-5 py-2 bg-primary hover:bg-primary/90 text-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
