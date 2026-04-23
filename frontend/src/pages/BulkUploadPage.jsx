import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudUpload, X, CheckCircle, Info, Sparkles, Settings, FileText } from 'lucide-react';
import { testService } from '../services/test';
import { topicService } from '../services/topic';

export default function BulkUploadPage() {
    const navigate = useNavigate();
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [topics, setTopics] = useState([]);
    const [subtopics, setSubtopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState('');
    const [selectedSubtopic, setSelectedSubtopic] = useState('');
    const [courseIds, setCourseIds] = useState([]);
    const [autoDetect, setAutoDetect] = useState(true);

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const data = await topicService.getAllTopics();
                setTopics(data.filter(t => !t.syllabusOnly));
            } catch (err) {
                console.error("Failed to fetch topics", err);
            }
        };
        fetchTopics();
    }, []);

    const handleTopicChange = async (topicId) => {
        setSelectedTopic(topicId);
        setSelectedSubtopic('');
        if (topicId) {
            try {
                const data = await topicService.getSubtopics(topicId);
                setSubtopics(data);
            } catch (err) {
                console.error("Failed to fetch subtopics", err);
            }
        } else {
            setSubtopics([]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    };

    const toggleCourse = (id) => {
        setCourseIds(prev => 
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedFiles.length === 0) {
            setError("Please select at least one file.");
            return;
        }

        if (!autoDetect && !selectedTopic) {
            setError("Please select a target topic for Manual Selection mode.");
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await testService.bulkUpload(
                selectedFiles,
                autoDetect ? null : selectedTopic,
                autoDetect ? null : selectedSubtopic,
                autoDetect ? [] : courseIds
            );
            setSuccess(response.message || "Bulk upload started successfully in the background!");
            setSelectedFiles([]);
            setTimeout(() => navigate('/dashboard/my-tests'), 3000);
        } catch (err) {
            setError("Failed to start bulk upload. " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-8">
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <CloudUpload size={32} />
                    Bulk AI Ingestion
                </h1>
                <p className="text-red-100 mt-2 font-medium">Upload multiple test documents for automated background processing</p>
            </div>

            <div className="p-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800 flex items-center gap-3">
                        <Info size={20} />
                        <span className="font-semibold">{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl border border-green-100 dark:border-green-800 flex items-center gap-3 animate-bounce">
                        <CheckCircle size={20} />
                        <span className="font-semibold">{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* File Upload Section */}
                    <div className="relative group">
                        <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Select Test Files (PDF, Word, TXT)</label>
                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-10 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-800/30 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 transition-all cursor-pointer">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept=".pdf,.doc,.docx,.txt"
                            />
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full text-red-600 dark:text-red-400 mb-4 group-hover:scale-110 transition-transform">
                                <CloudUpload size={40} />
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 font-bold text-lg">Click to select or drag and drop</p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Support for PDF, Word and Text files</p>
                        </div>
                    </div>

                    {selectedFiles.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-sm">Selected Files ({selectedFiles.length})</h3>
                                <button type="button" onClick={() => setSelectedFiles([])} className="text-red-600 dark:text-red-400 text-xs font-bold hover:underline">Clear All</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                                <FileText size={16} />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => removeFile(index)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mode Selection */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">Categorization Strategy</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                type="button"
                                onClick={() => setAutoDetect(true)}
                                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${autoDetect ? 'border-red-600 bg-red-50/50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                                <Sparkles size={20} />
                                <div className="text-left">
                                    <p className="font-bold">AI Auto-Detect</p>
                                    <p className="text-[10px] opacity-70">AI identifies topic & course</p>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setAutoDetect(false)}
                                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${!autoDetect ? 'border-red-600 bg-red-50/50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                                <Settings size={20} />
                                <div className="text-left">
                                    <p className="font-bold">Manual Selection</p>
                                    <p className="text-[10px] opacity-70">Assign fixed metadata</p>
                                </div>
                            </button>
                        </div>

                        {!autoDetect && (
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-widest">Target Courses</label>
                                    <div className="flex flex-wrap gap-4">
                                        {['MTS', 'PMMG', 'PASA'].map(cid => (
                                            <button
                                                key={cid}
                                                type="button"
                                                onClick={() => toggleCourse(cid)}
                                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${courseIds.includes(cid) ? 'bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                                            >
                                                {cid}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Topic</label>
                                    <select
                                        className="w-full rounded-xl border-gray-200 dark:border-gray-700 shadow-sm focus:border-red-600 focus:ring-red-600 p-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 font-semibold"
                                        value={selectedTopic}
                                        onChange={(e) => handleTopicChange(e.target.value)}
                                    >
                                        <option value="">Select Topic</option>
                                        {topics.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Subtopic</label>
                                    <select
                                        className="w-full rounded-xl border-gray-200 dark:border-gray-700 shadow-sm focus:border-red-600 focus:ring-red-600 p-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 font-semibold disabled:opacity-50"
                                        value={selectedSubtopic}
                                        onChange={(e) => setSelectedSubtopic(e.target.value)}
                                        disabled={!selectedTopic}
                                    >
                                        <option value="">Select Subtopic</option>
                                        {subtopics.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-800 flex gap-4">
                        <div className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1">
                            <Info size={24} />
                        </div>
                        <div>
                            <p className="text-blue-900 dark:text-blue-200 font-bold text-sm">Background Processing</p>
                            <p className="text-blue-700 dark:text-blue-400 text-xs mt-1 leading-relaxed">
                                AI will process these files sequentially. English questions are extracted first, followed by Hindi translations and explanations in the background. Tests will appear in your library as they finish.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading || selectedFiles.length === 0}
                            className="group relative w-full sm:w-auto px-12 py-4 bg-red-600 text-white rounded-2xl font-black text-lg hover:bg-red-700 shadow-xl shadow-red-200 dark:shadow-none transition-all disabled:opacity-50 disabled:grayscale overflow-hidden"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? (
                                    <>
                                        <div className="h-5 w-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>INITIATING...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>START BULK PROCESSING</span>
                                        <CheckCircle size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </div>
                            {loading && <div className="absolute inset-0 bg-red-800 animate-pulse" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

