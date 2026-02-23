import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth'; // Ensure this path is correct

const InactivityHandler = ({ timeout = 15 * 60 * 1000 }) => { // 15 minutes default
    const timerRef = useRef(null);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch (e) {
            console.error("Logout failed", e);
        }
        navigate('/login');
        alert('You have been logged out due to inactivity.');
    };

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(handleLogout, timeout);
    };

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

        const handleActivity = () => {
            resetTimer();
        };

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        resetTimer(); // Start timer on mount

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [timeout, navigate]);

    return null; // This component doesn't render anything
};

export default InactivityHandler;
