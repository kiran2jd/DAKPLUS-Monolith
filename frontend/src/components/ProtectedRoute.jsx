import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles) {
        const userRole = (user.role || '').toUpperCase();
        const normalizedAllowedRoles = allowedRoles.map(role => role.toUpperCase());

        if (!normalizedAllowedRoles.includes(userRole)) {
            // User logic for unauthorized access
            return <Navigate to="/" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
