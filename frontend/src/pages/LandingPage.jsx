import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import appMockup from '../assets/app-mockup.png';
import { ArrowRight, CheckCircle, Smartphone, Globe, Shield, Star, Users, Zap, BookOpen } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans transition-colors duration-300">
            {/* Navbar */}
            <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <img src={logo} alt="DAKPlus Logo" className="h-14 w-auto" />
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400">
                            DAK Plus
                        </span>
                    </div>
                    <div className="hidden md:flex space-x-8 text-gray-600 dark:text-gray-300 font-medium">
                        <a href="#features" className="hover:text-red-600 dark:hover:text-red-400 transition">Features</a>
                        <a href="#testimonials" className="hover:text-red-600 dark:hover:text-red-400 transition">Stories</a>
                    </div>
                    <div className="flex space-x-4">
                        <Link to="/login" className="px-5 py-2 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition">
                            Log In
                        </Link>
                        <Link to="/signup" className="px-5 py-2 bg-red-600 text-white font-semibold rounded-full shadow-lg hover:bg-red-700 hover:shadow-red-500/30 transition transform hover:-translate-y-0.5">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-white dark:bg-gray-900 transition-colors">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl opacity-50 -z-10 animate-pulse"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-32 text-center">
                    <div className="inline-flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-8 animate-bounce">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <span>New: Updated Postal Syllabus</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6 md:mb-8 tracking-tight px-2">
                        Ace Your Postal Exams <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-red-600 dark:from-red-400 dark:via-orange-400 dark:to-red-400">
                            With DAK Plus
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed px-4">
                        Join thousands of postal aspirants preparing for their promotion exams. Experience real-time simulations, detailed analytics, and a user interface designed for success.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <Link to="/signup" className="group px-8 py-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-lg font-bold rounded-xl shadow-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition flex items-center justify-center">
                            Start Practicing
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition" />
                        </Link>
                        <Link to="/login" className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center">
                            Sign In
                        </Link>
                    </div>

                </div>
            </div>

            {/* Download App Section */}
            <div className="bg-gradient-to-r from-red-600 to-red-800 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="text-center md:text-left mb-8 md:mb-0 md:max-w-xl">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Take DAK Plus Anywhere</h2>
                            <p className="text-red-100 text-lg mb-6 leading-relaxed">
                                Join thousands of postal aspirants who are preparing on the go. Get the DAK Plus mobile app for a seamless offline experience and real-time notifications.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                                <a href="https://play.google.com/store/apps/details?id=com.kiran2jd.dakplus" target="_blank" rel="noopener noreferrer" className="flex items-center bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition border border-gray-800">
                                    <div className="mr-3">
                                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.523 15.3414L20.355 13.706C20.932 13.373 20.932 12.527 20.355 12.194L17.523 10.5586L15.334 12.9194L17.523 15.3414ZM16.326 16.6664L14.004 14.1024L11.5 16.8144V21.4194C11.5 21.6034 11.604 21.7714 11.769 21.8514C11.838 21.8844 11.912 21.9014 11.986 21.9014C12.102 21.9014 12.217 21.8594 12.308 21.7764L16.326 18.0674V16.6664ZM11.5 7.11438V2.48038C11.5 2.29638 11.396 2.12838 11.231 2.04838C11.066 1.96838 10.87 1.99138 10.728 2.10538L6.44 5.56438L8.799 8.17638L11.5 7.11438ZM14.004 11.7374L16.326 9.23338V7.83238L12.308 4.12338C12.164 3.99138 11.95 3.97238 11.785 4.07538C11.611 4.18438 11.503 4.37538 11.5 4.58238V19.3174C11.5 19.4974 11.601 19.6614 11.761 19.7424C11.829 19.7764 11.903 19.7924 11.977 19.7924C12.096 19.7924 12.214 19.7474 12.305 19.6644L16.326 16.0644V14.6644L14.004 12.0994L11.5 14.8114V9.02538L14.004 11.7374ZM5.485 6.32438L3.296 8.68538L5.485 11.1074L8.317 9.47238C8.894 9.13938 8.894 8.29338 8.317 7.96038L5.485 6.32538V6.32438Z" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[10px] uppercase font-bold text-gray-400">Get it on</div>
                                        <div className="text-sm font-bold">Google Play</div>
                                    </div>
                                </a>
                                <a href="#" className="flex items-center bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition border border-gray-800">
                                    <div className="mr-3">
                                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.71,19.5C17.88,20.74,17,21.95,15.66,21.97C14.32,22,13.89,21.18,12.37,21.18C10.84,21.18,10.37,21.95,9.1,22C7.79,22.05,6.8,20.68,5.96,19.47C4.25,17,2.94,12.45,4.7,9.39C5.57,7.87,7.13,6.91,8.82,6.88C10.1,6.86,11.32,7.75,12.11,7.75C12.89,7.75,14.37,6.68,15.92,6.84C16.57,6.87,18.39,7.1,19.56,8.82C19.47,8.88,17.39,10.1,17.41,12.63C17.44,15.65,20.06,16.66,20.09,16.67C20.07,16.74,19.67,18.11,18.71,19.5M13,3.5C13.73,2.67,14.94,2.04,15.94,2C16.07,3.17,15.6,4.35,14.9,5.19C14.21,6.04,13.07,6.7,11.95,6.61C11.8,5.46,12.36,4.26,13,3.5Z" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[10px] uppercase font-bold text-gray-400">Download on the</div>
                                        <div className="text-sm font-bold">App Store</div>
                                    </div>
                                </a>
                            </div>
                        </div>
                        <div className="hidden md:block relative">
                            <div className="w-64 h-[500px] bg-red-900/50 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden transform rotate-6 scale-105">
                                <div className="absolute inset-0 bg-red-600 flex items-center justify-center p-4">
                                    <Zap className="w-20 h-20 text-white opacity-20" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exams We Cover Section */}
            <div className="py-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-10">Departmental Exams We Cover</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "GDS to MTS", target: "Multi Tasking Staff" },
                            { title: "GDS/MTS to Postman", target: "Postman & Mail Guard" },
                            { title: "MTS/Postman to PA/SA", target: "Postal & Sorting Assistant" },
                            { title: "Inspector of Posts", target: "Inspector (IP)" }
                        ].map((exam, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500 transition-all group">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{exam.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">For promotion to {exam.target}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="bg-gray-50 dark:bg-gray-900/50 py-24 transition-colors" id="features">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-red-600 dark:text-red-400 font-semibold tracking-wide uppercase text-sm">Why DAK Plus?</h2>
                        <h2 className="mt-2 text-4xl font-extrabold text-gray-900 dark:text-white">Built exclusively for Postal Employees</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { icon: <BookOpen className="h-6 w-6 text-white" />, color: "bg-blue-500", title: "Up-to-Date Syllabus", desc: "Constantly updated with the latest PO Guide Part 1 & 2, Postal Manuals, and IT Modernization Project 2.0." },
                            { icon: <Smartphone className="h-6 w-6 text-white" />, color: "bg-green-500", title: "Learn During Shifts", desc: "Working long hours at the branch? Our mobile-first design lets you practice 10-minute quizzes during your commute or breaks." },
                            { icon: <Globe className="h-6 w-6 text-white" />, color: "bg-purple-500", title: "Bilingual Support", desc: "Practice mock tests and review detailed explanations in both English and your regional language." }
                        ].map((feature, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 group">
                                <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Career Progression Roadmap */}
            <div className="py-24 bg-white dark:bg-gray-900 transition-colors border-t border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Your Path to Success in India Post</h2>
                        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">DAK Plus supports your entire career journey.</p>
                    </div>
                    <div className="relative max-w-4xl mx-auto">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-red-100 dark:bg-red-900/30 -translate-y-1/2 z-0"></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                            {[
                                { step: "1", role: "GDS", text: "Start your journey", active: false },
                                { step: "2", role: "MTS", text: "First promotion", active: false },
                                { step: "3", role: "Postman", text: "Field operations", active: false },
                                { step: "4", role: "PA / SA", text: "Clerical mastery", active: true }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-center text-center">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-4 shadow-lg transition-transform hover:scale-110 ${item.active ? 'bg-red-600 text-white border-4 border-white dark:border-gray-900' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-4 border-gray-100 dark:border-gray-700'}`}>
                                        {item.step}
                                    </div>
                                    <h4 className={`text-lg font-bold ${item.active ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{item.role}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>



            {/* Special Guidance & Content */}
            <div className="py-24 bg-white dark:bg-gray-900 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Expert Guidance & Resources</h2>
                        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">More than just tests. We provide the roadmap to your goal.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="space-y-8">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-colors">
                                            <Users className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors">Personalized Mentorship</h3>
                                        <p className="mt-2 text-gray-600 dark:text-gray-400 transition-colors">Stuck on a concept? Schedule a 15-minute doubt-clearing session with our subject matter experts.</p>
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 transition-colors">
                                            <Zap className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors">Smart Study Planners</h3>
                                        <p className="mt-2 text-gray-600 dark:text-gray-400 transition-colors">Our AI generates a custom study schedule based on your exam date and current performance level.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-100 dark:border-gray-800 transition-colors transform hover:scale-105 duration-500">
                            <img src={appMockup} alt="DAK Plus App Dashboard" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Testimonials */}
            <div className="bg-gray-900 py-24 text-white relative overflow-hidden" id="testimonials">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[100px] opacity-20 translate-x-1/2 -translate-y-1/2"></div>
                <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-extrabold mb-16">Trusted by Top Performers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-800/50 backdrop-blur p-10 rounded-2xl border border-gray-700 hover:border-indigo-500 transition">
                            <div className="flex text-yellow-400 mb-4 space-x-1">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-5 w-5 fill-current" />)}
                            </div>
                            <p className="text-xl italic text-gray-300 mb-6">"DAK Plus helped me crack the Inspector of Posts exam. The detailed analytics showed me exactly which topics I was weak in so I could focus my study time efficiently."</p>
                            <div className="flex items-center justify-center space-x-4">
                                <div className="h-12 w-12 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-xl">R</div>
                                <div className="text-left">
                                    <div className="font-bold">Rahul Sharma</div>
                                    <div className="text-sm text-gray-400">Postal Assistant</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur p-10 rounded-2xl border border-gray-700 hover:border-indigo-500 transition">
                            <div className="flex text-yellow-400 mb-4 space-x-1">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-5 w-5 fill-current" />)}
                            </div>
                            <p className="text-xl italic text-gray-300 mb-6">"The interface is so smooth and easy to use on my phone. Practicing the GDS to MTS mock tests on the go was exactly what I needed to clear the exam!"</p>
                            <div className="flex items-center justify-center space-x-4">
                                <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center font-bold text-xl">P</div>
                                <div className="text-left">
                                    <div className="font-bold">Priya Patel</div>
                                    <div className="text-sm text-gray-400">GDS Postmaster</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* About Us */}
            <div className="py-24 bg-gray-50 dark:bg-gray-900/50 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:flex lg:items-center lg:space-x-16">
                        <div className="lg:w-1/2 mb-12 lg:mb-0">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                                <div className="absolute inset-0 bg-indigo-600 opacity-20 transition-opacity"></div>
                                {/* Placeholder for an office or team image */}
                                <div className="h-96 bg-gray-300 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">
                                    <Users className="h-24 w-24 opacity-50" />
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">About Us</h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                                Founded in 2026, DAK Plus was born from a simple idea: Preparation should be smarter, not harder.
                            </p>
                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                                We are a team of educators and engineers dedicated to democratizing quality education. Our mission is to empower students worldwide with the tools they need to achieve their academic and professional goals.
                            </p>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-bold text-xl text-indigo-600 dark:text-indigo-400">Our Mission</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-500 mt-2">To provide accessible, high-quality assessment tools for everyone.</p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-xl text-indigo-600 dark:text-indigo-400">Our Vision</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-500 mt-2">A world where every learner has the confidence to succeed.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Us */}
            <div className="py-24 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 transition-colors">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 transition-colors">Get in Touch</h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 transition-colors">Have questions? We'd love to hear from you.</p>

                    <form className="space-y-6 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Name</label>
                                <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Email</label>
                                <input type="email" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all" placeholder="john@example.com" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Message</label>
                            <textarea rows="4" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all" placeholder="How can we help you?"></textarea>
                        </div>
                        <button type="button" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-lg shadow-lg hover:bg-indigo-700 transition transform hover:-translate-y-1">
                            Send Message
                        </button>
                    </form>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 py-12 text-gray-400 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <span className="text-2xl font-bold text-white">DAK Plus</span>
                        <p className="text-sm mt-2">Empowering learners worldwide.</p>
                    </div>
                    <div className="flex space-x-8 text-sm">
                        <a href="#" className="hover:text-white transition">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition">Terms of Service</a>
                        <a href="#" className="hover:text-white transition">Contact Support</a>
                    </div>
                    <div className="mt-8 md:mt-0 text-sm">
                        &copy; 2026 DAK Plus. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
