import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Shield, Star, Zap, CreditCard, Smartphone, QrCode, FileText } from 'lucide-react';
import Navbar from '../components/Navbar';
import { authService } from '../services/auth';
import { paymentService } from '../services/payment';
import { testService } from '../services/test';

// Function to dynamically load the Razorpay script
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function PaymentPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const testId = searchParams.get('testId');

    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [user, setUser] = useState(null);
    const [testDetails, setTestDetails] = useState(null);

    useEffect(() => {
        const source = searchParams.get('source');
        const token = searchParams.get('token');

        // If coming from mobile and we have a token, restore it
        if (source === 'mobile' && token && !localStorage.getItem('access_token')) {
            localStorage.setItem('access_token', token);
            // Optionally fetch profile if user object is missing
            if (!localStorage.getItem('user')) {
                authService.getProfile().then(profile => {
                    localStorage.setItem('user', JSON.stringify(profile));
                    setUser(profile);
                });
            }
        }

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else if (!token) { // Only redirect to login if we don't have a token from mobile
            // Enforce login for payment
            navigate(`/login?redirect=/payment${testId ? `?testId=${testId}` : ''}`);
        }

        if (testId) {
            loadTestDetails(testId);
        }
    }, [navigate, testId, searchParams]);

    const loadTestDetails = async (id) => {
        try {
            const test = await testService.getTestById(id);
            setTestDetails(test);
        } catch (error) {
            console.error("Failed to load test details", error);
        }
    };

    // 2. Map pricing based on user's exam choice
    const pricing = {
        'GDS to MTS': { amount: 199, id: 'MTS_EXAM', label: 'MTS Exam Prep' },
        'MTS': { amount: 199, id: 'MTS_EXAM', label: 'MTS Exam Prep' },
        'GDS to Postman': { amount: 299, id: 'PM_MG_EXAM', label: 'Postman/MG Prep' },
        'MTS to Postman': { amount: 299, id: 'PM_MG_EXAM', label: 'Postman/MG Prep' },
        'PM MG Exam': { amount: 299, id: 'PM_MG_EXAM', label: 'Postman/MG Prep' },
        'GDS/MTS/Postman to PA/SA': { amount: 499, id: 'PA_SA_EXAM', label: 'PA/SA Exam Prep' },
        'PA SA Exam': { amount: 499, id: 'PA_SA_EXAM', label: 'PA/SA Exam Prep' },
        'IP Exam': { amount: 999, id: 'IP_EXAM', label: 'IP Exam Prep' }
    };

    const userExam = user?.examType || 'Others';
    const selectedPlan = pricing[userExam] || { amount: 299, id: 'GENERAL_PRO', label: 'DAK Plus Pro' };

    const handlePayment = async () => {
        setProcessing(true);

        // 1. Load Razorpay Script
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
            alert('Razorpay SDK failed to load. Are you online?');
            setProcessing(false);
            return;
        }

        try {
            // Logic moved to component scope above

            // If testId is present, it's a individual test purchase (₹49), else specific Exam or Pro Subscription
            // TEST OVERRIDE: 50 INR for Plan
            const amount = testId ? 49 : 50; // selectedPlan.amount;
            const itemId = testId || selectedPlan.id;
            // FIX: Plans should be treated as SUBSCRIPTIONS to trigger Tier Upgrade in backend
            const itemType = testId ? 'TEST' : 'SUBSCRIPTION';

            const orderData = await paymentService.createOrder(amount, itemId, itemType);

            // 2.5 Handle Dummy Mode Simulation (Bypass Razorpay SDK)
            if (orderData.orderId && (orderData.orderId.startsWith('order_dummy_') || import.meta.env.VITE_RAZORPAY_KEY_ID === '')) {
                console.log('Dummy mode detected. Simulating payment success...');
                setTimeout(async () => {
                    const userId = user?.id || user?._id;
                    const dummyResponse = {
                        razorpay_order_id: orderData.orderId,
                        razorpay_payment_id: "pay_dummy_" + Date.now(),
                        razorpay_signature: "sig_dummy_" + Date.now(),
                        userId: userId
                    };

                    try {
                        const verificationResult = await paymentService.verifyPayment(dummyResponse);
                        if (verificationResult.status === 'success') {
                            if (itemType === 'SUBSCRIPTION') {
                                const updatedUser = { ...user, subscriptionTier: 'PREMIUM' };
                                localStorage.setItem('user', JSON.stringify(updatedUser));
                            }
                            setSuccess(true);
                            setTimeout(() => navigate(testId ? `/dashboard/take-test/${testId}` : '/dashboard'), 3000);
                        } else {
                            alert('Dummy payment verification failed.');
                        }
                    } catch (err) {
                        console.error('Verification Error:', err);
                        alert('Could not verify dummy payment.');
                    }
                }, 1500); // 1.5s delay for realistic feel
                return;
            }

            // 3. Configure Razorpay Options
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.amount * 100, // Amount in paise
                currency: "INR",
                name: "DAK Plus App",
                description: testId ? `Unlock Test: ${testDetails?.title || 'Premium Test'}` : `Unlock ${selectedPlan.label}`,
                image: "/logo.jpg", // DAKPlus Logo
                order_id: orderData.orderId,
                handler: async function (response) {
                    // 4. Verify Payment on Backend
                    const userId = user?.id || user?._id;
                    const verifyData = {
                        ...response,
                        userId: userId
                    };

                    try {
                        const verificationResult = await paymentService.verifyPayment(verifyData);
                        if (verificationResult.status === 'success') {
                            // Update local user state if subscription
                            if (itemType === 'SUBSCRIPTION') {
                                const updatedUser = { ...user, subscriptionTier: 'PREMIUM' };
                                localStorage.setItem('user', JSON.stringify(updatedUser));
                            }

                            setSuccess(true);
                            const source = searchParams.get('source');
                            setTimeout(() => {
                                if (source === 'mobile') {
                                    window.location.href = testId ? `dakplus://take-test/${testId}` : 'dakplus://dashboard';
                                } else {
                                    navigate(testId ? `/dashboard/take-test/${testId}` : '/dashboard');
                                }
                            }, 3000);
                        } else {
                            alert('Payment verification failed. Please contact support.');
                        }
                    } catch (err) {
                        console.error('Verification Error:', err);
                        alert('Could not verify payment automatically. Please check your dashboard later.');
                    }
                },
                prefill: {
                    name: user?.fullName || "",
                    email: user?.email || "",
                    contact: user?.phoneNumber || ""
                },
                notes: {
                    address: "DAK Plus Corporate Office"
                },
                theme: {
                    color: "#4F46E5" // Indigo-600 to match your design
                },
            };

            const rzp = new window.Razorpay(options);

            rzp.on('payment.failed', function (response) {
                alert(`Payment Failed: ${response.error.description}`);
            });

            rzp.open();
        } catch (error) {
            console.error('Payment initiation failed:', error);
            alert('Could not initiate payment. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-green-600 w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                        <p className="text-gray-600 mb-6">
                            {testId ? "You have successfully unlocked the test." : "Your exam content is now unlocked!"}
                            Redirecting...
                        </p>
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex-1 container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                            {testId ? 'Unlock Premium Test' : 'Unlock Your Exam Content'}
                        </h1>
                        <p className="text-xl text-gray-600">
                            {testId
                                ? 'Get immediate access to this exclusive practice test.'
                                : 'Unlock your full potential with unlimited access and advanced analytics.'}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-stretch">
                        {/* Benefits Column */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                            <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
                                <Star className="w-6 h-6 text-yellow-500 mr-2 fill-current" />
                                {testId ? 'Test Features' : 'Pro Benefits'}
                            </h3>
                            <ul className="space-y-6 flex-1">
                                <li className="flex items-start group">
                                    <div className="bg-green-100 p-1 rounded-full mr-4 mt-0.5 group-hover:scale-110 transition-transform">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-900">{testId ? 'Full Test Access' : 'Unlimited Mock Tests'}</span>
                                        <p className="text-sm text-gray-500">{testId ? 'Attempt all questions in this premium exam.' : 'Practice as much as you want without daily limits.'}</p>
                                    </div>
                                </li>
                                <li className="flex items-start group">
                                    <div className="bg-green-100 p-1 rounded-full mr-4 mt-0.5 group-hover:scale-110 transition-transform">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-900">Advanced AI Analytics</span>
                                        <p className="text-sm text-gray-500">Get deep insights generated by our AI engine.</p>
                                    </div>
                                </li>
                                <li className="flex items-start group">
                                    <div className="bg-green-100 p-1 rounded-full mr-4 mt-0.5 group-hover:scale-110 transition-transform">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-900">Detailed Explanations</span>
                                        <p className="text-sm text-gray-500">Step-by-step solutions for every test question.</p>
                                    </div>
                                </li>
                                {!testId && (
                                    <li className="flex items-start group">
                                        <div className="bg-green-100 p-1 rounded-full mr-4 mt-0.5 group-hover:scale-110 transition-transform">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-900">Priority Support</span>
                                            <p className="text-sm text-gray-500">Direct channel to our expert support team.</p>
                                        </div>
                                    </li>
                                )}
                            </ul>

                            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center text-sm text-gray-500 italic">
                                <Shield className="w-4 h-4 mr-2" />
                                Trusted by over 1,000+ students across India.
                            </div>
                        </div>

                        {/* Payment Column */}
                        <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-indigo-600 relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">
                                Best Value
                            </div>

                            <div className="mb-8 text-center">
                                <span className="text-xs text-indigo-600 uppercase tracking-widest font-black">
                                    {testId ? 'Single Test Access' : `${user?.examType || 'Exam'} Prep Access`}
                                </span>
                                {testId && testDetails && (
                                    <p className="text-gray-900 font-bold mt-2">{testDetails.title}</p>
                                )}
                                <div className="mt-4 flex items-center justify-center">
                                    <span className="text-5xl font-black text-gray-900">₹{testId ? '49' : selectedPlan.amount}</span>
                                    {!testId && <span className="text-gray-400 ml-2 font-medium">/ year</span>}
                                </div>
                                <p className="mt-2 text-sm text-gray-500">{testId ? 'One-time payment.' : 'Billed annually. Cancel anytime.'}</p>
                            </div>

                            <div className="space-y-6">
                                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <div className="flex items-center mb-3">
                                        <CreditCard className="w-5 h-5 text-indigo-600 mr-2" />
                                        <span className="text-sm font-bold text-gray-900">Secure Payment Options</span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Supports Cards, UPI (GPay, PhonePe), Netbanking, and Wallets via Razorpay Secure Checkout.
                                    </p>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={processing}
                                    className="w-full relative group flex items-center justify-center py-4 px-6 rounded-2xl shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 font-black text-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center">
                                        {processing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                                Initializing...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-5 h-5 mr-3 fill-current" />
                                                {testId ? 'Unlock Test Now' : 'Upgrade Now'}
                                            </>
                                        )}
                                    </span>
                                    <div className="absolute inset-0 w-1/4 h-full bg-white opacity-10 skew-x-[-20deg] group-hover:translate-x-[400%] transition-transform duration-700"></div>
                                </button>

                                <div className="text-center">
                                    <p className="text-[10px] text-gray-400 leading-tight">
                                        Secure transaction managed by Razorpay.
                                        By upgrading, you agree to our Terms and Data Privacy Policy.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
