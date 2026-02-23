import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testService } from '../services/test';
import { resultService } from '../services/result';
import { Clock, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

export default function TakeTestPage() {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);

    // Use Ref for answers to ensure 'handleSubmit' in setInterval sees latest state
    const answersRef = useRef({});
    const [answers, setAnswers] = useState({}); // Keep state for UI updates

    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [language, setLanguage] = useState('en'); // 'en' or 'te'
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);

    useEffect(() => {
        const loadTest = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                const userId = user?.id || user?._id;

                // 1. Check if already submitted
                if (userId) {
                    const submitted = await resultService.checkSubmission(userId, testId);
                    if (submitted) {
                        setAlreadySubmitted(true);
                        setLoading(false);
                        return;
                    }
                }

                // 2. Load Test
                const data = await testService.takeTest(testId);
                setTest(data);
                // Set initial timer based on duration
                let minutes = data.durationMinutes || data.duration_minutes || 60;
                // Handle case if minutes is string or invalid
                if (typeof minutes !== 'number' || isNaN(minutes)) {
                    minutes = 60;
                }
                setTimeLeft(minutes * 60);
            } catch (err) {
                console.error("Failed to load test", err);
            } finally {
                setLoading(false);
            }
        };
        loadTest();
    }, [testId]);

    // Timer and Navigation Guard Effect
    useEffect(() => {
        if (!test) return;

        // Prevent back button
        const preventBack = (e) => {
            e.preventDefault();
            window.history.pushState(null, null, window.location.pathname);
            if (window.confirm('You are in an active exam session. Exiting will lose progress. Are you sure?')) {
                navigate('/dashboard');
            }
        };

        window.history.pushState(null, null, window.location.pathname);
        window.addEventListener('popstate', preventBack);

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (!isSubmitting) {
                        handleSubmit(); // Auto-submit
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            window.removeEventListener('popstate', preventBack);
        };
    }, [test, navigate, isSubmitting]); // Stable dependency

    const handleAnswer = (value) => {
        const newAnswers = { ...answers, [currentQuestion]: value };
        setAnswers(newAnswers);
        answersRef.current = newAnswers; // Sync ref
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const payload = {
                test_id: testId,
                answers: answersRef.current // Use Ref for accurate submission
            };

            const result = await resultService.submitTest(payload);
            navigate(`/dashboard/result/${result.id}`);
        } catch (err) {
            console.error("Submission failed", err);
            alert("Failed to submit test. Please try again.");
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="p-8 text-center text-gray-900 dark:text-white">Loading Test...</div>;

    if (alreadySubmitted) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col transition-colors duration-300">
                <div className="bg-gradient-to-r from-red-600 to-blue-900 px-6 py-4 shadow-xl">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <button onClick={() => navigate('/dashboard')} className="text-white font-semibold">Back to Dashboard</button>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="bg-gray-50 dark:bg-gray-800 p-10 rounded-3xl shadow-2xl text-center max-w-lg w-full">
                        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="text-amber-600 w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Exam Already Completed</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
                            Our records show you have already submitted this exam. You can view your performance in the results section.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-4 bg-gradient-to-r from-red-600 to-blue-900 text-white rounded-2xl font-black text-xl shadow-lg hover:shadow-2xl transition transform active:scale-95"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!test) return <div className="p-8 text-center text-red-500 font-bold">Test not found</div>;

    const question = test.questions && test.questions.length > 0 ? test.questions[currentQuestion] : null;

    if (!question) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col transition-colors duration-300">
                <div className="bg-gradient-to-r from-red-600 to-blue-900 px-6 py-4 shadow-xl">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <button onClick={() => navigate('/dashboard')} className="text-white font-semibold">Back to Dashboard</button>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Questions Found</h2>
                        <p className="text-gray-600 dark:text-gray-400">This test doesn't seem to have any questions. Please contact your instructor.</p>
                        <button onClick={() => navigate('/dashboard')} className="mt-6 px-6 py-3 bg-red-600 text-white rounded-xl font-bold">Return Home</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
            {/* Gradient Header matching mobile app */}
            <div className="bg-gradient-to-r from-red-600 to-blue-900 px-6 py-4 shadow-xl">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
                                navigate('/dashboard');
                            }
                        }}
                        className="text-white font-semibold"
                    >
                        Exit
                    </button>
                    <div className="flex items-center space-x-4">
                        <div className="flex bg-white/10 backdrop-blur-md rounded-lg p-1">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-3 py-1 rounded text-xs font-bold transition ${language === 'en' ? 'bg-white text-blue-900' : 'text-white hover:bg-white/10'}`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => setLanguage('te')}
                                className={`px-3 py-1 rounded text-xs font-bold transition ${language === 'te' ? 'bg-white text-blue-900' : 'text-white hover:bg-white/10'}`}
                            >
                                తెలుగు
                            </button>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                            <span className="text-white text-lg font-bold font-mono">{formatTime(timeLeft)}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        className="text-white font-bold bg-green-600/30 hover:bg-green-600/50 px-4 py-2 rounded-lg transition"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? '...' : 'Submit'}
                    </button>
                </div>
                <div className="max-w-7xl mx-auto mt-4">
                    <h1 className="text-white text-lg font-bold">{test.title}</h1>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white dark:bg-gray-800 px-6 py-4 shadow-sm transition-colors border-b dark:border-gray-700">
                <div className="max-w-7xl mx-auto">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                        <div
                            className="h-full bg-red-600 transition-all duration-300 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                            style={{ width: `${((currentQuestion + 1) / test.questions.length) * 100}%` }}
                        />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest font-black">Question {currentQuestion + 1} of {test.questions.length}</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-5xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Question Area */}
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 min-h-[450px] flex flex-col transition-colors border border-transparent dark:border-gray-700">
                    <div className="flex justify-between items-start mb-6">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                            Q{currentQuestion + 1}
                        </span>
                        <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                            {question.points} {question.points === 1 ? 'Point' : 'Points'}
                        </span>
                    </div>

                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
                            {language === 'te' && question.textTe ? question.textTe : question.text}
                        </h2>

                        {question.imageUrl && (
                            <div className="mb-8 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-4 flex justify-center group">
                                <img
                                    src={question.imageUrl}
                                    alt="Question Diagram"
                                    className="max-h-[400px] object-contain transition group-hover:scale-[1.02]"
                                />
                            </div>
                        )}

                        <div className="space-y-4">
                            {(question.type === 'mcq' || !question.type) && question.options.map((option, idx) => {
                                const optionText = (language === 'te' && question.optionsTe && question.optionsTe[idx])
                                    ? question.optionsTe[idx]
                                    : option;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(option)}
                                        className={`flex items-center w-full p-5 rounded-2xl border-2 transition-all transform active:scale-[0.99] ${answers[currentQuestion] === option
                                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 ring-4 ring-indigo-500/10'
                                            : 'border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-white dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${answers[currentQuestion] === option
                                            ? 'border-indigo-600 bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]'
                                            : 'border-gray-300 dark:border-gray-500'
                                            }`}>
                                            {answers[currentQuestion] === option && (
                                                <div className="w-2.5 h-2.5 bg-white rounded-full shadow-inner" />
                                            )}
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className={`text-[10px] font-black uppercase tracking-tighter mb-0.5 ${answers[currentQuestion] === option ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-400'}`}>Option {String.fromCharCode(65 + idx)}</span>
                                            <span className={`text-lg text-left ${answers[currentQuestion] === option ? 'text-gray-900 dark:text-white font-extrabold' : 'text-gray-700 dark:text-gray-300 font-semibold'}`}>{optionText}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-between mt-10 pt-8 border-t-2 border-gray-50 dark:border-gray-700/50">
                        <button
                            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                            disabled={currentQuestion === 0}
                            className="flex items-center px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-black uppercase tracking-widest text-xs disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-600 transition shadow-sm active:scale-95"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => {
                                if (currentQuestion < test.questions.length - 1) {
                                    setCurrentQuestion(currentQuestion + 1);
                                } else {
                                    handleSubmit();
                                }
                            }}
                            className="flex items-center px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl hover:from-red-700 hover:to-red-800 font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-red-500/30 transition active:scale-95"
                        >
                            {currentQuestion === test.questions.length - 1 ? 'Submit Exam' : 'Next Question'}
                        </button>
                    </div>
                </div>

                {/* Navigation Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sticky top-24 transition-colors border border-transparent dark:border-gray-700">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Question Matrix</h3>
                        <div className="grid grid-cols-4 gap-3">
                            {test.questions.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentQuestion(idx)}
                                    className={`h-12 w-full rounded-xl flex items-center justify-center text-xs font-black transition-all transform active:scale-90 ${currentQuestion === idx
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-400 ring-offset-4 dark:ring-offset-gray-800'
                                        : answers[idx]
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                                            : 'bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 space-y-3 pt-6 border-t dark:border-gray-700">
                            <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full mr-3 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                Answered
                            </div>
                            <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                                <div className="w-2.5 h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full mr-3" />
                                Pending
                            </div>
                            <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                                <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full mr-3 shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
                                Current
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
