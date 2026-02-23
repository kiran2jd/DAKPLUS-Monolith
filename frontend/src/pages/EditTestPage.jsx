import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { testService } from '../services/test';
import { topicService } from '../services/topic';
import QuestionBuilder from '../components/QuestionBuilder';
import DocumentUpload from '../components/DocumentUpload';
import { Trash2, ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';

export default function EditTestPage() {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [testData, setTestData] = useState({
        title: '',
        description: '',
        durationMinutes: 60,
        category: 'General',
        difficulty: 'Medium',
        isPremium: false,
        price: 0,
        topicId: '',
        subtopicId: ''
    });

    const [topics, setTopics] = useState([]);
    const [subtopics, setSubtopics] = useState([]);
    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Fetch topics first
                const topicsData = await topicService.getAllTopics();
                setTopics(topicsData);

                // Fetch test details
                const test = await testService.getTestById(testId);
                if (test) {
                    setTestData({
                        title: test.title || '',
                        description: test.description || '',
                        durationMinutes: test.durationMinutes || test.duration_minutes || 60,
                        category: test.category || 'General',
                        difficulty: test.difficulty || 'Medium',
                        isPremium: test.isPremium || test.premium || false,
                        price: test.price || 0,
                        topicId: test.topicId || '',
                        subtopicId: test.subtopicId || ''
                    });
                    setQuestions(test.questions || []);

                    // Fetch subtopics if topic exists
                    if (test.topicId) {
                        const subData = await topicService.getSubtopics(test.topicId);
                        setSubtopics(subData);
                    }
                }
            } catch (err) {
                console.error("Failed to load test data", err);
                setError("Failed to load test data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [testId]);

    const handleTopicChange = async (topicId) => {
        setTestData({ ...testData, topicId, subtopicId: '' });
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (testData.title.trim().length < 5) {
            setError("Test title must be at least 5 characters long.");
            return;
        }
        if (questions.length === 0) {
            setError("Please add at least one question.");
            return;
        }

        setSaving(true);
        setError('');

        try {
            const payload = {
                ...testData,
                questions: questions
            };
            await testService.updateTest(testId, payload);
            navigate('/dashboard/my-tests');
        } catch (err) {
            setError("Failed to update test. " + (err.response?.data?.detail || err.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-primary h-12 w-12" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 sm:rounded-xl shadow-md overflow-hidden">
            <div className="bg-primary px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate(-1)} className="text-white hover:bg-white/10 p-2 rounded-full transition">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Edit Test</h1>
                </div>
            </div>

            <div className="p-4 sm:p-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                        <AlertCircle className="mr-2 h-5 w-5" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Test Details Section */}
                    <div className="mb-8">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 border-b dark:border-gray-700 pb-2">Test Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Test Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                    value={testData.title}
                                    onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description</label>
                                <textarea
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                    rows={3}
                                    value={testData.description}
                                    onChange={(e) => setTestData({ ...testData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Duration (Minutes)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                    value={testData.durationMinutes}
                                    onChange={(e) => setTestData({ ...testData, durationMinutes: parseInt(e.target.value) })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Category</label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                    value={testData.category}
                                    onChange={(e) => setTestData({ ...testData, category: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Difficulty</label>
                                <select
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                    value={testData.difficulty}
                                    onChange={(e) => setTestData({ ...testData, difficulty: e.target.value })}
                                >
                                    <option>Easy</option>
                                    <option>Medium</option>
                                    <option>Hard</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Topic</label>
                                <select
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                    value={testData.topicId}
                                    onChange={(e) => handleTopicChange(e.target.value)}
                                >
                                    <option value="">Select Topic</option>
                                    {topics.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Subtopic</label>
                                <select
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                    value={testData.subtopicId}
                                    onChange={(e) => setTestData({ ...testData, subtopicId: e.target.value })}
                                    disabled={!testData.topicId}
                                >
                                    <option value="">Select Subtopic</option>
                                    {subtopics.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center space-x-3 mt-6">
                                <input
                                    type="checkbox"
                                    id="isPremium"
                                    className="h-5 w-5 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary dark:bg-gray-700"
                                    checked={testData.isPremium}
                                    onChange={(e) => setTestData({ ...testData, isPremium: e.target.checked })}
                                />
                                <label htmlFor="isPremium" className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                    Premium Test
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Question Builder Section */}
                    <div className="mb-8 p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">Questions ({questions.length})</h2>
                            <div className="w-full md:w-auto">
                                <DocumentUpload
                                    onQuestionsExtracted={(newQuestions) => setQuestions([...questions, ...newQuestions])}
                                    topicId={testData.topicId}
                                    subtopicId={testData.subtopicId}
                                />
                            </div>
                        </div>
                        <QuestionBuilder questions={questions} setQuestions={setQuestions} />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard/my-tests')}
                            className="w-full sm:w-auto px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full sm:w-auto px-8 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-lg disabled:opacity-50 flex items-center justify-center"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
