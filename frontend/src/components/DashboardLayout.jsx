import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Bell, X, Check } from 'lucide-react';
import api from '../services/api';
import { authService } from '../services/auth';

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const [notifsRes, countRes] = await Promise.all([
                api.get('/auth/notifications'),
                api.get('/auth/notifications/unread-count')
            ]);
            setNotifications(notifsRes.data);
            setUnreadCount(countRes.data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        // Force refresh user profile to check for status updates (e.g. after payment)
        const syncUserProfile = async () => {
            try {
                const user = await authService.getProfile();
                // Update local storage is handled inside authService.getProfile
                // Dispatch a custom event to update other components if needed
                window.dispatchEvent(new Event('storage'));
            } catch (error) {
                console.error("Failed to sync user profile:", error);
            }
        };

        syncUserProfile();
        fetchNotifications();
        const interval = setInterval(() => {
            fetchNotifications();
            // syncUserProfile(); // Optional: Poll profile too?
        }, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    const deleteNotification = async (id, link) => {
        try {
            // Optimistic update to remove from UI immediately
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));

            // Call API to delete permanently
            await api.delete(`/auth/notifications/${id}`);

            // Navigate if link exists
            if (link) {
                navigate(link);
                setIsNotifOpen(false);
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
            fetchNotifications(); // Revert on error
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            {/* Header (Desktop & Mobile) */}
            <header className="lg:pl-64 fixed top-0 w-full h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 z-30 flex items-center justify-between px-4 lg:px-8 transition-colors">
                <div className="flex items-center">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 transition outline-none"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="lg:hidden ml-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                        DAK<span className="text-red-600">Plus</span>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition relative rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <Bell size={22} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {isNotifOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden z-50 transition-colors">
                                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                                    <button
                                        onClick={() => setIsNotifOpen(false)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        notifications.map(n => (
                                            <div
                                                key={n.id}
                                                className={`p-4 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer ${!n.read ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`}
                                                onClick={() => deleteNotification(n.id, n.link)}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${n.type === 'EXAM_COMPLETION' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                        {n.type?.replace('_', ' ')}
                                                    </span>
                                                    {!n.read && <div className="h-2 w-2 bg-red-600 rounded-full"></div>}
                                                </div>
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{n.title}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{n.message}</p>
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 block">
                                                    {new Date(n.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">No notifications yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 mt-16 p-4 lg:p-8 overflow-y-auto w-full transition-colors">
                <Outlet />
            </div>
        </div>
    );
}
