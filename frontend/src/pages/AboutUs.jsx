import React from "react";
import { Link } from "react-router-dom";

function AboutUs() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Premium Hero Section */}
            <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-gradient-to-br from-gray-900 to-green-900 text-white">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-green-500 opacity-20 blur-3xl mix-blend-screen"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-teal-500 opacity-20 blur-3xl mix-blend-screen"></div>
                </div>
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 mt-8">
                        About <span className="text-green-400">FoodConnect</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        We are on a mission to end food waste and hunger by connecting those with surplus food directly to communities in need through smart technology.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="flex-grow py-16 md:py-24">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Our Story
                        </h2>
                        <div className="space-y-4 text-gray-600 leading-relaxed text-lg">
                            <p>
                                FoodConnect was born out of a simple observation: there is enough food produced globally to feed everyone, yet millions go to bed hungry while perfectly good food is thrown away.
                            </p>
                            <p>
                                We realized that the problem wasn't a lack of food, but a lack of connection between those who have surplus and those who need it. Restaurants, caterers, and individuals often want to donate their extra food, but struggle to find local organizations quickly enough before the food spoils.
                            </p>
                            <p>
                                By providing a real-time tracking, matching, and alerting system, our platform bridges this gap, making food donation seamless, efficient, and transparent.
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-100">
                            <h3 className="text-xl font-bold text-green-900 mb-4">Our Vision</h3>
                            <p className="text-green-800 leading-relaxed">
                                A world where no edible food goes to waste, and every community has reliable access to nutritious meals through sustainable local sharing networks.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-3xl p-8 border border-blue-100">
                            <h3 className="text-xl font-bold text-teal-900 mb-4">Our Mission</h3>
                            <p className="text-teal-800 leading-relaxed">
                                To build the technological infrastructure that empowers individuals and organizations to rescue surplus food and distribute it to those in need with zero friction.
                            </p>
                        </div>
                    </div>

                    <div className="text-center mt-12 bg-white rounded-3xl p-8 shadow-sm">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Our Movement</h2>
                        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                            Whether you're a restaurant with surplus food, a volunteer looking to transport meals, or an organization feeding the hungry—we need you.
                        </p>
                        <Link to="/register" className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:-translate-y-1 shadow-lg hover:shadow-green-600/30">
                            Get Started Today
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default AboutUs;
