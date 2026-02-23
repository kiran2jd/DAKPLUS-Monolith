import { useEffect, useState } from 'react';
import { topicService } from '../services/topic';
import { BookOpen, ChevronRight, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SyllabusPage() {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSyllabus = async () => {
            try {
                const topicsData = await topicService.getAllTopics();
                // For each topic, fetch its subtopics
                const syllabus = await Promise.all(topicsData.map(async (topic) => {
                    const subtopics = await topicService.getSubtopics(topic.id);
                    return { ...topic, subtopics };
                }));
                setTopics(syllabus);
            } catch (err) {
                console.error("Failed to load syllabus", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSyllabus();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-10 w-10 border-4 border-red-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-red-100 rounded-2xl">
                    <BookOpen className="text-red-600 h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-sans">Course Syllabus</h1>
                    <p className="text-gray-500">Explore topics and areas covered in mock exams</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topics.map((topic) => (
                    <div key={topic.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                <GraduationCap className="text-blue-600 w-7 h-7" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{topic.name}</h2>
                        </div>
                        <p className="text-gray-600 text-sm mb-6">{topic.description}</p>

                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Modules</h3>
                            {topic.subtopics?.length > 0 ? (
                                topic.subtopics.map((sub) => (
                                    <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group hover:bg-red-50 transition-colors">
                                        <span className="text-sm font-semibold text-gray-700 group-hover:text-red-600">{sub.name}</span>
                                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-red-400" />
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic">No subtopics available</p>
                            )}
                        </div>

                        <button
                            onClick={() => navigate('/dashboard/student')}
                            className="mt-6 w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition shadow-lg shadow-gray-200"
                        >
                            View Related Tests
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
