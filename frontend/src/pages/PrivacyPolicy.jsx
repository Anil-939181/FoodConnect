import React from "react";

function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-24 pb-16 lg:pt-32 lg:pb-24">
            <div className="max-w-4xl mx-auto px-6 w-full">
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-12 lg:p-16">
                    <div className="mb-12 border-b border-gray-100 pb-8 text-center">
                        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Privacy <span className="text-green-600">Policy</span></h1>
                        <p className="text-gray-500 font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>

                    <div className="prose prose-lg prose-green max-w-none text-gray-600 space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                            <p>
                                Welcome to FoodConnect. We are committed to protecting your personal information and your right to privacy.
                                If you have any questions or concerns about our policy, or our practices with regards to your personal
                                information, please contact us.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
                            <p>We collect personal information that you voluntarily provide to us when registering on the platform, making a donation, or picking up food. This may include:</p>
                            <ul className="list-disc pl-6 mt-4 space-y-2">
                                <li>Name, email address, and phone number</li>
                                <li>Physical address or location data (to facilitate local matching)</li>
                                <li>Photos of food donations</li>
                                <li>Account credentials (passwords are encrypted and never visible to us)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
                            <p>We use personal information collected via our platform for a variety of business purposes, including:</p>
                            <ul className="list-disc pl-6 mt-4 space-y-2">
                                <li>To facilitate account creation and logon process</li>
                                <li>To connect donors with organizations based on geographical proximity</li>
                                <li>To send administrative information to you (e.g., OTP emails, request updates)</li>
                                <li>To fulfill and manage food donations</li>
                                <li>To enforce our terms, conditions and policies</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Sharing Your Information</h2>
                            <p>
                                We only share and disclose your information in the following situations:
                            </p>
                            <ul className="list-disc pl-6 mt-4 space-y-2">
                                <li>
                                    <strong className="text-gray-900">Between Users:</strong> When a donor approves an organization's request for food, we share the donor's contact and location details with that specific organization to facilitate pickup.
                                    Until approval, donor addresses are kept private.
                                </li>
                                <li>
                                    <strong className="text-gray-900">Legal Compliance:</strong> We may disclose your information where we are legally required to do so.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
                            <p>
                                We have implemented appropriate technical and organizational security measures designed to protect the
                                security of any personal information we process. However, please also remember that we cannot guarantee
                                that the internet itself is 100% secure.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicy;
