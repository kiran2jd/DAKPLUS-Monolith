import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit, X, Save, Loader2 } from 'lucide-react';
import { topicService } from '../services/topic';

export default function SyllabusManagementPage() {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        setLoading(true);
        try {
            const data = await topicService.getAllTopics();
            setTopics(data);
        } catch (err) {
            console.error("Failed to fetch topics", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this topic and all its subtopics?")) {
            try {
                await topicService.deleteTopic(id);
                setTopics(topics.filter(t => t.id !== id));
            } catch (err) {
                alert("Failed to delete topic");
            }
        }
    };

    const handleOpenModal = (topic = null) => {
        if (topic) {
            setEditingTopic(topic);
            setFormData({ name: topic.name, description: topic.description || '' });
        } else {
            setEditingTopic(null);
            setFormData({ name: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingTopic) {
                // TopicService.save handles both create and update if ID is present
                await topicService.createTopic({ ...editingTopic, ...formData });
            } else {
                await topicService.createTopic(formData);
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
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Syllabus Management</h1>
                        <p className="text-gray-500">Create and organize study topics for students.</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-indigo-700 transition"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add New Topic
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-5 font-semibold text-gray-500">Topic Name</th>
                                    <th className="p-5 font-semibold text-gray-500">Description</th>
                                    <th className="p-5 font-semibold text-gray-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {topics.length > 0 ? topics.map(topic => (
                                    <tr key={topic.id} className="hover:bg-gray-50 transition">
                                        <td className="p-5 font-bold text-gray-900 flex items-center gap-3">
                                            <FileText className="text-gray-400 h-5 w-5" />
                                            {topic.name}
                                        </td>
                                        <td className="p-5 text-gray-600 truncate max-w-xs">{topic.description || 'No description'}</td>
                                        <td className="p-5 text-right">
                                            <button
                                                onClick={() => handleOpenModal(topic)}
                                                className="text-blue-600 hover:text-blue-800 mr-4"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(topic.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="p-10 text-center text-gray-400">No topics found. Create one to get started!</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {editingTopic ? 'Edit Topic' : 'Add New Topic'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Topic Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    placeholder="e.g. Postal Manual Vol V"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                <textarea
                                    rows="4"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    placeholder="Brief details about this topic..."
                                />
                            </div>

                            <button
                                disabled={isSaving}
                                type="submit"
                                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                            >
                                {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                                {editingTopic ? 'Update Topic' : 'Create Topic'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
