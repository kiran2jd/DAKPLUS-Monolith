import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, Bot, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', content: 'Namaste! I am your DAK Plus AI Assistant. How can I help you ace your postal exams today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Updated to use the api-gateway route
            const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
            const response = await axios.post(`${apiUrl}/chat`, {
                message: input
            });

            setMessages(prev => [...prev, { role: 'bot', content: response.data }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I'm having trouble connecting to my brain right now. Please try again later." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl transition transform hover:scale-110 flex items-center justify-center"
                >
                    <MessageSquare size={24} />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                    </span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white dark:bg-gray-800 w-[350px] sm:w-[400px] h-[500px] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center space-x-2">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">DAK Plus Assistant</h3>
                                <div className="flex items-center text-[10px] opacity-80">
                                    <span className="h-1.5 w-1.5 bg-green-400 rounded-full mr-1.5"></span>
                                    Online
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-lg transition">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'} items-end space-x-2`}>
                                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${msg.role === 'user' ? 'bg-indigo-500' : 'bg-gray-400'}`}>
                                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm border border-gray-100 dark:border-gray-600 rounded-bl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="flex flex-row items-end space-x-2">
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white">
                                        <Bot size={16} />
                                    </div>
                                    <div className="p-3 bg-white dark:bg-gray-700 text-gray-500 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-600">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your doubt here..."
                                className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-100 transition"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="absolute right-2 p-2 text-indigo-600 hover:text-indigo-700 disabled:text-gray-300 transition"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
