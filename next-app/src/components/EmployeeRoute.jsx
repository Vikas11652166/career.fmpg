import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/api';
import Loader from './common/Loader';

const EmployeeRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullPage={true} text="Verifying Employee Access..." />;
  }

  // Check if token exists but is expired
  const token = localStorage.getItem('token');
  if (token && authService.isTokenExpired()) {
    authService.clearAuthData();
    return <Navigate to="/login" state={{ 
      message: "Your session has expired. Please login again.",
      from: location.pathname 
    }} />;
  }

  // If user is not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" state={{ 
      from: location.pathname 
    }} />;
  }

  // Strictly allow only users with 'employee' role
  // This excludes 'user', 'hr', 'admin', and 'super-admin'
  if (currentUser.role !== 'employee') {
    return <Navigate to="/" replace />;
  }

  // Check if employee is active or former (allowed to see profile/submit reviews)
  const isEligible = currentUser.status === 'active' || currentUser.status === 'former';
  if (!isEligible) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default EmployeeRoute;
