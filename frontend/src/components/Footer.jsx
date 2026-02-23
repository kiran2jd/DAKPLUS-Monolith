import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import logo from '../assets/logo.jpg';

export default function Footer() {
    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors">
            <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center space-x-2 mb-4">
                            <img src={logo} alt="DAK Plus Logo" className="h-8 w-auto" />
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400">
                                DAK Plus
                            </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                            Premier platform for Dept Post exam preparations. Empowering thousands of postal employees to achieve their dreams.
                        </p>
                        <div className="flex space-x-4">
                            <Facebook className="w-5 h-5 text-gray-400 hover:text-blue-600 cursor-pointer transition" />
                            <Twitter className="w-5 h-5 text-gray-400 hover:text-blue-400 cursor-pointer transition" />
                            <Instagram className="w-5 h-5 text-gray-400 hover:text-pink-600 cursor-pointer transition" />
                            <Youtube className="w-5 h-5 text-gray-400 hover:text-red-600 cursor-pointer transition" />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li><Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-primary transition text-sm">Home</Link></li>
                            <li><Link to="/login" className="text-gray-500 dark:text-gray-400 hover:text-primary transition text-sm">Take Test</Link></li>
                            <li><Link to="/signup" className="text-gray-500 dark:text-gray-400 hover:text-primary transition text-sm">Join Now</Link></li>
                            <li><Link to="/dashboard/student/books" className="text-gray-500 dark:text-gray-400 hover:text-primary transition text-sm">Study Materials</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Support</h3>
                        <ul className="space-y-2">
                            <li><a href="mailto:support@dakplus.in" className="text-gray-500 dark:text-gray-400 hover:text-primary transition text-sm">Help Center</a></li>
                            <li><Link to="#" className="text-gray-500 dark:text-gray-400 hover:text-primary transition text-sm">Terms of Service</Link></li>
                            <li><Link to="#" className="text-gray-500 dark:text-gray-400 hover:text-primary transition text-sm">Privacy Policy</Link></li>
                            <li><Link to="#" className="text-gray-500 dark:text-gray-400 hover:text-primary transition text-sm">Refund Policy</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Contact Us</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center space-x-3">
                                <Mail className="w-4 h-4 text-primary" />
                                <span className="text-gray-500 dark:text-gray-400 text-sm">support@dakplus.in</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <Phone className="w-4 h-4 text-primary" />
                                <span className="text-gray-500 dark:text-gray-400 text-sm">+91 9291546714</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span className="text-gray-500 dark:text-gray-400 text-sm">Hyderabad, Telangana, India</span>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-700 text-center">
                    <p className="text-gray-400 text-xs">
                        &copy; {new Date().getFullYear()} DAK Plus. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
