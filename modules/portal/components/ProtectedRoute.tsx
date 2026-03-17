
import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePortalAuth } from '../../../contexts/PortalAuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated } = usePortalAuth();

    if (!isAuthenticated) {
        return <Navigate to="/portal/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
