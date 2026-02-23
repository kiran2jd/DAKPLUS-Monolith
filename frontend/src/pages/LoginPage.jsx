import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import logo from '../assets/logo.jpg';

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/dashboard';
    const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
    const [step, setStep] = useState('input'); // 'input' or 'otp-verify'

    // Form state
    const [identifier, setIdentifier] = useState(''); // email or phone
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        if (!identifier || !password) {
            setError('Please enter both identifier and password');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await authService.login(identifier, password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    // Handle OTP send
    const handleSendOtp = async (e) => {
        e.preventDefault();

        // Strict Phone Regex: 10-15 digits
        const phoneRegex = /^\d{10,15}$/;
        if (!phone || !phoneRegex.test(phone)) {
            setError("Please enter a valid phone number (10-15 digits)");
            return;
        }

        setLoading(true);
        setError('');
        try {
            await authService.sendOtp(phone);
            setStep('otp-verify');
            setOtpSent(true);
            startResendTimer();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // Handle OTP verification
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter complete OTP');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const data = await authService.verifyOtp(phone, otpCode);
            if (data.is_new_user) {
                navigate('/signup', { state: { phone } });
            } else {
                navigate(from, { replace: true });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    // OTP input handling
    const handleOtpChange = (index, value) => {
        if (value.length > 1) value = value[0];
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    // Resend OTP timer
    const startResendTimer = () => {
        setResendTimer(60);
        const interval = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setOtp(['', '', '', '', '', '']);
        await handleSendOtp({ preventDefault: () => { } });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="flex flex-col items-center">
                    <img src={logo} alt="DAK Plus Logo" className="h-20 w-auto mb-4" />
                    <h2 className="text-center text-3xl font-extrabold text-gray-900">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Sign in to continue your learning journey
                    </p>
                </div>

                {/* Login Method Toggle */}
                {step === 'input' && (
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setLoginMethod('password')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${loginMethod === 'password'
                                ? 'bg-white text-red-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Lock className="inline h-4 w-4 mr-1" />
                            Password
                        </button>
                        <button
                            onClick={() => setLoginMethod('otp')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${loginMethod === 'otp'
                                ? 'bg-white text-red-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Phone className="inline h-4 w-4 mr-1" />
                            OTP
                        </button>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                {/* Password Login Form */}
                {loginMethod === 'password' && step === 'input' && (
                    <form className="mt-8 space-y-6" onSubmit={handlePasswordLogin}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email or Phone
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        id="identifier"
                                        name="identifier"
                                        type="text"
                                        required
                                        className="pl-10 appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Enter email or phone"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        className="pl-10 appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                        </button>
                    </form>
                )}

                {/* OTP Login Form */}
                {loginMethod === 'otp' && step === 'input' && (
                    <form className="mt-8 space-y-6" onSubmit={handleSendOtp}>
                        <div>
                            <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Phone Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <input
                                    id="phone-number"
                                    name="phone"
                                    type="tel"
                                    required
                                    className="pl-10 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="+1234567890"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
                        >
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                        </button>
                    </form>
                )}

                {/* OTP Verification */}
                {step === 'otp-verify' && (
                    <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                                Enter 6-digit code sent to {phone}
                            </label>
                            <div className="flex justify-center space-x-2">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`otp-${index}`}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                                    />
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        <div className="text-center space-y-2">
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={resendTimer > 0}
                                className="text-sm text-red-600 hover:text-red-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                            </button>
                            <div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('input');
                                        setOtp(['', '', '', '', '', '']);
                                    }}
                                    className="text-sm text-gray-600 hover:text-gray-900"
                                >
                                    Change Phone Number
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-bold text-red-600 dark:text-red-400 hover:text-red-500">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
