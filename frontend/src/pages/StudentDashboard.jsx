import { useEffect, useState } from 'react';
import { testService } from '../services/test';
import { authService } from '../services/auth';
import { Link, useNavigate } from 'react-router-dom';
import { PlayCircle, Clock, BarChart2, BookOpen, Search, History, Bell, GraduationCap, FileText, ClipboardList } from 'lucide-react';
import { resultService } from '../services/result';
import { topicService } from '../services/topic';
import CourseProgressBar from '../components/CourseProgressBar';

export default function StudentDashboard() {
    // Safely parse user from localStorage with defaults
    const getUserFromStorage = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return null;
            const user = JSON.parse(userStr);
            if (user && !user.subscriptionTier) {
                user.subscriptionTier = 'FREE';
            }
            return user;
        } catch (error) {
            console.error('Failed to parse user from localStorage:', error);
            return null;
        }
    };

    const [user, setUser] = useState(getUserFromStorage());
    const [tests, setTests] = useState([]);
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [subtopics, setSubtopics] = useState([]);
    const [selectedSubtopic, setSelectedSubtopic] = useState(null);
    const [history, setHistory] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [overallAccuracy, setOverallAccuracy] = useState(0);
    const [totalPoints, setTotalPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'purchased'
    const [purchases, setPurchases] = useState([]);
    const navigate = useNavigate();

    const isPro = user?.subscriptionTier === 'PREMIUM';

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // 1. Refresh profile
                const profileRes = await authService.getProfile();
                if (profileRes?.user) {
                    const localUser = getUserFromStorage();
                    const mergedUser = { ...profileRes.user };
                    if (localUser?.subscriptionTier === 'PREMIUM') mergedUser.subscriptionTier = 'PREMIUM';
                    else if (!mergedUser.subscriptionTier) mergedUser.subscriptionTier = 'FREE';
                    setUser(mergedUser);
                }

                // 2. Load Tests and Topics
                const [testsData, topicsData] = await Promise.all([
                    testService.getAvailableTests(),
                    topicService.getAllTopics()
                ]);
                setTests(testsData);
                setTopics(topicsData);

                // 3. Load Purchases
                const pData = await import('../services/payment').then(m => m.paymentService.getUserPurchases());
                setPurchases(pData);

            } catch (err) {
                console.error("Failed to load initial data", err);
                if (!user) navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        const loadAnalytics = async () => {
            try {
                const currentUser = user || getUserFromStorage();
                const userId = currentUser?.id || currentUser?._id;
                if (userId) {
                    const [results, lbData] = await Promise.all([
                        resultService.getResultsByUser(userId),
                        resultService.getLeaderboard('weekly')
                    ]);
                    setHistory(results);
                    setLeaderboard(lbData);
                    if (results.length > 0) {
                        const total = results.reduce((acc, curr) => acc + curr.percentage, 0);
                        setOverallAccuracy(Math.round(total / results.length));
                        const points = results.reduce((acc, curr) => acc + (curr.score || 0), 0);
                        setTotalPoints(points);
                    }
                }
            } catch (err) {
                console.error("Failed to load analytics", err);
            }
        };

        loadInitialData();
        loadAnalytics();
    }, []);

    const handleTopicClick = async (topicId) => {
        if (selectedTopic === topicId) {
            setSelectedTopic(null);
            setSubtopics([]);
            setSelectedSubtopic(null);
        } else {
            setSelectedTopic(topicId);
            const subData = await topicService.getSubtopics(topicId);
            setSubtopics(subData);
            setSelectedSubtopic(null);
        }
    };

    const purchasedIds = purchases.map(p => p.itemId);
    const completedTestsCount = new Set(history.map(h => h.testId || h.id)).size;
    const totalAvailableTests = tests.length || 0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors duration-300">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-red-600 to-blue-900 px-6 py-8 md:px-8 md:py-12 rounded-b-3xl shadow-xl">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-white">
                                    Hello, {user?.fullName?.split(' ')[0] || 'User'}
                                </h1>
                                {isPro && (
                                    <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded">
                                        PRO
                                    </span>
                                )}
                            </div>
                            <p className="text-white/80 text-sm">Student Dashboard</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 text-center">
                            <span className="block text-white/70 text-xs font-bold uppercase tracking-wider mb-1">Avg Accuracy</span>
                            <span className="text-2xl md:text-3xl font-black text-white">{overallAccuracy}%</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 text-center">
                            <span className="block text-white/70 text-xs font-bold uppercase tracking-wider mb-1">Tests Taken</span>
                            <span className="text-2xl md:text-3xl font-black text-white">{history.length}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 text-center">
                            <span className="block text-white/70 text-xs font-bold uppercase tracking-wider mb-1">Total Points</span>
                            <span className="text-2xl md:text-3xl font-black text-white">{totalPoints}</span>
                        </div>
                    </div>

                    {/* Quick Access */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white/30 transition border border-white/20">
                            <Bell className="text-white h-8 w-8 mb-2" />
                            <span className="text-white font-bold text-sm text-center">Updates</span>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white/30 transition border border-white/20">
                            <GraduationCap className="text-white h-8 w-8 mb-2" />
                            <span className="text-white font-bold text-sm text-center">Classes</span>
                        </div>
                        <div
                            onClick={() => document.getElementById('tests-section')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white/30 transition border border-white/20"
                        >
                            <ClipboardList className="text-white h-8 w-8 mb-2" />
                            <span className="text-white font-bold text-sm text-center">Exams</span>
                        </div>
                        <div
                            onClick={() => navigate('/dashboard/student/syllabus')}
                            className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white/30 transition border border-white/20"
                        >
                            <FileText className="text-white h-8 w-8 mb-2" />
                            <span className="text-white font-bold text-sm text-center">Syllabus</span>
                        </div>
                        <div
                            onClick={() => navigate('/dashboard/student/books')}
                            className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white/30 transition border border-white/20 hidden lg:flex"
                        >
                            <BookOpen className="text-white h-8 w-8 mb-2" />
                            <span className="text-white font-bold text-sm text-center">Books</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 md:px-8">
                {/* Premium Banner */}
                {!isPro && (
                    <div className="mb-6 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r from-amber-500 to-red-600 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-center md:text-left">
                            <h3 className="text-white text-xl font-bold mb-1">Unlock All Benefits</h3>
                            <p className="text-white/90 text-sm">Unlimited tests, detailed analysis & PRO badge</p>
                        </div>
                        <button
                            onClick={() => navigate('/payment')}
                            className="bg-white text-red-600 font-bold px-8 py-2 rounded-xl hover:bg-gray-100 transition shadow-lg w-full md:w-auto"
                        >
                            Upgrade Now
                        </button>
                    </div>
                )}

                {/* Topics */}
                <div className="mb-8 overflow-x-auto pb-4 flex gap-4 scrollbar-hide">
                    {topics.map(topic => (
                        <button
                            key={topic.id}
                            onClick={() => handleTopicClick(topic.id)}
                            className={`flex-shrink-0 px-6 py-3 rounded-2xl font-bold transition-all border-2 ${selectedTopic === topic.id ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-500'}`}
                        >
                            {topic.name}
                        </button>
                    ))}
                </div>

                {selectedTopic && subtopics.length > 0 && (
                    <div className="mb-8 flex flex-wrap gap-2">
                        {subtopics.map(sub => (
                            <button
                                key={sub.id}
                                onClick={() => setSelectedSubtopic(selectedSubtopic === sub.id ? null : sub.id)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${selectedSubtopic === sub.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                {sub.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Progress & Tests */}
                    <div className="lg:col-span-2 space-y-6">
                        <CourseProgressBar progress={completedTestsCount} total={totalAvailableTests} />

                        <div id="tests-section" className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Recommended Exams</h2>
                            <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-xl w-full md:w-auto transition-colors">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'all' ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setActiveTab('purchased')}
                                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'purchased' ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                >
                                    My Library
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center p-20">
                                <div className="animate-spin h-10 w-10 border-4 border-red-600 border-t-transparent rounded-full"></div>
                            </div>
                        ) : tests.length === 0 ? (
                            <div className="bg-white p-12 text-center rounded-2xl border-2 border-dashed border-gray-200">
                                <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">No tests available matching your selection.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {tests.filter(test => {
                                    const matchesTopic = !selectedTopic || test.topicId === selectedTopic;
                                    const matchesSubtopic = !selectedSubtopic || test.subtopicId === selectedSubtopic;
                                    const isPurchased = isPro || purchasedIds.includes(test.id);

                                    if (activeTab === 'purchased') {
                                        return isPurchased && matchesTopic && matchesSubtopic;
                                    }
                                    return matchesTopic && matchesSubtopic;
                                }).map(test => {
                                    const isPremium = test.premium || test.isPremium;
                                    const hasAccess = isPro || purchasedIds.includes(test.id);

                                    const handleStart = async () => {
                                        if (!isPremium || hasAccess) {
                                            navigate(`/dashboard/take-test/${test.id}`);
                                        } else {
                                            navigate(`/payment?testId=${test.id}`);
                                        }
                                    };

                                    return (
                                        <div key={test.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-500 hover:shadow-xl transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex gap-2">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${test.difficulty === 'Hard' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                                                        {test.difficulty || 'Normal'}
                                                    </span>
                                                    {isPremium && (
                                                        <span className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest">
                                                            PREMIUM
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center text-gray-400 dark:text-gray-500 text-xs gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {test.durationMinutes || 60}m
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                                {test.title}
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2">{test.description}</p>
                                            <div className="flex justify-between items-center pt-5 border-t border-gray-50 dark:border-gray-700">
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500">
                                                    <BookOpen className="w-3 h-3" />
                                                    {test.category || 'Standard'}
                                                </div>
                                                <button
                                                    onClick={handleStart}
                                                    className={`px-6 py-2 rounded-xl font-bold transition-all ${isPremium && !hasAccess ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white' : 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-red-200'}`}
                                                >
                                                    {isPremium && !hasAccess ? 'Unlock' : 'Start'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Leaderboard & Activity */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                                Weekly Rankings
                            </h2>
                            {leaderboard.length > 0 ? (
                                <div className="space-y-4">
                                    {leaderboard.slice(0, 5).map((entry, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-amber-400 text-white shadow-lg' : 'bg-white dark:bg-gray-600 text-gray-400 dark:text-gray-300 border border-gray-100 dark:border-gray-500'}`}>
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{entry.name}</p>
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">{entry.testsTaken} tests</p>
                                                </div>
                                            </div>
                                            <span className="font-black text-red-600 dark:text-red-400 text-sm">{entry.totalScore}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-400 dark:text-gray-500 text-sm italic">New cycle starting soon...</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                Last Attempts
                            </h2>
                            {history.length > 0 ? (
                                <div className="space-y-4">
                                    {history.slice(0, 5).map((h, i) => (
                                        <div key={i} className="flex flex-col gap-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{h.testTitle}</span>
                                                <span className={`text-sm font-black ${h.percentage >= 40 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {h.percentage}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${h.percentage >= 40 ? 'bg-green-500 dark:bg-green-400' : 'bg-red-500 dark:bg-red-400'}`}
                                                    style={{ width: `${h.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-400 dark:text-gray-500 text-sm italic">No history found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
