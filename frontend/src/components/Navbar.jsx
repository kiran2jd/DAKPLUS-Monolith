import { Link } from 'react-router-dom';
import logo from '../assets/logo.jpg';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
    return (
        <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <Link to="/" className="flex items-center space-x-2">
                        <img src={logo} alt="DAK Plus Logo" className="h-10 w-auto" />
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400">
                            DAK Plus
                        </span>
                    </Link>
                    <div className="flex items-center space-x-4">
                        <ThemeToggle />
                        <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-red-400 px-3 py-2 rounded-md font-medium">
                            Login
                        </Link>
                        <Link to="/signup" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-md">
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
