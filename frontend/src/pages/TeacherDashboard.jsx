import { useEffect, useState, useCallback } from 'react';
import { testService } from '../services/test';
import { authService } from '../services/auth';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { PlusCircle, Layout, Users, TrendingUp, ExternalLink, Trash2, Edit, Search, X, Loader2 } from 'lucide-react';

export default function TeacherDashboard() {
    const [tests, setTests] = useState([]);
    const [displayedTests, setDisplayedTests] = useState([]);
    const [studentCount, setStudentCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [isSearchMode, setIsSearchMode] = useState(false);

    const loadTests = async () => {
        setLoading(true);
        try {
            await authService.getProfile();
            const data = await testService.getMyTests();
            setTests(data);
            setDisplayedTests(data);

            if (data.length > 0) {
                const testIds = data.map(t => t.id);
                const queryString = testIds.map(id => `testIds=${id}`).join('&');
                const countRes = await api.get(`/results/tests/unique-students?${queryString}`);
                setStudentCount(countRes.data.count);
            }
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTests();
    }, []);

    // Debounced search
    const handleSearch = useCallback(async (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setIsSearchMode(false);
            setDisplayedTests(tests);
            return;
        }
        setIsSearchMode(true);
        setSearching(true);
        try {
            const results = await testService.searchTestsByQuestionText(query.trim());
            setDisplayedTests(results);
        } catch (err) {
            console.error("Search failed:", err);
            setDisplayedTests([]);
        } finally {
            setSearching(false);
        }
    }, [tests]);

    // Debounce search calls (400ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== '') {
                handleSearch(searchQuery);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const clearSearch = () => {
        setSearchQuery('');
        setIsSearchMode(false);
        setDisplayedTests(tests);
    };

    const handleDelete = async (testId) => {
        if (window.confirm("Are you sure you want to delete this test? This action cannot be undone.")) {
            try {
                await testService.deleteTest(testId);
                loadTests();
            } catch (err) {
                alert("Failed to delete test: " + err.message);
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Instructor Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your tests and view student progress.</p>
                </div>
                <div className="flex flex-wrap gap-3 mt-4 md:mt-0 justify-end">
                    <Link to="/dashboard/manage-topics" className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 shadow-sm transition">
                        <TrendingUp className="h-4 w-4 mr-2" /> Topics
                    </Link>
                    <Link to="/dashboard/admin/syllabus" className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 shadow-sm transition">
                        <Layout className="h-4 w-4 mr-2" /> Syllabus
                    </Link>
                    <Link to="/dashboard/admin/reports" className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 shadow-sm transition">
                        <Users className="h-4 w-4 mr-2" /> Reports
                    </Link>
                    <Link to="/dashboard/student" className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 shadow-sm transition">
                        Switch to Student
                    </Link>
                    <Link to="/dashboard/create-test" className="flex items-center px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition font-medium">
                        <PlusCircle className="h-4 w-4 mr-2" /> Create Test
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center transition-colors">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4">
                        <Layout className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Active Tests</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{tests.length}</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center transition-colors">
                    <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mr-4">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Students</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{studentCount}</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center transition-colors">
                    <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mr-4">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Avg. Performance</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">76%</div>
                    </div>
                </div>
            </div>

            {/* Tests Panel with Global Search */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                {isSearchMode
                                    ? `Search Results (${displayedTests.length} tests found)`
                                    : 'Your Tests'}
                            </h3>
                            {isSearchMode && (
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                                    Searching across test titles, questions &amp; explanations (English + Hindi)
                                </p>
                            )}
                        </div>

                        {/* Global Search Bar */}
                        <div className="relative w-full sm:w-80">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                {searching
                                    ? <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                                    : <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                }
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search questions, topics, hints..."
                                className="w-full pl-10 pr-9 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            />
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading tests...
                    </div>
                ) : displayedTests.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        {isSearchMode ? (
                            <>
                                <Search className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                                <p className="font-medium">No tests found for "<span className="text-indigo-600 dark:text-indigo-400">{searchQuery}</span>"</p>
                                <p className="text-sm mt-1">Try a different keyword or <button onClick={clearSearch} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">clear search</button></p>
                            </>
                        ) : (
                            <>
                                <div className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4"><PlusCircle className="h-full w-full" /></div>
                                <p className="mb-4">You haven't created any tests yet.</p>
                                <Link to="/dashboard/create-test" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Create your first test</Link>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {displayedTests.map(test => (
                            <div key={test.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition flex flex-col sm:flex-row sm:items-center justify-between group">
                                <div className="flex-1 min-w-0 pr-4">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">{test.title}</h4>
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                                        <span>{test.category || 'General'}</span>
                                        <span>•</span>
                                        <span>{test.durationMinutes || test.duration_minutes} mins</span>
                                        <span>•</span>
                                        <span>{new Date(test.createdAt || Date.now()).toLocaleDateString()}</span>
                                        {test.questionCount > 0 && (
                                            <>
                                                <span>•</span>
                                                <span className={`font-bold ${test.enrichedCount === test.questionCount ? 'text-green-600' : 'text-amber-600'}`}>
                                                    {test.enrichedCount}/{test.questionCount} AI
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 mt-4 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link to={`/dashboard/edit-test/${test.id}`} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-white dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center transition-colors">
                                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                                    </Link>

                                    {(!test.isAiEnriched || (test.questionCount > 0 && test.enrichedCount < test.questionCount)) && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await testService.retryEnrichment(test.id);
                                                    alert("AI Enrichment started in background. Refresh in a few minutes.");
                                                } catch (e) {
                                                    alert("Failed to start enrichment: " + e.message);
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-md text-sm font-bold flex items-center transition-colors hover:bg-amber-100"
                                        >
                                            <TrendingUp className="h-3.5 w-3.5 mr-1" /> Complete AI
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDelete(test.id)}
                                        className="px-3 py-1.5 border border-red-200 dark:border-red-900/50 rounded-md text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center transition-colors"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                                    </button>
                                    <Link to={`/dashboard/take-test/${test.id}`} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center transition-colors">
                                        Preview <ExternalLink className="ml-1.5 h-3 w-3" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
