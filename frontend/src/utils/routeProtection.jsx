import React, { useEffect } from 'react';
import { Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

const RoleBasedRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" state={{ 
      from: location.pathname,
      role: user.role,
      requiredRoles: allowedRoles 
    }} replace />;
  }

  return children;
};

const AccessDenied = () => {
  const location = useLocation();
  const navigate = useNavigate();
    useEffect(() => {
    navigate('/dashboard');
  }, [navigate]);
    return null;
};

const NotFound = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [user, navigate]);
  
  return null;
};

export default {
  ProtectedRoute,
  RoleBasedRoute,
  AccessDenied,
  NotFound
};