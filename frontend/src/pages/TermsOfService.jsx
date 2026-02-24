import React from "react";

function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-24 pb-16 lg:pt-32 lg:pb-24">
            <div className="max-w-4xl mx-auto px-6 w-full">
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-12 lg:p-16">
                    <div className="mb-12 border-b border-gray-100 pb-8 text-center">
                        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Terms of <span className="text-green-600">Service</span></h1>
                        <p className="text-gray-500 font-medium">Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>

                    <div className="prose prose-lg prose-green max-w-none text-gray-600 space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
                            <p>
                                By accessing our platform (FoodConnect), you agree to be bound by these Terms of Service and to use the Site in accordance with these Terms, our Privacy Policy, and any additional terms and conditions that may apply to specific sections of the Site or to products and services available through the Site.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. User Accounts</h2>
                            <p>
                                To utilize our food donation features, you must register for an account. You agree to:
                            </p>
                            <ul className="list-disc pl-6 mt-4 space-y-2">
                                <li>Provide accurate, current, and complete information during the registration process.</li>
                                <li>Maintain and promptly update your account information.</li>
                                <li>Maintain the security of your password and accept all risks of unauthorized access to your account.</li>
                                <li>Notify us immediately if you discover or suspect any security breaches.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Food Quality and Safety</h2>
                            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4 rounded-r-lg text-orange-800">
                                <strong>Critical Notice:</strong> As a donor, you are responsible for ensuring that all food posted on the platform is safe for human consumption at the time of posting. Food must not be contaminated, spoiled, or unsafe.
                            </div>
                            <p>
                                As an organization receiving food, you acknowledge that you must independently evaluate the safety and condition of the food upon pickup. FoodConnect is a technological marketplace connecting donors and receivers, but does not inspect, guarantee, or take liability for the physical food items exchanged.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
                            <p>You agree not to use the platform to:</p>
                            <ul className="list-disc pl-6 mt-4 space-y-2">
                                <li>Violate any local, state, national, or international law or regulations regarding food safety.</li>
                                <li>Post false, inaccurate, misleading, or deceptive content.</li>
                                <li>Distribute spam or malicious software.</li>
                                <li>Harass, abuse, or engage in malicious behavior against other users.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Termination</h2>
                            <p>
                                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TermsOfService;
