import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { testService } from '../services/test';

export default function DocumentUpload({ onQuestionsExtracted, topicId, subtopicId }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [duplicateCount, setDuplicateCount] = useState(0);
    const [extractedQuestions, setExtractedQuestions] = useState([]);

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
            // FORCE PURE AI METHOD (Gemini Flash) for superior metadata preservation
            const questions = await testService.extractQuestions(file, topicId, subtopicId);
            
            if (!questions || questions.length === 0) {
                throw new Error("No questions could be extracted. Please ensure the document contains clear MCQ text.");
            }
            
            const dups = questions.filter(q => q.isDuplicate).length;
            setDuplicateCount(dups);
            setExtractedQuestions(questions);
            
            if (dups === 0) {
                onQuestionsExtracted(questions);
                setSuccess(true);
                setFile(null);
            }
        } catch (err) {
            console.error("Extraction Error:", err);
            setError(err.message || "Failed to extract questions. Please ensure the document is in the correct format.");
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

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                Our advanced AI will scan your document to extract questions, options, and metadata.
                Supports PDF and Word files.
            </p>

                <div className="relative group">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.docx,.doc"
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

                {duplicateCount > 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
                                <AlertCircle size={18} />
                                <span className="text-sm font-bold">{duplicateCount} Duplicates Found</span>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => {
                                        const cleanQuestions = extractedQuestions.filter(q => !q.isDuplicate);
                                        onQuestionsExtracted(cleanQuestions);
                                        setSuccess(true);
                                        setDuplicateCount(0);
                                        setFile(null);
                                    }}
                                    className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded hover:bg-amber-700 transition"
                                >
                                    Remove All & Add
                                </button>
                                <button
                                    onClick={() => {
                                        onQuestionsExtracted(extractedQuestions);
                                        setSuccess(true);
                                        setDuplicateCount(0);
                                        setFile(null);
                                    }}
                                    className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded hover:bg-amber-200 transition"
                                >
                                    Add All Anyway
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2">
                            A duplicate means this question already exists in another test within this Topic.
                        </p>
                    </div>
                )}

            <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-800/50">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Sample Format:</p>
                <p className="text-[10px] text-gray-500 mt-1 italic">
                    1. What is the capital of France? A) Paris B) London C) Berlin D) Rome Correct: A
                </p>
            </div>
        </div>
    );
}
