import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    
    // SYNC TOKEN FROM URL (Mobile WebView Support)
    // If the URL contains a token (e.g. from mobile redirection), save it to localStorage immediately
    const queryParams = new URLSearchParams(location.search);
    const urlToken = queryParams.get('token');
    const urlUserId = queryParams.get('userId');

    if (urlToken) {
        localStorage.setItem('token', urlToken);
        // Force update user if userId from URL is different or missing locally
        const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (urlUserId && existingUser.id !== urlUserId) {
            localStorage.setItem('user', JSON.stringify({ id: urlUserId, role: 'student' }));
        }
    }

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
