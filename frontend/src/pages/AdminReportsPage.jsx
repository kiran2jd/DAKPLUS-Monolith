import React, { useState, useEffect } from 'react';
import { Users, BookOpen, TrendingUp, Search, Filter, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function AdminReportsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        circle: '',
        division: '',
        cadre: '',
        examType: ''
    });

    const fetchData = async () => {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    if (loading && !data) {
        return <div className="p-12 text-center text-gray-500 flex items-center justify-center space-x-2">
            <RefreshCw className="animate-spin h-5 w-5" />
            <span>Loading system reports...</span>
        </div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-12 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Reports</h1>
                        <p className="text-gray-500 dark:text-gray-400">System-wide statistics and performance metrics.</p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center space-x-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>

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
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                <BookOpen className="h-6 w-6" />
                            </div>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Tests Evaluated</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{data?.totalTests?.toLocaleString() || 0}</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Avg. System Accuracy</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{data?.averageAccuracy || 0}%</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                                <Users className="h-6 w-6" />
                            </div>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Avg. Score</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{data?.averageScore || 0}</p>
                    </div>
                </div>

                {/* Detailed Breakdown Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                            <Filter className="h-5 w-5 text-primary" />
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
                                            className="bg-primary h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${circle.averageAccuracy}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )) : <p className="text-gray-400 dark:text-gray-500 text-center py-8">No circle-wise data available.</p>}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
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
                                            className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${cadre.averageAccuracy}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )) : <p className="text-gray-400 dark:text-gray-500 text-center py-8">No cadre-wise data available.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
