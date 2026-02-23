import { useState, useEffect } from 'react';
import { topicService } from '../services/topic';

export default function TopicManagementPage() {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newTopic, setNewTopic] = useState({ name: '', description: '' });
    const [newSubtopic, setNewSubtopic] = useState({ name: '', description: '', topicId: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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
        try {
            await topicService.createTopic(newTopic);
            setNewTopic({ name: '', description: '' });
            setSuccess('Topic created successfully');
            fetchTopics();
        } catch (err) {
            setError('Failed to create topic');
        }
    };

    const handleCreateSubtopic = async (e) => {
        e.preventDefault();
        if (!newSubtopic.topicId) {
            setError('Please select a parent topic');
            return;
        }
        try {
            await topicService.createSubtopic(newSubtopic);
            setNewSubtopic({ name: '', description: '', topicId: '' });
            setSuccess('Subtopic created successfully');
            fetchTopics();
        } catch (err) {
            setError('Failed to create subtopic');
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
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Create New Topic</h2>
                    <form onSubmit={handleCreateTopic} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Topic Name</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                value={newTopic.name}
                                onChange={e => setNewTopic({ ...newTopic, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label>
                            <textarea
                                className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                value={newTopic.description}
                                onChange={e => setNewTopic({ ...newTopic, description: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="w-full bg-primary text-white py-2 rounded-md hover:bg-indigo-700 transition">
                            Add Topic
                        </button>
                    </form>
                </div>

                {/* Subtopic Creation */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-colors">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Create New Subtopic</h2>
                    <form onSubmit={handleCreateSubtopic} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Parent Topic</label>
                            <select
                                className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                value={newSubtopic.topicId}
                                onChange={e => setNewSubtopic({ ...newSubtopic, topicId: e.target.value })}
                                required
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
                                value={newSubtopic.name}
                                onChange={e => setNewSubtopic({ ...newSubtopic, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label>
                            <textarea
                                className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                value={newSubtopic.description}
                                onChange={e => setNewSubtopic({ ...newSubtopic, description: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="w-full bg-secondary text-white py-2 rounded-md hover:opacity-90 transition">
                            Add Subtopic
                        </button>
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
                                    <td className="px-6 py-4 font-bold text-primary dark:text-blue-400">{topic.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{topic.description}</td>
                                    <td className="px-6 py-4 text-right">
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
