import { useState, useEffect } from 'react';
import { User, Mail, Shield, BookOpen, Award, Settings, Camera, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resultService } from '../services/result';
import { paymentService } from '../services/payment';
import logo from '../assets/logo.jpg';

export default function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [results, setResults] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalTests: 0,
        avgScore: 0,
        passedCount: 0
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            loadHistory(parsedUser.id);
        } else {
            setLoading(false);
        }
    }, []);

    const loadHistory = async (userId) => {
        try {
            const [resultsData, transactionsData] = await Promise.all([
                resultService.getResultsByUser(userId),
                paymentService.getUserPurchases()
            ]);
            setResults(resultsData);
            setTransactions(transactionsData);
            calculateStats(resultsData);
        } catch (err) {
            console.error("Failed to load history", err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        if (!data || data.length === 0) return;

        const total = data.length;
        const totalScore = data.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
        const passed = data.filter(r => r.percentage >= 40).length;

        setStats({
            totalTests: total,
            avgScore: Math.round(totalScore / total),
            passedCount: passed
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    if (loading) return <div className="p-8">Loading profile...</div>;
    if (!user) return <div className="p-8">Please log in to view profile.</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header / Banner */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
                <div className="px-8 pb-8 flex flex-col md:flex-row items-start md:items-end -mt-12 space-y-4 md:space-y-0">
                    <div className="relative">
                        <div className="h-24 w-24 rounded-full bg-white p-1 shadow-lg overflow-hidden">
                            <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                        </div>
                    </div>

                    <div className="md:ml-6 flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">{user.fullName || 'User'}</h1>
                        <p className="text-gray-500 flex items-center mt-1">
                            <Mail className="h-4 w-4 mr-1" /> {user.email}
                            <span className="mx-2">•</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                {user.role ? user.role.toLowerCase() : 'Student'}
                            </span>
                        </p>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 font-medium flex items-center"
                        >
                            <LogOut className="h-4 w-4 mr-2" /> Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Stats & Info */}
                <div className="space-y-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Award className="h-5 w-5 text-indigo-600 mr-2" /> Performance Overview
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-600">Total Tests Taken</span>
                                <span className="font-bold text-gray-900">{stats.totalTests}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-600">Average Score</span>
                                <span className="font-bold text-green-600">{stats.avgScore}%</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-600">Tests Passed</span>
                                <span className="font-bold text-gray-900">{stats.passedCount}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Activity / Content */}
                <div className="md:col-span-2 space-y-8">
                    {/* Recent Test Activity */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Test Activity</h2>

                        {results.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No tests taken yet.</p>
                        ) : (
                            <div className="space-y-6">
                                {results.slice(0, 5).map((result) => (
                                    <div key={result.id} className="flex items-start border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
                                                <BookOpen className="h-5 w-5 text-indigo-600" />
                                            </div>
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <div className="flex justify-between">
                                                <h4 className="text-gray-900 font-medium">{result.testTitle || 'Test'}</h4>
                                                <span className="text-sm text-gray-400">
                                                    {new Date(result.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className="text-sm text-gray-500">
                                                    Score: <span className={result.percentage >= 40 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                                        {result.percentage}%
                                                    </span>
                                                </p>
                                                <button
                                                    onClick={() => navigate(`/dashboard/result/${result.id}`)}
                                                    className="text-indigo-600 text-sm hover:underline"
                                                >
                                                    View Result
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Purchase History Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <Shield className="h-5 w-5 text-green-600 mr-2" /> Purchase History
                        </h2>
                        {transactions.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No transactions found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-gray-500">
                                            <th className="pb-3 font-medium">Date</th>
                                            <th className="pb-3 font-medium">Item</th>
                                            <th className="pb-3 font-medium">Amount</th>
                                            <th className="pb-3 font-medium">Status</th>
                                            <th className="pb-3 font-medium text-right">Order ID</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((tx) => (
                                            <tr key={tx.orderId || tx.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                                                <td className="py-4 text-gray-600">
                                                    {new Date(tx.createdAt || Date.now()).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 font-medium text-gray-900">
                                                    {tx.itemType === 'SUBSCRIPTION' ? 'Premium Plan' : 'Individual Test'}
                                                </td>
                                                <td className="py-4 text-gray-900 font-bold">
                                                    ₹{tx.amount}
                                                </td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${tx.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {tx.status?.toUpperCase() || 'SUCCESS'}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right text-gray-400 text-xs font-mono">
                                                    {tx.orderId}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
