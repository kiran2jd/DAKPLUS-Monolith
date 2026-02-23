import React, { useState } from 'react';
import { MessageCircle, Mail, X, HelpCircle } from 'lucide-react';

export default function HelpButton() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => setIsOpen(!isOpen);

    const openWhatsApp = () => {
        // Replace with your actual WhatsApp number
        window.open('https://wa.me/9291546714', '_blank');
    };

    const openEmail = () => {
        // Replace with your actual support email
        window.location.href = 'mailto:support@dakplus.in';
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {isOpen && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <button
                        onClick={openWhatsApp}
                        className="flex items-center justify-center w-12 h-12 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-all transform hover:scale-110"
                        title="Chat on WhatsApp"
                    >
                        <MessageCircle className="w-6 h-6" />
                    </button>
                    <button
                        onClick={openEmail}
                        className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all transform hover:scale-110"
                        title="Send Email"
                    >
                        <Mail className="w-6 h-6" />
                    </button>
                </div>
            )}

            <button
                onClick={toggleOpen}
                className={`flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all transform hover:scale-105 ${isOpen ? 'bg-gray-600 text-white rotate-90' : 'bg-indigo-600 text-white'}`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <HelpCircle className="w-8 h-8" />}
            </button>
        </div>
    );
}
