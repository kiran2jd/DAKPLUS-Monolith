import { useState, useEffect } from 'react';
import { topicService } from '../services/topic';

export default function TopicManagementPage() {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newTopic, setNewTopic] = useState({ name: '', description: '', courseIds: [] });
    const [newSubtopic, setNewSubtopic] = useState({ name: '', description: '', topicId: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingTopic, setEditingTopic] = useState(null);
    const [editingSubtopic, setEditingSubtopic] = useState(null);

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        setLoading(true);
        try {
            const data = await topicService.getAllTopics();
            // Fetch subtopics for each topic
            const topicsWithSubtopics = await Promise.all(data.map(async (topic) => {
                const subtopics = await topicService.getSubtopics(topic.id);
                return { ...topic, subtopics };
            }));
            setTopics(topicsWithSubtopics);
        } catch (err) {
            setError('Failed to fetch topics');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTopic = async (e) => {
        e.preventDefault();
        const dataObj = editingTopic || newTopic;
        if (!dataObj.name) return;
        
        setLoading(true);
        try {
            const topicData = { 
                name: dataObj.name, 
                description: dataObj.description,
                courseIds: dataObj.courseIds || [],
                imageUrl: editingTopic?.imageUrl || null,
                pdfUrl: editingTopic?.pdfUrl || null
            };
            
            // Handle Image Upload
            if (dataObj.imageFile) {
                const imgRes = await topicService.uploadSyllabusFile(dataObj.imageFile);
                topicData.imageUrl = imgRes.url;
            }
            
            // Handle PDF Upload
            if (dataObj.pdfFile) {
                const pdfRes = await topicService.uploadSyllabusFile(dataObj.pdfFile);
                topicData.pdfUrl = pdfRes.url;
            }

            if (editingTopic) {
                await topicService.updateTopic(editingTopic.id, topicData);
                setSuccess('Topic updated successfully');
                setEditingTopic(null);
            } else {
                await topicService.createTopic(topicData);
                setNewTopic({ name: '', description: '', courseIds: [], imageFile: null, pdfFile: null });
                setSuccess('Topic created successfully');
            }
            fetchTopics();
        } catch (err) {
            setError(`Failed to ${editingTopic ? 'update' : 'create'} topic`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubtopic = async (e) => {
        e.preventDefault();
        const subObj = editingSubtopic || newSubtopic;
        if (!subObj.topicId && !editingSubtopic) {
            setError('Please select a parent topic');
            return;
        }
        setLoading(true);
        try {
            const subData = { 
                name: subObj.name,
                description: subObj.description,
                topicId: subObj.topicId,
                imageUrl: editingSubtopic?.imageUrl || null,
                pdfUrl: editingSubtopic?.pdfUrl || null
            };
            
            // Handle Image Upload
            if (subObj.imageFile) {
                const imgRes = await topicService.uploadSyllabusFile(subObj.imageFile);
                subData.imageUrl = imgRes.url;
            }
            
            // Handle PDF Upload
            if (subObj.pdfFile) {
                const pdfRes = await topicService.uploadSyllabusFile(subObj.pdfFile);
                subData.pdfUrl = pdfRes.url;
            }

            if (editingSubtopic) {
                await topicService.updateSubtopic(editingSubtopic.id, subData);
                setSuccess('Subtopic updated successfully');
                setEditingSubtopic(null);
            } else {
                await topicService.createSubtopic(subData);
                setNewSubtopic({ name: '', description: '', topicId: '', imageFile: null, pdfFile: null });
                setSuccess('Subtopic created successfully');
            }
            fetchTopics();
        } catch (err) {
            setError(`Failed to ${editingSubtopic ? 'update' : 'create'} subtopic`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTopic = async (id) => {
        if (window.confirm('Are you sure? This will delete the topic.')) {
            try {
                await topicService.deleteTopic(id);
                fetchTopics();
            } catch (err) {
                setError('Failed to delete topic');
            }
        }
    };

    const handleDeleteSubtopic = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await topicService.deleteSubtopic(id);
                fetchTopics();
            } catch (err) {
                setError('Failed to delete subtopic');
            }
        }
    };

    return (
        <div className="p-4 sm:p-8 max-w-6xl mx-auto min-h-screen bg-transparent dark:bg-gray-900 transition-colors duration-300">
            <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-800 dark:text-white">Topic Management</h1>

            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">{success}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Topic Creation */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-colors">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">{editingTopic ? 'Edit Topic' : 'Create New Topic'}</h2>
                    <form onSubmit={handleCreateTopic} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Topic Name</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                value={editingTopic ? editingTopic.name : newTopic.name}
                                onChange={e => {
                                    if (editingTopic) setEditingTopic({ ...editingTopic, name: e.target.value });
                                    else setNewTopic({ ...newTopic, name: e.target.value });
                                }}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label>
                            <textarea
                                className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                value={editingTopic ? editingTopic.description : newTopic.description}
                                onChange={e => {
                                    if (editingTopic) setEditingTopic({ ...editingTopic, description: e.target.value });
                                    else setNewTopic({ ...newTopic, description: e.target.value });
                                }}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Available In Courses</label>
                            <div className="flex gap-4">
                                {['MTS', 'PMMG', 'PASA'].map(cid => (
                                    <label key={cid} className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 h-4 w-4"
                                            checked={(editingTopic ? (editingTopic.courseIds || []) : (newTopic.courseIds || [])).includes(cid)}
                                            onChange={(e) => {
                                                const currentIds = editingTopic ? (editingTopic.courseIds || []) : (newTopic.courseIds || []);
                                                const newIds = e.target.checked 
                                                    ? [...currentIds, cid] 
                                                    : currentIds.filter(id => id !== cid);
                                                
                                                if (editingTopic) setEditingTopic({ ...editingTopic, courseIds: newIds });
                                                else setNewTopic({ ...newTopic, courseIds: newIds });
                                            }}
                                        />
                                        <span>{cid}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Banner Image</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={e => {
                                        if (editingTopic) setEditingTopic({ ...editingTopic, imageFile: e.target.files[0] });
                                        else setNewTopic({ ...newTopic, imageFile: e.target.files[0] });
                                    }}
                                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Study PDF</label>
                                <input 
                                    type="file" 
                                    accept=".pdf"
                                    onChange={e => {
                                        if (editingTopic) setEditingTopic({ ...editingTopic, pdfFile: e.target.files[0] });
                                        else setNewTopic({ ...newTopic, pdfFile: e.target.files[0] });
                                    }}
                                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                                />
                                {editingTopic?.pdfUrl && (
                                    <a 
                                        href={editingTopic.pdfUrl.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${editingTopic.pdfUrl}` : editingTopic.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline mt-1 block"
                                    >
                                        Current: View PDF
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {editingTopic && (
                                <button type="button" onClick={() => setEditingTopic(null)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition">
                                    Cancel
                                </button>
                            )}
                            <button type="submit" disabled={loading} className="flex-[2] bg-primary text-white py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-50">
                                {loading ? 'Uploading...' : editingTopic ? 'Update Topic' : 'Add Topic'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Subtopic Creation */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-colors">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">{editingSubtopic ? 'Edit Subtopic' : 'Create New Subtopic'}</h2>
                    <form onSubmit={handleCreateSubtopic} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Parent Topic</label>
                            <select
                                className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                value={editingSubtopic ? editingSubtopic.topicId : newSubtopic.topicId}
                                onChange={e => {
                                    if (editingSubtopic) setEditingSubtopic({ ...editingSubtopic, topicId: e.target.value });
                                    else setNewSubtopic({ ...newSubtopic, topicId: e.target.value });
                                }}
                                required
                                disabled={editingSubtopic}
                            >
                                <option value="">Select Topic</option>
                                {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Subtopic Name</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                value={editingSubtopic ? editingSubtopic.name : newSubtopic.name}
                                onChange={e => {
                                    if (editingSubtopic) setEditingSubtopic({ ...editingSubtopic, name: e.target.value });
                                    else setNewSubtopic({ ...newSubtopic, name: e.target.value });
                                }}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label>
                            <textarea
                                className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                value={editingSubtopic ? editingSubtopic.description : newSubtopic.description}
                                onChange={e => {
                                    if (editingSubtopic) setEditingSubtopic({ ...editingSubtopic, description: e.target.value });
                                    else setNewSubtopic({ ...newSubtopic, description: e.target.value });
                                }}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={e => {
                                        if (editingSubtopic) setEditingSubtopic({ ...editingSubtopic, imageFile: e.target.files[0] });
                                        else setNewSubtopic({ ...newSubtopic, imageFile: e.target.files[0] });
                                    }}
                                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">PDF</label>
                                <input 
                                    type="file" 
                                    accept=".pdf"
                                    onChange={e => {
                                        if (editingSubtopic) setEditingSubtopic({ ...editingSubtopic, pdfFile: e.target.files[0] });
                                        else setNewSubtopic({ ...newSubtopic, pdfFile: e.target.files[0] });
                                    }}
                                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                                />
                                {editingSubtopic?.pdfUrl && (
                                    <a 
                                        href={editingSubtopic.pdfUrl.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${editingSubtopic.pdfUrl}` : editingSubtopic.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline mt-1 block"
                                    >
                                        Current: View PDF
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {editingSubtopic && (
                                <button type="button" onClick={() => setEditingSubtopic(null)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition">
                                    Cancel
                                </button>
                            )}
                            <button type="submit" disabled={loading} className="flex-[2] bg-secondary text-white py-2 rounded-md hover:opacity-90 transition disabled:opacity-50">
                                {loading ? 'Uploading...' : editingSubtopic ? 'Update Subtopic' : 'Add Subtopic'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* List of Topics and Subtopics */}
            <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-colors">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <tr>
                            <th className="px-6 py-4">Topic / Subtopics</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {loading && <tr><td colSpan="3" className="p-8 text-center text-gray-500">Loading topics...</td></tr>}
                        {!loading && topics.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-gray-500">No topics found. Create one above!</td></tr>}
                        {topics.map(topic => (
                            <>
                                <tr key={topic.id} className="bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-primary dark:text-blue-400">
                                        {topic.name}
                                        {topic.courseIds && topic.courseIds.length > 0 && (
                                            <div className="flex gap-1 mt-1">
                                                {topic.courseIds.map(cid => (
                                                    <span key={cid} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-xs rounded-full">
                                                        {cid}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{topic.description}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setEditingTopic(topic)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-4 font-semibold">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDeleteTopic(topic.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                                {topic.subtopics?.map(sub => (
                                    <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-3 pl-12 text-sm text-gray-700 dark:text-gray-300">
                                            <span className="mr-2 text-gray-400 dark:text-gray-500">└</span> {sub.name}
                                        </td>
                                        <td className="px-6 py-3 text-xs text-gray-500 dark:text-gray-400">{sub.description}</td>
                                        <td className="px-6 py-3 text-right">
                                            <button onClick={() => setEditingSubtopic(sub)} className="text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-300 text-xs mr-3 font-semibold">
                                                Edit
                                            </button>
                                            <button onClick={() => handleDeleteSubtopic(sub.id)} className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300 text-xs">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
