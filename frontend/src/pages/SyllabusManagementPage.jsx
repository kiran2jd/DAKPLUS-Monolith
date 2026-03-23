import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit, X, Save, Loader2, Upload, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { topicService } from '../services/topic';

export default function SyllabusManagementPage() {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', courseIds: [] });
    const [isSaving, setIsSaving] = useState(false);
    const [expandedTopics, setExpandedTopics] = useState(new Set());
    const [uploadingId, setUploadingId] = useState(null);

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        setLoading(true);
        try {
            const data = await topicService.getAllTopics();
            // Fetch subtopics for each topic to show them in the management list
            const topicsWithSubtopics = await Promise.all(data.map(async (topic) => {
                const subtopics = await topicService.getSubtopics(topic.id);
                return { ...topic, subtopics };
            }));
            setTopics(topicsWithSubtopics);
        } catch (err) {
            console.error("Failed to fetch topics", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleTopic = (id) => {
        const newExpanded = new Set(expandedTopics);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedTopics(newExpanded);
    };

    const handleDelete = async (id, type) => {
        if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
            try {
                if (type === 'topic') {
                    await topicService.deleteTopic(id);
                } else {
                    await topicService.deleteSubtopic(id);
                }
                fetchTopics();
            } catch (err) {
                alert(`Failed to delete ${type}`);
            }
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

    const handleDeletePdf = async (id, type) => {
        if (!window.confirm('Are you sure you want to remove the PDF?')) return;
        try {
            if (type === 'topic') {
                const topic = topics.find(t => t.id === id);
                await topicService.updateTopic(id, { ...topic, pdfUrl: null });
            } else {
                // Find parent topic and then subtopic
                for (const t of topics) {
                    const sub = t.subtopics?.find(s => s.id === id);
                    if (sub) {
                        await topicService.updateSubtopic(id, { ...sub, pdfUrl: null });
                        break;
                    }
                }
            }
            fetchTopics();
        } catch (err) {
            console.error("Failed to delete PDF", err);
        }
    };

    const handleFileUpload = async (e, id, type) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingId(id);
        try {
            const uploadRes = await topicService.uploadSyllabusFile(file);
            if (uploadRes && uploadRes.url) {
                if (type === 'topic') {
                    await topicService.updateTopic(id, { ...topics.find(t => t.id === id), pdfUrl: uploadRes.url });
                } else {
                    const parentTopic = topics.find(t => t.subtopics.some(s => s.id === id));
                    const subtopic = parentTopic.subtopics.find(s => s.id === id);
                    await topicService.updateSubtopic(id, { ...subtopic, pdfUrl: uploadRes.url });
                }
                fetchTopics();
                alert("Syllabus PDF updated successfully!");
            }
        } catch (err) {
            console.error("Upload failed", err);
            alert("Failed to upload syllabus PDF");
        } finally {
            setUploadingId(null);
        }
    };

    const handleOpenModal = (topic = null) => {
        if (topic) {
            setEditingTopic(topic);
            setFormData({ 
                name: topic.name, 
                description: topic.description || '',
                courseIds: topic.courseIds || []
            });
        } else {
            setEditingTopic(null);
            setFormData({ name: '', description: '', courseIds: [] });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingTopic) {
                await topicService.updateTopic(editingTopic.id, { ...editingTopic, ...formData, syllabusOnly: true });
            } else {
                await topicService.createTopic({ ...formData, syllabusOnly: true });
            }
            fetchTopics();
            setIsModalOpen(false);
        } catch (err) {
            alert("Failed to save topic");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12 pb-24">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Syllabus Builder</h1>
                        <p className="text-gray-500 mt-2">Manage course modules and study materials.</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-200"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Category
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="p-6 font-black text-[10px] uppercase tracking-widest text-gray-400">Category / Modules</th>
                                    <th className="p-6 font-black text-[10px] uppercase tracking-widest text-gray-400">PDF Syllabus</th>
                                    <th className="p-6 font-black text-[10px] uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {topics.length > 0 ? topics.map(topic => (
                                    <React.Fragment key={topic.id}>
                                        <tr className={`group transition-colors ${expandedTopics.has(topic.id) ? 'bg-indigo-50/30' : 'hover:bg-gray-50'}`}>
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <button onClick={() => toggleTopic(topic.id)} className="p-1 hover:bg-gray-200 rounded-lg transition">
                                                        {expandedTopics.has(topic.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                    </button>
                                                    <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                                        <FileText className="text-indigo-600 h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-900 block">{topic.name}</span>
                                                        <span className="text-xs text-gray-400 font-medium">Topic ID: {topic.id.slice(-6)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    {topic.pdfUrl ? (
                                                        <div className="flex items-center gap-1">
                                                            <a 
                                                                href={getFullPdfUrl(topic.pdfUrl)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                                                            >
                                                                <BookOpen size={14} /> View
                                                            </a>
                                                            <button 
                                                                onClick={() => handleDeletePdf(topic.id, 'topic')}
                                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                                title="Delete PDF"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400 italic font-bold">No PDF</span>
                                                    )}
                                                    <label className="cursor-pointer p-1.5 bg-gray-100 hover:bg-indigo-600 hover:text-white rounded-lg transition group relative" title="Upload PDF">
                                                        {uploadingId === topic.id ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                                        <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(e, topic.id, 'topic')} />
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right space-x-2">
                                                <button onClick={() => handleOpenModal(topic)} className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(topic.id, 'topic')} className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                        {/* Nested Subtopics */}
                                        {expandedTopics.has(topic.id) && topic.subtopics?.map(sub => (
                                            <tr key={sub.id} className="bg-white/50 border-l-4 border-indigo-400 hover:bg-white transition-colors">
                                                <td className="p-4 pl-20">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                                                        <span className="text-sm font-semibold text-gray-700">{sub.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {sub.pdfUrl ? (
                                                            <div className="flex items-center gap-1 text-[10px]">
                                                                <a 
                                                                    href={getFullPdfUrl(sub.pdfUrl)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                                                                >
                                                                    <BookOpen size={12} /> Study Doc
                                                                </a>
                                                                <button 
                                                                    onClick={() => handleDeletePdf(sub.id, 'subtopic')}
                                                                    className="p-1 text-red-400 hover:text-red-600 transition"
                                                                    title="Delete PDF"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-gray-300">No doc</span>
                                                        )}
                                                        <label className="cursor-pointer p-1 bg-gray-50 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 transition" title="Upload PDF">
                                                            {uploadingId === sub.id ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                                            <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(e, sub.id, 'subtopic')} />
                                                        </label>
                                                    </div>
                                                  </td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => handleDelete(sub.id, 'subtopic')} className="p-2 text-red-400 hover:text-red-600 transition">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="p-16 text-center text-gray-400 font-bold italic">No topics found. Create your first category above!</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                                {editingTopic ? 'Edit Topic' : 'New Category'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 rounded-full transition">
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900 shadow-inner"
                                    placeholder="e.g. Postal Manual Vol V"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Notes</label>
                                <textarea
                                    rows="4"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900 shadow-inner"
                                    placeholder="Brief details about this topic..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Available In Courses</label>
                                <div className="flex flex-wrap gap-2">
                                    {['MTS', 'PMMG', 'PASA'].map(id => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => {
                                                const current = formData.courseIds || [];
                                                const next = current.includes(id) 
                                                    ? current.filter(c => c !== id)
                                                    : [...current, id];
                                                setFormData({ ...formData, courseIds: next });
                                            }}
                                            className={`px-4 py-2 rounded-xl border-2 transition-all font-bold text-xs ${
                                                (formData.courseIds || []).includes(id)
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                    : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200'
                                            }`}
                                        >
                                            {id}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                disabled={isSaving}
                                type="submit"
                                className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl shadow-indigo-300 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                                {editingTopic ? 'Update Category' : 'Create Category'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
