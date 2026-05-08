import { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { jobService, applicationService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getImageUrl, getFirstLetterFallback } from '../utils/imageUtils';
import { formatCurrencyValue } from '../utils/currencyUtils';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { setCache, getCache } from '../utils/cache';
import { toast } from 'react-toastify';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
   
  const { currentUser, isAdmin, isHR } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [animateList, setAnimateList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState(window.innerWidth < 640 ? 'compact' : 'detailed');
  const [isScrolling, setIsScrolling] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef(null);

  // States for confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  const enrichJobsWithApplicationStatus = async (jobsList) => {
    if (!currentUser || currentUser.role !== 'user' || !Array.isArray(jobsList) || jobsList.length === 0) {
      return jobsList;
    }

    try {
      const jobIds = jobsList.map((job) => job._id);
      const statusResponse = await applicationService.checkMultipleApplicationStatuses(jobIds);
      const statuses = statusResponse.data?.statuses || {};

      return jobsList.map((job) => ({
        ...job,
        applicationStatus: statuses[job._id]?.status || null
      }));
    } catch {
      // Keep job listing usable if batch status lookup fails.
      return jobsList.map((job) => ({ ...job, applicationStatus: null }));
    }
  };

  // Handle window resize for responsive view mode
  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 640 ? 'compact' : 'detailed');
      // Collapse search on resize to larger screens
      if (window.innerWidth > 768 && searchExpanded) {
        setSearchExpanded(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [searchExpanded]);

  // Focus search input when expanded
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  // Click outside to collapse search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchExpanded && searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        // Check if the click was on the search toggle button
        const isSearchToggleClick = event.target.closest('[data-search-toggle]');
        if (!isSearchToggleClick) {
          setSearchExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchExpanded]);

  // Add scroll listener for enhanced UI experiences
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle success message from application submission
  useEffect(() => {
    if (location.state?.success && location.state?.message) {
      toast.success(location.state.message);
      
      // Clear the location state
      navigate('.', { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (!loading && jobs.length > 0) {
      setAnimateList(true);
    }
  }, [loading, jobs]);

  // Simulate loading progress for better UX
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);

      return () => {
        clearInterval(interval);
        setLoadingProgress(100);
      };
    }
  }, [loading]);

  const loadJobs = async () => {
    setLoading(true);
    setLoadingProgress(0);

    const cachedJobs = getCache('jobs');
    if (cachedJobs && Array.isArray(cachedJobs) && cachedJobs.length > 0 && cachedJobs.every(j => j.slug)) {
      const cachedJobsWithStatus = await enrichJobsWithApplicationStatus(cachedJobs);
      setJobs(cachedJobsWithStatus);
      setLoading(false);
      setAnimateList(true);
      return;
    }

    try {
      const response = await jobService.getAllJobs();
      const jobsWithStatus = await enrichJobsWithApplicationStatus(response.data);
      setJobs(jobsWithStatus);
      setCache('jobs', jobsWithStatus, 300000); // Cache for 5 minutes
      setAnimateList(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error loading jobs');
    } finally {
      setLoading(false);
    }
  };



  const getApplicationStatusInfo = (job) => {
    const { applicationStatus } = job;
    if (!applicationStatus) {
      return { hasApplied: false, canApply: true };
    }

    return {
      hasApplied: true,
      canApply: applicationStatus === 'rejected',
      status: applicationStatus
    };
  };

  const renderApplyButton = (job, isCompact = false) => {
    const statusInfo = getApplicationStatusInfo(job);

    if (!statusInfo.hasApplied) {
      // User hasn't applied yet
      return (
        <button
          className={`bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white ${isCompact ? 'px-4 py-2' : 'px-8 py-3 w-full'} rounded-lg font-medium transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 shadow-lg hover:shadow-yellow-600/20 flex items-center justify-center gap-2`}
          onClick={(e) => {
            if (isCompact) e.stopPropagation();
            handleApply(job);
          }}
        >
          <svg className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCompact ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z"} />
          </svg>
          {isCompact ? 'Apply Now' : 'Apply for this Position'}
        </button>
      );
    } else if (statusInfo.canApply) {
      // User can reapply (previous application was rejected)
      return (
        <button
          className={`bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-500 hover:to-orange-600 text-white ${isCompact ? 'px-4 py-2' : 'px-8 py-3 w-full'} rounded-lg font-medium transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 shadow-lg hover:shadow-orange-600/20 flex items-center justify-center gap-2`}
          onClick={(e) => {
            if (isCompact) e.stopPropagation();
            handleApply(job);
          }}
        >
          <svg className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isCompact ? 'Apply Again' : 'Apply Again'}
        </button>
      );
    } else {
      // User has applied and cannot apply again
      return (
        <button
          className={`bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 ${isCompact ? 'px-4 py-2' : 'px-8 py-3 w-full'} rounded-lg font-medium cursor-not-allowed opacity-75 flex items-center justify-center gap-2`}
          disabled
        >
          <svg className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Applied ({statusInfo.status})
        </button>
      );
    }
  };


  const handleEdit = (jobOrId) => {
    const identifier = typeof jobOrId === 'object' ? (jobOrId.slug || jobOrId._id) : jobOrId;
    navigate(`/jobs/edit/${identifier}`);
  };

  const handleAdd = () => {
    navigate('/jobs/create');
  };

  const handleDelete = async (id) => {
    const jobTitle = jobs.find(job => job._id === id)?.title || 'this job';
    setJobToDelete({ id, title: jobTitle });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;

    try {
      await jobService.deleteJob(jobToDelete.id);
      setJobs(jobs.filter(job => job._id !== jobToDelete.id));

      // Show success message (get title BEFORE clearing jobToDelete)
      toast.success(`Job "${jobToDelete.title}" deleted successfully`);

      setShowDeleteModal(false);
      setJobToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || `Error deleting job with ID: ${jobToDelete.id}`);
      setShowDeleteModal(false);
      setJobToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setJobToDelete(null);
  };

  const handleApply = async (job) => {
    // Check if user has already applied
    const appStatus = getApplicationStatusInfo(job);
    if (appStatus.hasApplied && !appStatus.canApply) {
      toast.error(`You have already applied for this job. Current status: ${appStatus.status}. You can only apply again if your application is rejected.`);
      return;
    }

    navigate(`/apply/${job.slug || job._id}`);
  };

  const handleViewApplications = (jobId) => {
    const job = jobs.find((item) => item._id === jobId);
    const identifier = job?.slug || jobId;
    navigate(`/jobs/edit/${identifier}?tab=applications`);
  };

  const filteredJobs = jobs.filter(job =>
    (job.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (job.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (job.location?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ).filter(job =>
    filterType ? job.type === filterType : true
  ).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortBy === 'salary-high') {
      const salaryA = parseFloat(a.salary?.replace(/[^0-9.-]+/g, '')) || 0;
      const salaryB = parseFloat(b.salary?.replace(/[^0-9.-]+/g, '')) || 0;
      return salaryB - salaryA;
    } else if (sortBy === 'salary-low') {
      const salaryA = parseFloat(a.salary?.replace(/[^0-9.-]+/g, '')) || 0;
      const salaryB = parseFloat(b.salary?.replace(/[^0-9.-]+/g, '')) || 0;
      return salaryA - salaryB;
    }
    return 0;
  });

  const jobTypes = [...new Set(jobs.map(job => job.type))];

  // Check if a job was posted within the last 7 days
  const isNewJob = (createdAt) => {
    const jobDate = new Date(createdAt);
    const today = new Date();
    const diffTime = Math.abs(today - jobDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  return (
    <div className="container mx-auto px-4 pt-20 max-w-7xl min-h-screen">
      <Helmet>
        <title>Remote Jobs & Careers | FMPG</title>
        <meta name="description" content="Browse open job positions at FMPG. Find roles in property management, design, digital marketing, and management. Apply today to build your career." />
        <link rel="canonical" href="https://fmpg.vercel.app/jobs" />
      </Helmet>

      {/* Hero Section with Background Image */}
      <div className="relative mb-6 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-purple-900/80 to-gray-900/90 z-10 opacity-80"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d')] bg-cover bg-center opacity-40"></div>
        <div className="relative z-20 px-6 py-6 md:py-12 text-center">
          <h1 className="text-2xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 mb-4 drop-shadow-lg">
            Discover Your Dream Career
          </h1>
          <p className="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            Explore exciting job opportunities tailored for your skills and ambitions
          </p>

          {/* Search Box in Hero */}
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search for job titles, companies or locations..."
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-full py-3 px-6 pl-12 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent transition-all duration-300 shadow-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="w-5 h-5 absolute left-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  className="absolute right-4 text-gray-300 hover:text-white focus:outline-none"
                  onClick={() => setSearchTerm('')}
                >
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Job Count & Filter Section */}
      <div className="flex flex-row items-center justify-between mb-6 px-1 gap-2">
        <div className="flex items-center flex-shrink-0">
          <span className="text-white text-[11px] sm:text-sm font-medium">Showing</span>
          <span className="mx-1.5 bg-yellow-500/20 text-yellow-400 text-[11px] sm:text-sm font-bold px-2 py-0.5 rounded-full">
            {filteredJobs.length}
          </span>
          <span className="text-white text-[11px] sm:text-sm font-medium hidden sm:inline">job opportunities</span>
          <span className="text-white text-[11px] sm:text-sm font-medium sm:hidden">Jobs</span>
        </div>



        
        <div className="flex items-center gap-2 ml-auto">
          {/* Inline filters - Right aligned */}
          <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-gray-700/30 mr-1">
            <div className="relative group">
              <select
                className="appearance-none bg-gray-800/30 border border-gray-700/30 rounded-lg px-2 py-1 text-[10px] text-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-500/30 transition-all hover:bg-gray-700/30 cursor-pointer min-w-[110px] pr-6"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                {[...new Set(jobs.map(job => job.type))].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-yellow-500/50">
                <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="relative group">
              <select
                className="appearance-none bg-gray-800/30 border border-gray-700/30 rounded-lg px-2 py-1 text-[10px] text-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-500/30 transition-all hover:bg-gray-700/30 cursor-pointer min-w-[100px] pr-6"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="salary-high">Salary: High</option>
                <option value="salary-low">Salary: Low</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-yellow-500/50">
                <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3z" />
                </svg>
              </div>
            </div>
          </div>

          {currentUser && (isAdmin || (isHR && currentUser?.permissions?.canCreateJob)) && (
            <button
              onClick={handleAdd}
              className="bg-green-600/80 hover:bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-md active:scale-95 sm:mr-1"
            >
              <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Post Job
            </button>
          )}

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white text-[10px] hover:bg-white/10 transition-all backdrop-blur-md active:scale-95 group"
          >
            <svg className={`w-3 h-3 ${showFilters ? 'text-yellow-400' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-semibold uppercase tracking-wide">Filters</span>
          </button>
        </div>
      </div>


      {/* Jobs listing section */}
      <div className="w-full space-y-6">
        {loading ? (
          <div className="bg-gradient-to-r from-gray-900/95 to-gray-800/95 rounded-xl overflow-hidden shadow-xl border border-gray-700/50 backdrop-blur-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg className="animate-spin w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-green-400">Loading Jobs...</span>
              </h2>
              <div className="w-24 bg-gray-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-600 transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden p-5 animate-pulse">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 flex gap-4">
                      <div className="hidden sm:block h-16 w-16 bg-gray-700 rounded-lg"></div>
                      <div className="w-full">
                        <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-700 rounded w-1/6"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center justify-end">
                      <div className="h-9 bg-gray-700 rounded-lg w-24"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (filteredJobs.length === 0) ? (
          <div className="bg-gradient-to-r from-gray-900/95 to-gray-800/95 rounded-xl overflow-hidden shadow-xl border border-gray-700/50 backdrop-blur-md p-10">
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <svg className="w-20 h-20 mb-6 text-gray-600 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-xl font-medium text-white mb-2">No matching jobs found</h3>
              <p className="text-gray-400 text-center max-w-md">Try adjusting your search criteria or browse all available positions</p>
              <button
                onClick={() => { setSearchTerm(''); setFilterType(''); }}
                className="mt-6 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 flex items-center gap-2"
              >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredJobs.map((job, index) => (
              <div
                key={job._id}
                className={`bg-gradient-to-r from-gray-900/95 to-gray-800/90 border border-gray-700/50 hover:border-gray-600/70 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl shadow-lg ${animateList ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div>
                  <div
                    className="p-5 flex md:flex-row justify-between gap-4 relative"
                  >
                    {isNewJob(job.createdAt) && (
                      <div className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-md transform rotate-2 z-10">
                        NEW
                      </div>
                    )}
                    <div className="flex-1 flex gap-5">
                      {job.imageUrl ? (
                        <div className="hidden sm:block">
                          <div className="h-20 w-20 rounded-lg overflow-hidden shadow-md bg-gradient-to-br from-gray-800 to-gray-700 p-1">
                            <img
                              src={getImageUrl(job.imageUrl)}
                              alt={job.title}
                              className="h-full w-full object-cover rounded-md transition-transform duration-500 hover:scale-110"
                              onError={(e) => {
                                const letterDiv = document.createElement('div');
                                letterDiv.className = "h-full w-full flex items-center justify-center text-white text-2xl font-bold rounded-md";
                                letterDiv.innerText = getFirstLetterFallback(job.title);
                                e.target.parentNode.appendChild(letterDiv);
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="hidden sm:flex h-20 w-20 items-center justify-center bg-gray-500 text-white text-2xl font-bold rounded-lg shadow-md">
                          {getFirstLetterFallback(job.title)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white hover:text-yellow-400 transition-colors duration-300 flex items-center group">
                          {job.title}
                          <svg className="w-5 h-5 ml-2 text-gray-400 group-hover:text-yellow-400 transition-transform duration-300 group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </h3>
                        <div className="flex flex-wrap gap-3 items-center mt-2 text-sm">
                          <span className="flex items-center text-gray-300 hover:text-white transition-colors duration-300 group">
                            <svg className="w-4 h-4 mr-1.5 text-yellow-500 group-hover:text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {job.company}
                          </span>
                          <span className="flex items-center text-gray-300 hover:text-white transition-colors duration-300 group">
                            <svg className="w-4 h-4 mr-1.5 text-yellow-500 group-hover:text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {job.location}
                          </span>
                          {job.salary && (
                            <span className="flex items-center text-emerald-400 hover:text-emerald-300 transition-colors duration-300 group">
                              <svg className="w-4 h-4 mr-1.5 text-emerald-500 group-hover:text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatCurrencyValue(job.salary)}
                            </span>
                          )}
                          {job.type && (
                            <span className="bg-gray-800/80 px-3 py-1 text-sm text-yellow-400 rounded-full border border-yellow-500/30 shadow-sm">
                              {job.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      {currentUser && currentUser.role === 'user' && (
                        <div className="hidden md:block">
                          {renderApplyButton(job, true)}
                        </div>
                      )}
                      {currentUser && (isAdmin || (isHR && currentUser.assignedJobs?.some(j => (j._id || j) === job._id))) && (
                        <div className="hidden md:flex gap-2">
                          <button
                            className="bg-blue-900/80 hover:bg-blue-800 text-white px-3 py-2 rounded-lg transition duration-300 ease-in-out flex items-center gap-1 hover:shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewApplications(job._id);
                            }}
                            title="View applications"
                          >
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="hidden sm:inline ml-1">Applications</span>
                          </button>
                          <button
                            className="bg-amber-900/80 hover:bg-amber-800 text-white px-3 py-2 rounded-lg transition duration-300 ease-in-out flex items-center gap-1 hover:shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(job._id); // Pass just ID
                            }}
                            title="Edit job"
                          >
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="hidden sm:inline ml-1">Edit</span>
                          </button>
                          {isAdmin && (
                            <button
                              className="bg-red-900/80 hover:bg-red-800 text-white px-3 py-2 rounded-lg transition duration-300 ease-in-out flex items-center gap-1 hover:shadow-md"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(job._id);
                              }}
                              title="Delete job"
                            >
                              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="hidden sm:inline ml-1">Delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile bottom section with full-width apply button */}
                  <div className="md:hidden border-t border-gray-700/50 px-5 py-4">
                    <div className="flex flex-col gap-3">
                      {currentUser && currentUser.role === 'user' && (
                        <div className="w-full">
                          {renderApplyButton(job, false)}
                        </div>
                      )}
                      {currentUser && (isAdmin || (isHR && currentUser.assignedJobs?.some(j => (j._id || j) === job._id))) && (
                        <div className="flex gap-2 justify-center">
                          <button
                            className="bg-blue-900/80 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition duration-300 ease-in-out flex items-center gap-1 hover:shadow-md flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewApplications(job._id);
                            }}
                            title="View applications"
                          >
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="ml-1">Applications</span>
                          </button>
                          <button
                            className="bg-amber-900/80 hover:bg-amber-800 text-white px-4 py-2 rounded-lg transition duration-300 ease-in-out flex items-center gap-1 hover:shadow-md flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(job._id);
                            }}
                            title="Edit job"
                          >
                            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="ml-1">Edit</span>
                          </button>
                          {isAdmin && (
                            <button
                              className="bg-red-900/80 hover:bg-red-800 text-white px-4 py-2 rounded-lg transition duration-300 ease-in-out flex items-center gap-1 hover:shadow-md flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(job._id);
                              }}
                              title="Delete job"
                            >
                              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="ml-1">Delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {!currentUser && (
          <div className="bg-gradient-to-r from-yellow-900/40 to-amber-900/30 border border-yellow-600/50 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-1">Ready to apply for your dream job?</h3>
                <p className="text-yellow-100">Sign in to your account or create a new one to start your career journey.</p>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/login"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Job"
        message={`Are you sure you want to delete "${jobToDelete?.title}"? This action cannot be undone and will permanently remove the job posting and all associated applications.`}
        confirmText="Delete Job"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        cancelButtonClass="bg-gray-600 hover:bg-gray-700 text-white"
        type="danger"
      />
      {/* Mobile Filter Modal - Premium Glassmorphism */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-[100] flex items-end justify-center p-0">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500 animate-in fade-in"
            onClick={() => setShowFilters(false)}
          ></div>
          
          <div className="relative w-full max-w-2xl bg-gray-950/90 backdrop-blur-3xl rounded-t-[2.5rem] border-t border-white/10 shadow-[0_-20px_80px_rgba(0,0,0,0.9)] p-5 pb-6 transform transition-all duration-500 ease-out animate-in slide-in-from-bottom-full h-auto max-h-[60vh] overflow-y-auto overflow-x-hidden flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Modal Drag Indicator */}
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-4 shrink-0"></div>
            
            <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="text-xl font-black text-white tracking-tight uppercase italic italic">
                Refine <span className="text-[#a3c614]">Jobs</span>
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setFilterType('');
                    setSortBy('newest');
                  }}
                  className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                >
                  Reset
                </button>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="p-2 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all active:scale-90"
                >
                  <svg className="w-4 h-4 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="space-y-6 flex-1 px-1">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 ml-1">Job Category</label>
                <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <button
                    onClick={() => setFilterType('')}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 border ${filterType === '' ? 'bg-[#a3c614] text-black border-[#a3c614] shadow-lg shadow-[#a3c614]/20' : 'bg-white/5 text-gray-500 border-white/5'}`}
                  >
                    All Types
                  </button>
                  {[...new Set(jobs.map(job => job.type))].map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`flex-shrink-0 px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 border ${filterType === type ? 'bg-[#a3c614] text-black border-[#a3c614] shadow-lg shadow-[#a3c614]/20' : 'bg-white/5 text-gray-500 border-white/5'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 ml-1">Sorting Priority</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'newest', label: 'Newest' },
                    { id: 'oldest', label: 'Oldest' },
                    { id: 'salary-high', label: 'Highest Salary' },
                    { id: 'salary-low', label: 'Lowest Salary' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id)}
                      className={`flex items-center justify-center px-3 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 border ${sortBy === option.id ? 'bg-white/10 text-[#a3c614] border-[#a3c614]/30 shadow-[0_5px_15px_rgba(163,198,20,0.15)]' : 'bg-white/5 text-gray-500 border-white/5'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-8 shrink-0">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full bg-[#a3c614] hover:bg-[#bde02e] text-black text-[9px] font-black uppercase tracking-[0.4em] py-4 rounded-2xl shadow-[0_15px_30px_rgba(163,198,20,0.3)] active:scale-[0.98] transition-all duration-500"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;