import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { currentUser, isAdmin, isSuperAdmin, isHR } = useAuth();

  const hasPermission = (permissionName) => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    if (isHR) {
      return !!(currentUser.permissions && currentUser.permissions[permissionName]);
    }
    return false;
  };

  const getIsHR = () => isHR;
  const getIsAdmin = () => isAdmin;
  const getIsSuperAdmin = () => isSuperAdmin;

  const canAccessJob = (jobId) => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    if (isHR) {
      // Handle both object and string ID comparison
      return currentUser.assignedJobs && currentUser.assignedJobs.some(j => (j._id || j) === jobId);
    }
    return false;
  };

  return {
    hasPermission,
    isHR: getIsHR,
    isAdmin: getIsAdmin,
    isSuperAdmin: getIsSuperAdmin,
    canAccessJob,
    role: currentUser?.role,
    department: currentUser?.department,
    permissions: currentUser?.permissions || {}
  };
};
