import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resultService } from '../services/result';
import { CheckCircle, XCircle, BarChart2, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ResultPage() {
    const { resultId } = useParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        const loadResult = async () => {
            try {
                const data = await resultService.getResultById(resultId);
                setResult(data);

                // Trigger confetti if passed (>= 40%)
                if (data.percentage >= 40) {
                    confetti({
                        particleCount: 200,
                        spread: 70,
                        origin: { y: 0.3 },
                        colors: ['#10b981', '#34d399', '#6ee7b7']
                    });
                }
            } catch (err) {
                console.error("Failed to load result", err);
            } finally {
                setLoading(false);
            }
        };
        loadResult();
    }, [resultId]);

    if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin h-12 w-12 border-4 border-red-600 border-t-transparent rounded-full"></div></div>;
    if (!result) return <div className="p-8 text-center text-red-500">Result not found</div>;

    const isPassed = result.percentage >= 40;
    const detailedAnswers = result.detailedAnswers || {};
    const detailedAnswersArray = Object.keys(detailedAnswers)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(key => ({ ...detailedAnswers[key], index: parseInt(key) }));

    const filteredAnswers = detailedAnswersArray.filter(item => {
        if (filter === 'ALL') return true;
        if (filter === 'CORRECT') return item.correct;
        if (filter === 'WRONG') return !item.correct && (item.userAnswer !== null && item.userAnswer !== 'Not Answered'); // Assuming wrong means attempted but incorrect
        if (filter === 'UNATTEMPTED') return item.userAnswer === null || item.userAnswer === 'Not Answered';
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Gradient Header matching mobile app */}
            <div className={`${isPassed ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-red-600 to-red-700'} px-6 py-12 md:py-16 rounded-b-3xl shadow-xl`}>
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-white text-2xl md:text-3xl font-bold mb-6">
                        {isPassed ? 'Congratulations!' : 'Keep Trying!'}
                    </h1>

                    {/* Circular Score Display */}
                    <div className="flex justify-center mb-6">
                        <div className="w-36 h-36 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/40 flex flex-col items-center justify-center">
                            <div className="text-white text-5xl font-extrabold">{Math.round(result.percentage)}%</div>
                            <div className="text-white/90 text-sm mt-1">{result.score}/{result.totalPoints}</div>
                        </div>
                    </div>

                    <p className="text-white text-lg font-semibold">{result.testTitle}</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                        <p className="text-gray-500 text-xs mb-1">Attempted</p>
                        <p className="text-gray-900 text-2xl font-bold">
                            {Object.values(result.answers || {}).filter(a => a !== null && a !== 'Not Answered').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                        <p className="text-gray-500 text-xs mb-1">Correct</p>
                        <p className="text-green-600 text-2xl font-bold">{result.correctAnswers || 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                        <p className="text-gray-500 text-xs mb-1">Wrong</p>
                        <p className="text-red-600 text-2xl font-bold">{result.wrongAnswers || 0}</p>
                    </div>
                </div>

                {/* Back to Dashboard Button */}
                <Link
                    to="/dashboard"
                    className="block w-full bg-red-600 text-white text-center py-4 rounded-2xl font-bold hover:bg-red-700 transition shadow-lg mb-8"
                >
                    Back to Dashboard
                </Link>

                {/* Detailed Review Section */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Detailed Review</h2>
                    <div className="flex gap-2 text-xs">
                        <button onClick={() => setFilter('ALL')} className={`px-3 py-1 rounded-lg font-bold border transition ${filter === 'ALL' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600'}`}>All</button>
                        <button onClick={() => setFilter('CORRECT')} className={`px-3 py-1 rounded-lg font-bold border transition ${filter === 'CORRECT' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}>Correct</button>
                        <button onClick={() => setFilter('WRONG')} className={`px-3 py-1 rounded-lg font-bold border transition ${filter === 'WRONG' ? 'bg-red-600 text-white' : 'bg-white text-gray-600'}`}>Wrong</button>
                        <button onClick={() => setFilter('UNATTEMPTED')} className={`px-3 py-1 rounded-lg font-bold border transition ${filter === 'UNATTEMPTED' ? 'bg-gray-400 text-white' : 'bg-white text-gray-600'}`}>Skipped</button>
                    </div>
                </div>

                {filteredAnswers.length > 0 ? (
                    <div className="space-y-4">
                        {filteredAnswers.map((detail, idx) => (
                            <div
                                key={idx}
                                className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${detail.correct ? 'border-green-600' : 'border-red-600'}`}
                            >
                                <p className="text-gray-900 font-bold text-base mb-3">
                                    {detail.index + 1}. {detail.questionText}
                                </p>

                                <div className="flex justify-between items-center mb-2">
                                    <p className={`text-sm font-semibold ${detail.correct ? 'text-green-600' : 'text-red-600'}`}>
                                        Your Answer: {detail.userAnswer || 'Not Answered'}
                                    </p>
                                    {detail.correct ? (
                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
                                            ✓ Correct
                                        </span>
                                    ) : (
                                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
                                            ✗ Incorrect
                                        </span>
                                    )}
                                </div>

                                {!detail.correct && (
                                    <p className="text-green-600 font-bold text-sm mb-2">
                                        Correct Answer: {detail.correctAnswer}
                                    </p>
                                )}

                                {(detail.explanation || detail.shortAnswer || detail.comment) && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-3">
                                        <p className="text-red-600 text-xs font-bold uppercase mb-1">Feedback:</p>
                                        <p className="text-gray-700 text-sm leading-relaxed">
                                            {detail.explanation || detail.shortAnswer || detail.comment}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl p-8 text-center">
                        <p className="text-gray-400">No questions match the selected filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
