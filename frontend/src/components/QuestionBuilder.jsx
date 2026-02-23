import { useState } from 'react';
import { Trash2, Plus, Image as ImageIcon, X } from 'lucide-react';

export default function QuestionBuilder({ questions, setQuestions }) {
    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                text: '',
                type: 'mcq',
                options: ['', '', '', ''],
                correctAnswer: '', // stored as string for simplicity: option text or index
                points: 1,
                explanation: '',
                imageUrl: '' // manual image upload support
            }
        ]);
    };

    const removeQuestion = (index) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
    };

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleImageUpload = (index, e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("Image size should be less than 2MB");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            updateQuestion(index, 'imageUrl', reader.result);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = (index) => {
        updateQuestion(index, 'imageUrl', '');
    };

    const updateOption = (qIndex, oIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };

    return (
        <div className="space-y-6">
            {questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-white dark:bg-gray-800/50 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700 relative">
                    <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="absolute top-2 sm:top-4 right-2 sm:right-4 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <Trash2 size={18} />
                    </button>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">Question {qIndex + 1}</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-white text-gray-900"
                                    value={q.text}
                                    onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                                    placeholder="Enter question text here"
                                />
                            </div>
                            <div className="md:w-48">
                                <label className="block text-sm font-medium text-gray-700">Image / Diagram</label>
                                {!q.imageUrl ? (
                                    <div className="mt-1 flex items-center">
                                        <label className="cursor-pointer bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 flex items-center justify-center text-sm text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 w-full shadow-sm">
                                            <ImageIcon size={16} className="mr-2" />
                                            Upload
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(qIndex, e)}
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="mt-1 relative group">
                                        <img
                                            src={q.imageUrl}
                                            alt="Question"
                                            className="h-20 w-full object-contain border rounded-md"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(qIndex)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-white text-gray-900"
                                    value={q.type}
                                    onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                                >
                                    <option value="mcq">Multiple Choice</option>
                                    <option value="true_false">True/False</option>
                                    <option value="descriptive">Descriptive</option>
                                </select>
                            </div>
                            <div className="sm:col-span-1">
                                <label className="block text-sm font-medium text-gray-700">Points</label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
                                    value={q.points}
                                    onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
                                />
                            </div>
                        </div>

                        {q.type === 'mcq' && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Options <span className="text-red-500 text-xs ml-2">(Click the radio button to mark the correct answer)</span>
                                </label>
                                {q.options.map((option, oIndex) => (
                                    <div key={oIndex} className="flex items-center space-x-2">
                                        <div className="pt-1">
                                            <input
                                                type="radio"
                                                name={`correct-${qIndex}`}
                                                checked={q.correctAnswer === option && option !== ''}
                                                onChange={() => updateQuestion(qIndex, 'correctAnswer', option)}
                                                className="focus:ring-primary h-5 w-5 text-primary border-gray-300 cursor-pointer"
                                                title="Mark as Correct Answer"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
                                            value={option}
                                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                            placeholder={`Option ${oIndex + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {q.type === 'true_false' && (
                            <div className="flex space-x-4 mt-2">
                                <span className="text-sm font-medium text-gray-700">Correct Answer:</span>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`correct-${qIndex}`}
                                        value="True"
                                        checked={q.correctAnswer === 'True'}
                                        onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                                        className="mr-2 text-primary focus:ring-primary"
                                    />
                                    True
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`correct-${qIndex}`}
                                        value="False"
                                        checked={q.correctAnswer === 'False'}
                                        onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                                        className="mr-2 text-primary focus:ring-primary"
                                    />
                                    False
                                </label>
                            </div>
                        )}

                        {/* Explanation Field - Available for all question types */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Explanation / Feedback <span className="text-gray-400 text-xs">(Optional - shown to students after test)</span>
                            </label>
                            <textarea
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
                                rows={3}
                                value={q.explanation || ''}
                                onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                placeholder="Provide an explanation for the correct answer or additional feedback for students..."
                            />
                        </div>
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={addQuestion}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition flex justify-center items-center"
            >
                <Plus size={20} className="mr-2" /> Add Question
            </button>
        </div>
    );
}
