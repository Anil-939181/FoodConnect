import React, { useState } from "react";
import API from "../services/api";

function ContactUs() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorText, setErrorText] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorText("");

        try {
            await API.post("/contact", formData);
            setSubmitted(true);
            setFormData({ name: "", email: "", subject: "", message: "" });
            setTimeout(() => setSubmitted(false), 5000);
        } catch (err) {
            setErrorText(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-24 pb-16 md:pt-32 pb-24">
            <div className="max-w-7xl mx-auto px-6 w-full">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
                        Get in <span className="text-green-600">Touch</span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Have questions about donating, receiving food, or partnering with us? Our team is available 24/7 to help you make an impact.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-12 lg:gap-8">
                    {/* Contact Details Card */}
                    <div className="w-full lg:w-1/3 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Our Office</h3>
                            <p className="text-gray-600 leading-relaxed">
                                FoodConnect<br />
                                Kadapa District<br />
                                RGUKT Valley, AP 516330
                            </p>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Email Us</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                We'll respond within 24 hours.
                            </p>
                            <a href="mailto:support@foodconnect.in" className="text-blue-600 font-semibold hover:underline">
                                foodconnect@gmail.com
                            </a>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Call Us</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                Available Mon-Fri, 9am - 6pm.
                            </p>
                            <a href="tel:+919876543210" className="text-purple-600 font-semibold hover:underline">
                                +91 93919 15430
                            </a>
                        </div>
                    </div>

                    {/* Contact Form Container */}
                    <div className="w-full lg:w-2/3 bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-8 lg:p-10 text-white">
                            <h2 className="text-2xl font-bold mb-2">Send us a Message</h2>
                            <p className="opacity-90">Fill out the form below and we will get back to you as soon as possible.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 lg:p-10 flex-grow flex flex-col gap-6">
                            {submitted && (
                                <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 flex items-center gap-3">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Thank you for your message! We will get back to you soon.
                                </div>
                            )}

                            {errorText && (
                                <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center gap-3">
                                    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    {errorText}
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                    placeholder="How can we help you?"
                                />
                            </div>

                            <div className="flex-grow flex flex-col">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                                <textarea
                                    required
                                    rows="6"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all flex-grow resize-none"
                                    placeholder="Write your message here..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full md:w-auto self-start mt-2 px-8 py-4 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black hover:-translate-y-1 shadow-lg'} text-white font-bold rounded-xl transition-transform transform flex items-center justify-center gap-2`}
                            >
                                {loading && (
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {loading ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactUs;
