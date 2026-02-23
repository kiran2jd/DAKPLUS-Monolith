import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { testService } from '../services/test';

export default function DocumentUpload({ onQuestionsExtracted, topicId, subtopicId }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type === 'application/pdf' ||
                selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                setFile(selectedFile);
                setError('');
                setSuccess(false);
            } else {
                setError('Only PDF and DOCX files are supported.');
                setFile(null);
            }
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError('');
        try {
            const questions = await testService.extractQuestions(file, topicId, subtopicId);
            onQuestionsExtracted(questions);
            setSuccess(true);
            setFile(null);
        } catch (err) {
            console.error("Extraction Error:", err);
            setError("Failed to extract questions. Please ensure the document is in the correct format.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 sm:p-6 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center space-x-2">
                    <FileText className="text-indigo-600 dark:text-indigo-400" size={20} />
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base">Upload Q&A Document</h3>
                </div>
                {success && (
                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center">
                        <CheckCircle size={14} className="mr-1" /> Questions Added!
                    </span>
                )}
            </div>

            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload a PDF or Word document containing your questions. Our AI will automatically extract MCQs, options, and correct answers.
                </p>

                <div className="relative group">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.docx"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-between group-hover:border-indigo-300 transition ${file ? 'border-indigo-500' : ''}`}>
                        <div className="flex items-center space-x-3 overflow-hidden">
                            <Upload size={18} className="text-gray-400" />
                            <span className="text-sm text-gray-500 truncate">
                                {file ? file.name : "Select PDF or Word file"}
                            </span>
                        </div>
                        <button
                            type="button"
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 pointer-events-none"
                        >
                            Browse
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        <AlertCircle size={14} className="mr-2" /> {error}
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center space-x-2 hover:bg-indigo-700 disabled:bg-gray-400 transition shadow-lg shadow-indigo-500/20"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Processing Document...</span>
                        </>
                    ) : (
                        <>
                            <Upload size={18} />
                            <span>Extract Questions</span>
                        </>
                    )}
                </button>
            </div>

            <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-800/50">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Sample Format:</p>
                <p className="text-[10px] text-gray-500 mt-1 italic">
                    1. What is the capital of France? A) Paris B) London C) Berlin D) Rome Correct: A
                </p>
            </div>
        </div>
    );
}
