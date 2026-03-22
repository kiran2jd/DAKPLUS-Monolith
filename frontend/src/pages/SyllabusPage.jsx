import { useEffect, useState, useRef } from 'react';
import { topicService } from '../services/topic';
import { BookOpen, ChevronRight, GraduationCap, Upload, Loader2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SyllabusPage() {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isStaff, setIsStaff] = useState(false);
    const [uploadingId, setUploadingId] = useState(null);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const fetchSyllabus = async () => {
        setLoading(true);
        try {
            const topicsData = await topicService.getAllTopics();
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

    const getFullPdfUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        let cleanBase = baseUrl.replace(/\/+$/, '');
        if (cleanBase && !cleanBase.startsWith('http') && !cleanBase.startsWith('/')) {
            cleanBase = 'https://' + cleanBase;
        }
        if (url.startsWith('/api') && cleanBase.endsWith('/api')) {
            return cleanBase.substring(0, cleanBase.length - 4) + url;
        }
        return cleanBase + (url.startsWith('/') ? '' : '/') + url;
    };

    useEffect(() => {
        fetchSyllabus();
        
        // Role Detection
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const role = (user.role || '').toUpperCase();
        setIsStaff(role === 'STAFF' || role === 'ADMIN');
    }, []);

    const handleFileUpload = async (e, id, type) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingId(id);
        try {
            // 1. Upload to server
            const uploadRes = await topicService.uploadSyllabusFile(file);
            
            if (uploadRes && uploadRes.url) {
                // 2. Update record
                if (type === 'topic') {
                    await topicService.updateTopic(id, { pdfUrl: uploadRes.url });
                } else {
                    await topicService.updateSubtopic(id, { pdfUrl: uploadRes.url });
                }
                
                // 3. Refresh
                await fetchSyllabus();
                alert("Syllabus updated successfully!");
            }
        } catch (err) {
            console.error("Upload failed", err);
            alert("Failed to upload syllabus. Please try again.");
        } finally {
            setUploadingId(null);
        }
    };

    if (loading && topics.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-10 w-10 border-4 border-red-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 rounded-2xl">
                        <BookOpen className="text-red-600 h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 font-sans">Course Syllabus</h1>
                        <p className="text-gray-500 text-sm">Explore topics and areas covered in mock exams</p>
                    </div>
                </div>
                {isStaff && (
                    <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100 uppercase tracking-wider">
                        Admin Mode: Direct Edit Enabled
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topics.map((topic) => (
                    <div key={topic.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center overflow-hidden">
                                    {topic.imageUrl ? (
                                        <img src={topic.imageUrl.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${topic.imageUrl}` : topic.imageUrl} alt={topic.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <GraduationCap className="text-blue-600 w-7 h-7" />
                                    )}
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">{topic.name}</h2>
                            </div>
                            
                            {isStaff && (
                                <label className="cursor-pointer p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group relative" title="Upload Main Syllabus">
                                    {uploadingId === topic.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                    ) : (
                                        <Upload className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                                    )}
                                    <input 
                                        type="file" 
                                        accept=".pdf" 
                                        className="hidden" 
                                        onChange={(e) => handleFileUpload(e, topic.id, 'topic')}
                                        disabled={uploadingId === topic.id}
                                    />
                                </label>
                            )}
                        </div>
                        <p className="text-gray-600 text-sm mb-6 line-clamp-2">{topic.description}</p>

                        <div className="space-y-3 mb-6 flex-grow">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Exam Modules</h3>
                            {topic.subtopics?.length > 0 ? (
                                topic.subtopics.map((sub) => (
                                    <div key={sub.id} className="group relative">
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-red-100 hover:bg-red-50/50 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                                                    <FileText className="h-3 w-3 text-gray-400" />
                                                </div>
                                                <span className="text-xs font-bold text-gray-700 group-hover:text-red-700">{sub.name}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {sub.pdfUrl && (
                                                    <a 
                                                        href={getFullPdfUrl(sub.pdfUrl)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                                        title="View PDF"
                                                    >
                                                        <BookOpen className="h-3.5 w-3.5" />
                                                    </a>
                                                )}
                                                {isStaff && (
                                                    <label className="cursor-pointer p-2 bg-gray-200/50 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors" title="Change PDF">
                                                        {uploadingId === sub.id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Upload className="h-3.5 w-3.5" />
                                                        )}
                                                        <input 
                                                            type="file" 
                                                            accept=".pdf" 
                                                            className="hidden" 
                                                            onChange={(e) => handleFileUpload(e, sub.id, 'subtopic')}
                                                            disabled={uploadingId === sub.id}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic px-1">No exam modules listed</p>
                            )}
                        </div>

                        {topic.pdfUrl && (
                            <a 
                                href={getFullPdfUrl(topic.pdfUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mb-4 flex items-center justify-center gap-2 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-black text-red-600 hover:bg-red-100 hover:border-red-200 transition-all transform active:scale-95"
                            >
                                <BookOpen className="h-4 w-4" /> DOWNLOAD FULL TOPIC SYLLABUS
                            </a>
                        )}

                        <button
                            onClick={() => navigate('/dashboard/student')}
                            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200 transform active:scale-95"
                        >
                            Explore Mock Exams
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
