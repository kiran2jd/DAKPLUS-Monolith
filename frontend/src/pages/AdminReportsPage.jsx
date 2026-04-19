import React, { useState, useEffect } from 'react';
import { Users, BookOpen, TrendingUp, Search, Filter, RefreshCw, AlertTriangle, CheckCircle2, Clock, MessageSquare, ChevronRight } from 'lucide-react';
import api from '../services/api';

export default function AdminReportsPage() {
    const [data, setData] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('performance'); // 'performance' or 'issues'
    const [filters, setFilters] = useState({
        circle: '',
        division: '',
        cadre: '',
        examType: ''
    });

    const fetchPerformanceData = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.circle) params.append('circle', filters.circle);
            if (filters.division) params.append('division', filters.division);
            if (filters.cadre) params.append('cadre', filters.cadre);
            if (filters.examType) params.append('examType', filters.examType);

            const response = await api.get(`/results/admin/summary?${params.toString()}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching admin reports:', error);
        }
    };

    const fetchReports = async () => {
        try {
            const response = await api.get('/reports');
            // Sort by latest first
            const sortedReports = (response.data || []).sort((a, b) => 
                new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            );
            setReports(sortedReports);
        } catch (error) {
            console.error('Error fetching question reports:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        if (activeTab === 'performance') {
            await fetchPerformanceData();
        } else {
            await fetchReports();
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [filters, activeTab]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'RESOLVED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200';
            case 'IGNORED': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200';
            default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200';
        }
    };

    const renderPerformanceTab = () => (
        <>
            {/* Filters Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 transition-colors">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postal Circle</label>
                    <select
                        name="circle"
                        value={filters.circle}
                        onChange={handleFilterChange}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    >
                        <option value="">All Circles</option>
                        {data?.circleWise?.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Division</label>
                    <select
                        name="division"
                        value={filters.division}
                        onChange={handleFilterChange}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    >
                        <option value="">All Divisions</option>
                        {data?.divisionWise?.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cadre</label>
                    <select
                        name="cadre"
                        value={filters.cadre}
                        onChange={handleFilterChange}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    >
                        <option value="">All Cadres</option>
                        {data?.cadreWise?.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exam Type</label>
                    <select
                        name="examType"
                        value={filters.examType}
                        onChange={handleFilterChange}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    >
                        <option value="">All Exams</option>
                        {data?.examTypeWise?.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center transition-colors">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 mr-4">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Total Tests</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.totalTests?.toLocaleString() || 0}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center transition-colors">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400 mr-4">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Avg. Accuracy</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.averageAccuracy || 0}%</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center transition-colors">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400 mr-4">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Avg. Score</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.averageScore || 0}</p>
                    </div>
                </div>
            </div>

            {/* Detailed Breakdown Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                        <Filter className="h-5 w-5 text-indigo-600" />
                        <span>Performance by Circle</span>
                    </h3>
                    <div className="space-y-4">
                        {data?.circleWise?.length > 0 ? data.circleWise.map(circle => (
                            <div key={circle.name} className="flex flex-col space-y-1">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-gray-700 dark:text-gray-300">{circle.name}</span>
                                    <span className="text-gray-500 dark:text-gray-400">{circle.count} tests ({circle.averageAccuracy}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${circle.averageAccuracy}%` }}
                                    ></div>
                                </div>
                            </div>
                        )) : <p className="text-gray-400 dark:text-gray-500 text-center py-8">No circle-wise data available.</p>}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        <span>Performance by Cadre</span>
                    </h3>
                    <div className="space-y-4">
                        {data?.cadreWise?.length > 0 ? data.cadreWise.map(cadre => (
                            <div key={cadre.name} className="flex flex-col space-y-1">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-gray-700 dark:text-gray-300">{cadre.name}</span>
                                    <span className="text-gray-500 dark:text-gray-400">{cadre.count} tests ({cadre.averageAccuracy}%)</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${cadre.averageAccuracy}%` }}
                                    ></div>
                                </div>
                            </div>
                        )) : <p className="text-gray-400 dark:text-gray-500 text-center py-8">No cadre-wise data available.</p>}
                    </div>
                </div>
            </div>
        </>
    );

    const renderIssuesTab = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Student Reported Issues
                    </h3>
                </div>

                {loading && reports.length === 0 ? (
                    <div className="p-12 text-center text-gray-500"><RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" /> Loading reports...</div>
                ) : reports.length === 0 ? (
                    <div className="p-16 text-center">
                        <CheckCircle2 className="h-16 w-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Clean Slate!</p>
                        <p className="text-gray-400 dark:text-gray-500">No question issues have been reported yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {reports.map((report) => (
                            <div key={report.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition group">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyles(report.status)}`}>
                                                {report.status}
                                            </span>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-md">
                                                ID: {report.questionId?.substring(0, 8)}...
                                            </span>
                                        </div>

                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                {report.reason?.replace(/_/g, ' ')}
                                            </h4>
                                            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm leading-relaxed flex items-start gap-2 italic bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border-l-4 border-indigo-200 dark:border-indigo-800">
                                                <MessageSquare className="h-4 w-4 mt-1 text-gray-400 shrink-0" />
                                                "{report.comment || 'No specific comment provided.'}"
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                            <span>Reported by: <span className="text-gray-900 dark:text-gray-300">{report.userName || 'Anonymous'}</span></span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-row md:flex-col gap-2 shrink-0 self-center md:self-start">
                                        <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition flex items-center gap-2">
                                            View Question <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                    <span className="font-bold">Pro-tip:</span> Use these reports to refine your AI extraction prompts. Frequent "Wrong Option" reports often indicate that the AI needs more context about a specific exam format.
                </p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 pb-12">
            {/* Header Area */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 pt-12 pb-6 px-6 md:px-12 mb-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">System Intel</h1>
                        <p className="text-gray-500 dark:text-gray-400">Holistic performance monitoring and issue tracking.</p>
                    </div>
                    
                    <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1.5 rounded-xl shadow-inner inline-flex">
                        <button
                            onClick={() => setActiveTab('performance')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'performance' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Performance
                        </button>
                        <button
                            onClick={() => setActiveTab('issues')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'issues' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Question Issues
                            {reports.filter(r => r.status === 'PENDING').length > 0 && (
                                <span className="flex h-2 w-2 rounded-full bg-amber-500"></span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-12">
                {activeTab === 'performance' ? renderPerformanceTab() : renderIssuesTab()}
            </div>
        </div>
    );
}
