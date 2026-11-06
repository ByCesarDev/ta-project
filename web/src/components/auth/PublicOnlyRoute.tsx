import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (user) {
    // If user already has an active session, redirect to home or previously intended route
    const destination = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
};
