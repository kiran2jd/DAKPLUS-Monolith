import React from 'react';

export default function CourseProgressBar({ progress, total }) {
    const percentage = Math.min(100, Math.round((progress / total) * 100)) || 0;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Your Progress</h3>
                    <p className="text-sm text-gray-500">Keep going! You are doing great.</p>
                </div>
                <span className="text-2xl font-bold text-indigo-600">{percentage}%</span>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium">
                <span>{progress} Completed</span>
                <span>{total} Total Tests</span>
            </div>
        </div>
    );
}
