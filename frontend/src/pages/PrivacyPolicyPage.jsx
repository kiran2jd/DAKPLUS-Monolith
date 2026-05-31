import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="bg-gradient-to-r from-red-600 to-orange-600 px-8 py-10 text-white relative">
                    <Link to="/" className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors">
                        <ArrowLeft size={20} className="text-white" />
                    </Link>
                    <div className="text-center mt-4">
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Privacy Policy</h1>
                        <p className="text-red-100">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                </div>
                
                <div className="p-8 md:p-12 space-y-8 text-gray-700 dark:text-gray-300">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
                        <p className="leading-relaxed">
                            Welcome to DAK Plus ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us at dakplus.in@gmail.com.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Information We Collect</h2>
                        <p className="leading-relaxed mb-3">
                            We collect personal information that you voluntarily provide to us when you register on the App, express an interest in obtaining information about us or our products and Services, or otherwise when you contact us.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                            <li><strong>Personal Information:</strong> Names; phone numbers; email addresses; passwords; and other similar information.</li>
                            <li><strong>Educational Information:</strong> Departmental exams you are preparing for, quiz scores, and app usage metrics to provide tailored educational content.</li>
                            <li><strong>Device Data:</strong> We may collect device information (such as your mobile device ID, model, and manufacturer) to ensure app stability and performance.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. How We Use Your Information</h2>
                        <p className="leading-relaxed mb-3">We use personal information collected via our App for a variety of business purposes described below:</p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                            <li><strong>To facilitate account creation and logon process.</strong></li>
                            <li><strong>To deliver and facilitate delivery of services to the user:</strong> We use your information to provide you with the requested educational content and mock tests.</li>
                            <li><strong>To send administrative information to you:</strong> We may use your personal information to send you product, service, and new feature information and/or information about changes to our terms, conditions, and policies.</li>
                            <li><strong>To request feedback:</strong> We may use your information to request feedback and to contact you about your use of our App.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Will Your Information Be Shared With Anyone?</h2>
                        <p className="leading-relaxed">
                            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We do not sell your personal information to third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Data Retention and Deletion</h2>
                        <p className="leading-relaxed">
                            We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law.
                            <br/><br/>
                            <strong>Data Deletion Request:</strong> If you would like to request the deletion of your personal data, you can do so by contacting us at dakplus.in@gmail.com or navigating to the Account Settings section within the App and selecting "Delete Account". Upon receiving your request, we will delete or anonymize your information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Security of Your Information</h2>
                        <p className="leading-relaxed">
                            We aim to protect your personal information through a system of organizational and technical security measures. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Updates to This Policy</h2>
                        <p className="leading-relaxed">
                            We may update this privacy notice from time to time. The updated version will be indicated by an updated "Last updated" date and the updated version will be effective as soon as it is accessible. We encourage you to review this privacy notice frequently to be informed of how we are protecting your information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Contact Us</h2>
                        <p className="leading-relaxed">
                            If you have questions or comments about this notice, you may email us at dakplus.in@gmail.com or by post to:
                            <br/><br/>
                            <strong>DAK Plus</strong><br/>
                            Hyderabad, Telangana<br/>
                            India
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
