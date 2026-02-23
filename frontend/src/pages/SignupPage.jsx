import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../services/auth';
import logo from '../assets/logo.jpg';

export default function SignupPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [phone, setPhone] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        notificationsEnabled: true,
        postalCircle: '',
        division: '',
        office: '',
        cadre: '',
        examType: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [existingUser, setExistingUser] = useState(false);

    useEffect(() => {
        // If phone passed from Login, prefill it. 
        // If verified flag is present, jump to profile.
        // OTHERWISE: Do nothing, let user start at 'init-phone' (Fixes redirect loop).
        if (location.state?.phone) {
            setPhone(location.state.phone);
        }
    }, [location]);

    const validate = () => {
        setError('');
        if (!formData.fullName || formData.fullName.trim().length < 3) {
            setError("Full Name must be at least 3 characters long");
            return false;
        }

        // Strict Email Regex
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
            setError("Please enter a valid email address");
            return false;
        }

        if (!formData.password || formData.password.length < 6) {
            setError("Password must be at least 6 characters long");
            return false;
        }

        // Strict Phone Regex: 10-15 digits
        const phoneRegex = /^\d{10,15}$/;
        // Remove spaces or dashes for validation
        const cleanPhone = phone ? phone.replace(/[\s-]/g, '') : '';
        if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
            setError("Phone number must be between 10 and 15 digits");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setExistingUser(false);

        if (!validate()) return;

        setLoading(true);

        try {
            await authService.register({
                phoneNumber: phone,
                fullName: formData.fullName,
                email: formData.email,
                role: 'student',
                password: formData.password,
                notificationsEnabled: formData.notificationsEnabled,
                postalCircle: formData.postalCircle,
                division: formData.division,
                office: formData.office,
                cadre: formData.cadre,
                examType: formData.examType
            });
            // Auto-login: Token is already saved by authService.register
            navigate('/dashboard');
        } catch (err) {
            const message = err.response?.data?.message || err.response?.data?.detail || 'Registration failed';
            if (message.includes("already exists")) {
                setError("You are already a member! Please use your password or OTP to log in.");
                setExistingUser(true);
            } else {
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors">
                <div className="flex flex-col items-center">
                    <img src={logo} alt="DAK Plus Logo" className="h-20 w-auto mb-2" />
                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Already have an account?{' '}
                            <Link to="/login" className="font-bold text-red-600 dark:text-red-400 hover:text-red-500">
                                Log In
                            </Link>
                        </p>
                    </div>
                    <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Create Account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Join DAK Plus to start your journey
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-4 border border-red-100 dark:border-red-800 transition-colors">
                        {error}
                        {existingUser && (
                            <div className="mt-2 pt-2 border-t border-amber-100">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="font-bold underline text-amber-900 hover:text-amber-700 decoration-2 underline-offset-4"
                                >
                                    Go to Login Page
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input
                                    name="fullName"
                                    type="text"
                                    required
                                    className="appearance-none block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm transition-all"
                                    placeholder="Enter full name"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="appearance-none block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm transition-all"
                                    placeholder="Enter email address"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm transition-all"
                                    placeholder="Enter password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                <input
                                    name="phone"
                                    type="tel"
                                    required
                                    className="appearance-none block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm transition-all"
                                    placeholder="Enter phone number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>

                            {/* Additional Information Section */}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">Professional Details</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="mb-4">
                                        <label htmlFor="postalCircle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Postal Circle</label>
                                        <select
                                            id="postalCircle"
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 transition-colors"
                                            value={formData.postalCircle}
                                            onChange={(e) => setFormData({ ...formData, postalCircle: e.target.value })}
                                        >
                                            <option value="">Select Circle</option>
                                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                                            <option value="Telangana">Telangana</option>
                                            <option value="Karnataka">Karnataka</option>
                                            <option value="Tamil Nadu">Tamil Nadu</option>
                                            <option value="Kerala">Kerala</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="division" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Division</label>
                                        <input
                                            id="division"
                                            type="text"
                                            placeholder="Enter Division"
                                            className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm transition-all"
                                            value={formData.division}
                                            onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="office" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Office</label>
                                        <input
                                            id="office"
                                            type="text"
                                            placeholder="Enter Office"
                                            className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm transition-all"
                                            value={formData.office}
                                            onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="cadre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cadre</label>
                                        <select
                                            id="cadre"
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 transition-colors"
                                            value={formData.cadre}
                                            onChange={(e) => setFormData({ ...formData, cadre: e.target.value })}
                                        >
                                            <option value="">Select Cadre</option>
                                            <option value="GDS">GDS</option>
                                            <option value="MTS">MTS</option>
                                            <option value="Postman">Postman</option>
                                            <option value="Mail Guard">Mail Guard</option>
                                            <option value="PA/SA">PA/SA</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>

                                    <div className="mb-4 md:col-span-2">
                                        <label htmlFor="examType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Exam</label>
                                        <select
                                            id="examType"
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 transition-colors"
                                            value={formData.examType}
                                            onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                                        >
                                            <option value="">Select Exam</option>
                                            <option value="GDS to MTS">GDS to MTS</option>
                                            <option value="GDS to Postman">GDS to Postman</option>
                                            <option value="MTS to Postman">MTS to Postman</option>
                                            <option value="GDS/MTS/Postman to PA/SA">GDS/MTS/Postman to PA/SA</option>
                                            <option value="IP Exam">IP Exam</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all shadow-lg hover:shadow-red-500/30"
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
