import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { currentUser, isAdmin, isSuperAdmin, isHR, isEmployee, isUser } = useAuth();

  const hasPermission = (permissionName) => {
    if (!currentUser) return false;
    if (isSuperAdmin) return true;
    
    // Admins have all permissions by default unless restricted
    if (isAdmin) return true;

    // HR/Employees check specific permissions
    return !!(currentUser.permissions && currentUser.permissions[permissionName]);
  };

  const canAccessJob = (jobId) => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    
    if (isHR || isEmployee) {
      // Handle both object and string ID comparison
      return currentUser.assignedJobs && currentUser.assignedJobs.some(j => (j._id || j) === jobId);
    }
    return false;
  };

  return {
    hasPermission,
    isHR,
    isAdmin,
    isSuperAdmin,
    isEmployee,
    isUser,
    canAccessJob,
    role: currentUser?.role,
    department: currentUser?.department,
    permissions: currentUser?.permissions || {}
  };
};
