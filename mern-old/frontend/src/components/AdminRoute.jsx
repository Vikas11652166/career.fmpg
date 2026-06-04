import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/api';

import Loader from './common/Loader';

const AdminRoute = ({ children }) => {
  const { currentUser, loading, isAdmin, isHR } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullPage={true} text="Verifying Access..." />;
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

  // If user is logged in but not admin or hr, redirect to home page
  if (!isAdmin && !isHR) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
