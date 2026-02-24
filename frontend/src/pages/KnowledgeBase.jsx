import React, { useState } from "react";
import { Link } from "react-router-dom";

function KnowledgeBase() {
    const [activeFaq, setActiveFaq] = useState(null);

    const faqs = [
        {
            question: "How do I donate food?",
            answer: "Click on the 'Donate Food' button on your dashboard. Fill out the details about the food, quantity, and expiry time. Organizations nearby will be notified."
        },
        {
            question: "Who can receive the food?",
            answer: "Registered and verified non-profit organizations, food banks, and shelters can browse available donations and request to pick them up."
        },
        {
            question: "What happens if food expires?",
            answer: "Our system automatically tracks the expiry time you set. If the time passes before an organization picks it up, it will be marked as expired and removed from active listings."
        },
        {
            question: "Is there a cost to use FoodConnect?",
            answer: "No, FoodConnect is a completely free platform designed to help communities eliminate food waste and feed those in need."
        },
        {
            question: "How is my personal data protected?",
            answer: "We take privacy seriously. Donor addresses and contact details are only shared with an organization AFTER you have approved their pickup request."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <section className="bg-gradient-to-br from-gray-900 to-green-900 text-white pt-24 pb-16 md:pt-32 md:pb-24 px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Knowledge Base & <span className="text-green-400">FAQ</span></h1>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                    Find answers to common questions about using the FoodConnect platform.
                </p>
            </section>

            {/* Main Content */}
            <section className="flex-grow py-16">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b pb-4">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div key={index} className="border border-gray-100 rounded-2xl overflow-hidden hover:border-green-200 transition-colors">
                                    <button
                                        onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                                        className="w-full px-6 py-5 text-left bg-gray-50 hover:bg-green-50/50 flex justify-between items-center transition-colors"
                                    >
                                        <span className="font-semibold text-gray-900">{faq.question}</span>
                                        <svg
                                            className={`w-5 h-5 text-green-600 transition-transform duration-300 ${activeFaq === index ? 'rotate-180' : ''}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </button>
                                    <div className={`px-6 overflow-hidden transition-all duration-300 ${activeFaq === index ? 'max-h-96 py-5 bg-white' : 'max-h-0 py-0'}`}>
                                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center bg-green-50 border border-green-100 rounded-3xl p-8 md:p-12">
                        <h2 className="text-2xl font-bold text-green-900 mb-4">Still need help?</h2>
                        <p className="text-green-800 mb-8 max-w-lg mx-auto">
                            If you couldn't find the answer you were looking for, our support team is ready to assist you.
                        </p>
                        <Link to="/contact" className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:-translate-y-1">
                            Contact Support
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default KnowledgeBase;
