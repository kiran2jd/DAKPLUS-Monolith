import { useState } from 'react';
import { X, Send, AlertTriangle } from 'lucide-react';
import { reportService } from '../services/report';

export default function ReportModal({ isOpen, onClose, questionId, testId, questionText }) {
    const [issueType, setIssueType] = useState('WRONG_OPTION');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await reportService.submitReport({
                questionId,
                testId,
                issueType,
                description
            });
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setDescription('');
            }, 2000);
        } catch (error) {
            console.error('Failed to submit report:', error);
            alert('Failed to submit report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-gray-100 dark:border-gray-700">
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className="text-white h-5 w-5" />
                        <h2 className="text-white font-black uppercase tracking-widest text-sm">Report Issue</h2>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {success ? (
                        <div className="py-12 text-center animate-in slide-in-from-bottom duration-500">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send className="text-green-600 dark:text-green-400 h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Report Submitted!</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Our team will review this shortly. Thank you!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Question Reference</p>
                                <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2 italic font-serif">"{questionText}"</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Issue Type</label>
                                <select
                                    value={issueType}
                                    onChange={(e) => setIssueType(e.target.value)}
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition dark:text-white font-bold"
                                >
                                    <option value="WRONG_OPTION">Incorrect Options</option>
                                    <option value="TYPO">Typo / Spelling Error</option>
                                    <option value="TRANSLATION_ERROR">Hindi Translation Error</option>
                                    <option value="IMAGE_ISSUE">Incorrect Image</option>
                                    <option value="OTHER">Other Issue</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Tell us what's wrong..."
                                    rows={4}
                                    required
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition dark:text-white"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-red-500/20 hover:bg-red-700 transition transform active:scale-95 flex items-center justify-center space-x-2"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Submitting...</span>
                                    </span>
                                ) : (
                                    <>
                                        <span>Send Report</span>
                                        <Send size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
