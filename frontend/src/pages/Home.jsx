import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

// Custom hook to detect when an element enters the viewport
function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        if (elementRef.current) observer.unobserve(elementRef.current);
      }
    }, { threshold: 0.1, ...options });

    if (elementRef.current) observer.observe(elementRef.current);
    return () => {
      if (elementRef.current) observer.unobserve(elementRef.current);
    };
  }, [options]);

  return [elementRef, isIntersecting];
}

const FlowAnimation = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // 5 stages:
    // 0: Donor creates donation -> Middle 
    // 1: Waiting in network
    // 2: Orgs send requests -> Middle
    // 3: Donor approves request -> Line to Org
    // 4: Completed
    const interval = setInterval(() => {
      setStep((v) => (v + 1) % 5);
    }, 3500); // 3.5s per step
    return () => clearInterval(interval);
  }, []);

  const getStepText = () => {
    switch (step) {
      case 0: return "1. Donor Creates a Donation";
      case 1: return "2. Donation is active on the Network";
      case 2: return "3. Organizations Send Requests";
      case 3: return "4. Donor Approves the Request";
      case 4: return "5. Food is Marked Complete!";
      default: return "";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 0: return "A restaurant or individual posts details about surplus food they want to share.";
      case 1: return "The donation is now securely listed in our platform's smart matching system.";
      case 2: return "Nearby shelters and charities see the donation and send a request to claim it.";
      case 3: return "The donor receives the requests and approves the best match.";
      case 4: return "The organization picks up the food, and the transaction is successfully completed.";
      default: return "";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-3xl p-2 md:p-12 shadow-lg border border-gray-100 relative overflow-hidden flex flex-col items-center">

      {/* Step Info */}
      <div className="text-center mb-16 h-20 transition-all duration-300">
        <span className="inline-flex items-center px-6 py-2 rounded-full bg-green-100 text-green-800 font-extrabold shadow-sm transition-all duration-300 text-lg mb-2 border border-green-200">
          {getStepText()}
        </span>
        <p className="text-gray-500 max-w-md mx-auto">{getStepDescription()}</p>
      </div>

      {/* Visual Diagram Area (Responsive naturally) */}
      <div className="w-full h-48 sm:h-56 flex justify-between items-center px-1 sm:px-4 relative mt-4">

        {/* Track Line */}
        <div className="absolute top-1/2 left-8 md:left-16 right-8 md:right-16 h-1.5 md:h-2 bg-gray-100 rounded-full -translate-y-1/2 z-0 shadow-inner"></div>

        {/* =====================
            STATE 0 / 1: DONOR -> MIDDLE
           ===================== */}
        {/* Green Animated Line */}
        <div className={`absolute top-1/2 left-8 md:left-16 h-1.5 md:h-2 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full -translate-y-1/2 z-10 transition-all duration-[1500ms] ease-in-out ${step >= 1 ? 'w-1/2' : 'w-0'}`}></div>

        {/* Payload / Box sending out */}
        <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 bg-white border border-green-500 md:border-2 rounded-lg md:rounded-xl shadow-md z-20 flex items-center justify-center transition-all duration-[1500ms] ease-in-out
          ${step === 0 ? 'left-12 md:left-20 opacity-100 scale-100' :
            step >= 1 && step <= 4 ? 'left-1/2 -translate-x-1/2 opacity-100 scale-110 md:scale-125' :
              'left-12 md:left-20 opacity-0'}
        `}>
          <svg className="w-3 h-3 md:w-5 md:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
        </div>


        {/* =====================
            STATE 2: ORG -> MIDDLE (Requests coming in)
           ===================== */}
        {/* Blue/Teal Animated Dashed Line (Requests) */}
        <div className={`absolute top-1/2 right-8 md:right-16 h-1.5 md:h-2 bg-gradient-to-l from-teal-500 to-cyan-400 rounded-full -translate-y-1/2 z-10 transition-all duration-[1500ms] ease-in-out ${step === 2 ? 'w-[45%]' : 'w-0'}`}></div>

        {/* Multiple request pulses floating to middle */}
        <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 bg-teal-500 rounded-full shadow-lg z-20 transition-all duration-[1500ms] ease-in-out ${step === 2 ? 'right-1/2 opacity-100' : 'right-12 md:right-20 opacity-0'}`}></div>
        <div className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 md:w-3 md:h-3 bg-cyan-400 rounded-full shadow-lg z-20 transition-all duration-[1000ms] ease-in-out delay-300 ${step === 2 ? 'right-1/2 opacity-100' : 'right-12 md:right-20 opacity-0'}`}></div>
        <div className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full shadow-lg z-20 transition-all duration-[2000ms] ease-in-out delay-100 ${step === 2 ? 'right-[45%] opacity-100' : 'right-12 md:right-20 opacity-0'}`}></div>


        {/* =====================
            STATE 3: MIDDLE -> ORG (Approval)
           ===================== */}
        <div className={`absolute top-1/2 left-1/2 right-8 md:right-16 h-1.5 md:h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full -translate-y-1/2 z-10 transition-all duration-[1500ms] ease-in-out ${step >= 3 ? 'w-auto opacity-100' : 'w-0 opacity-0 right-1/2'}`}></div>

        {/* Approval Checkmark payload */}
        <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 bg-teal-500 rounded-full shadow-lg z-20 flex items-center justify-center text-white transition-all duration-[1500ms] ease-in-out
          ${step === 3 ? 'right-12 md:right-20 opacity-100 scale-100 rotate-0' :
            step > 3 ? 'right-12 md:right-20 opacity-0 scale-50 rotate-90' : 'right-1/2 opacity-0 rotate-180 -translate-x-1/2'}
        `}>
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        </div>


        {/* =====================
            STATE 4: FULL COMPLETION GLOW
           ===================== */}
        <div className={`absolute top-1/2 left-8 md:left-16 right-8 md:right-16 h-1.5 md:h-2 bg-gradient-to-r from-green-500 via-emerald-400 to-teal-500 rounded-full -translate-y-1/2 z-10 transition-all duration-700 ease-in-out ${step === 4 ? 'opacity-100 shadow-[0_0_20px_rgba(16,185,129,0.8)]' : 'opacity-0'}`}></div>




        {/* --- NODE: DONOR --- */}
        <div className="relative z-30 flex flex-col items-center">
          <div className={`w-14 h-14 md:w-28 md:h-28 rounded-full flex items-center justify-center bg-white border-[3px] md:border-4 transition-all duration-500 ${step === 0 ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)] md:scale-110 scale-105' : 'border-gray-100 shadow-sm'}`}>
            <svg className={`w-7 h-7 md:w-14 md:h-14 ${step === 0 ? 'text-green-600' : 'text-gray-400'} transition-colors duration-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z"></path></svg>
          </div>
          <span className={`absolute -bottom-8 md:-bottom-10 font-bold whitespace-nowrap transition-colors duration-500 ${step === 0 ? 'text-green-600 text-[11px] md:text-lg' : 'text-gray-500 text-[10px] md:text-base'}`}>Donor</span>
        </div>

        {/* --- NODE: PLATFORM / MIDDLE --- */}
        <div className="relative z-30 flex flex-col items-center">
          <div className={`w-12 h-12 md:w-24 md:h-24 rounded-xl md:rounded-2xl flex items-center justify-center bg-white border-[3px] md:border-4 transition-all duration-500 ${step === 1 ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)] md:scale-110 scale-105' : step === 4 ? 'border-green-400 bg-green-50' : 'border-gray-100 shadow-sm'}`}>
            {step === 4 ? (
              <svg className="w-6 h-6 md:w-12 md:h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            ) : (
              <svg className={`w-6 h-6 md:w-12 md:h-12 ${step === 1 ? 'text-emerald-500' : 'text-gray-400'} transition-colors duration-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            )}
          </div>
          <span className={`absolute -bottom-8 md:-bottom-10 font-bold whitespace-nowrap transition-colors duration-500 ${step === 1 ? 'text-emerald-600 text-[11px] md:text-lg' : 'text-gray-500 text-[10px] md:text-base'}`}>System</span>
        </div>

        {/* --- NODE: ORGANIZATION --- */}
        <div className="relative z-30 flex flex-col items-center">
          <div className={`w-14 h-14 md:w-28 md:h-28 rounded-full flex items-center justify-center bg-white border-[3px] md:border-4 transition-all duration-500 ${(step === 2 || step === 3) ? 'border-teal-500 shadow-[0_0_30px_rgba(20,184,166,0.4)] md:scale-110 scale-105' : step === 4 ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]' : 'border-gray-100 shadow-sm'}`}>
            <svg className={`w-7 h-7 md:w-14 md:h-14 ${step === 2 || step === 3 ? 'text-teal-600' : step === 4 ? 'text-green-600' : 'text-gray-400'} transition-colors duration-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
          <span className={`absolute -bottom-8 md:-bottom-10 font-bold whitespace-nowrap transition-colors duration-500 ${(step === 2 || step === 3) ? 'text-teal-600 text-[11px] md:text-lg' : 'text-gray-500 text-[10px] md:text-base'}`}>Organization</span>
        </div>

      </div>

    </div>
  );
};


function Home() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const [isVisible, setIsVisible] = useState(false);

  // Intersection observers for section animations
  const [howItWorksRef, howItWorksVisible] = useIntersectionObserver();
  const [featuresRef, featuresVisible] = useIntersectionObserver();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans overflow-x-hidden">

      {/* 🌟 PREMIUM HERO SECTION (Asymmetric  Layout) */}
      <section className="relative pt-8 pb-20 lg:pt-12 lg:pb-28 overflow-hidden bg-white">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-green-50 rounded-l-[100px] opacity-50 z-0 hidden lg:block"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
        <div className="absolute top-40 right-40 w-72 h-72 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-start pt-0 lg:pt-0">

            {/* Left Column: Typography & CTAs */}
            <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} max-w-2xl`}>
              {!token ? (
                <>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 font-bold text-sm mb-6 border border-green-100 shadow-sm uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    End Hunger. End Waste.
                  </div>
                  <h1 className="text-5xl lg:text-7xl font-black text-gray-900 mb-6 tracking-tight leading-[1.1]">
                    Stop Wasting. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-500">
                      Start Donating.
                    </span>
                  </h1>
                  <p className="text-xl text-gray-600 mb-10 font-medium leading-relaxed pr-0 lg:pr-10">
                    Millions of tons of perfectly good food go to waste every year while communities go hungry. FoodConnect directly links your excess food with local shelters and charities to make an immediate impact.
                  </p>
                </>
              ) : role === "organization" ? (
                <>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 font-bold text-sm mb-6 border border-teal-100 shadow-sm uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                    We Are Here To Help
                  </div>
                  <h1 className="text-5xl lg:text-7xl font-black text-gray-900 mb-6 tracking-tight leading-[1.1]">
                    Daily Food <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">
                      Just a Click Away.
                    </span>
                  </h1>
                  <p className="text-xl text-gray-600 mb-10 font-medium leading-relaxed pr-0 lg:pr-10">
                    We know feeding people is hard work. We are here to help you get food daily. You just need to request the food and we will connect you to a generous donor nearby.
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 font-bold text-sm mb-6 border border-teal-100 shadow-sm uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                    Welcome Back, Donor
                  </div>
                  <h1 className="text-5xl lg:text-7xl font-black text-gray-900 mb-6 tracking-tight leading-[1.1]">
                    Save Food. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">
                      Save Lives.
                    </span>
                  </h1>
                  <p className="text-xl text-gray-600 mb-10 font-medium leading-relaxed pr-0 lg:pr-10">
                    "Wastage leads to waste only, but your help leads to saving lives." Donate your surplus food today and directly feed the people who need it most in your community.
                  </p>
                </>
              )}

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {!token ? (
                  <>
                    <Link
                      to="/register"
                      className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white hover:bg-green-700 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      Join To Donate
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </Link>
                    <Link
                      to="/login"
                      className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 hover:border-green-600 hover:text-green-700 rounded-2xl font-bold text-lg transition-all duration-300 text-center"
                    >
                      Login
                    </Link>
                  </>
                ) : (
                  <>
                    {(!role || role === "donor") && (
                      <Link
                        to="/donate"
                        className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-teal-700 text-white rounded-2xl font-bold text-lg shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        Donate Surplus Food
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                      </Link>
                    )}
                    {role === "organization" && (
                      <Link
                        to="/request"
                        className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-teal-700 text-white rounded-2xl font-bold text-lg shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        Request Food Free
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                      </Link>
                    )}
                    <Link
                      to="/dashboard"
                      className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 hover:border-teal-600 rounded-2xl font-bold text-lg transition-all duration-300 text-center"
                    >
                      Go to Dashboard
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Visual Composition */}
            <div className={`hidden mt-12 lg:mt-0 lg:flex justify-center transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="relative w-full max-w-md h-[500px]">

                {role === "organization" ? (
                  <>
                    {/* Organization logged in graphics */}
                    <div className="absolute top-0 right-0 w-64 h-80 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl shadow-2xl p-6 text-white transform rotate-3 hover:rotate-0 transition-transform duration-500 z-10 flex flex-col justify-between">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">Incoming Delivery</h3>
                        <p className="text-teal-100 font-medium text-sm">50 fresh meals en route from a local restaurant.</p>
                      </div>
                    </div>

                    <div className="absolute bottom-10 left-0 w-72 h-64 bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 transform -rotate-3 hover:rotate-0 transition-transform duration-500 z-20 flex flex-col justify-between">
                      <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Food Secured!</h4>
                          <p className="text-sm text-green-600 font-bold">Request Approved</p>
                        </div>
                      </div>
                      <div className="pt-4">
                        <p className="text-sm text-gray-600 italic">"The donor accepted your request. Ready for pickup in 15 minutes."</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Donor or Guest graphics */}
                    <div className="absolute top-0 right-0 w-64 h-80 bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl shadow-2xl p-6 text-white transform rotate-3 hover:rotate-0 transition-transform duration-500 z-10 flex flex-col justify-between">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">10kg Fresh Produce</h3>
                        <p className="text-green-100 font-medium text-sm">Rescued from local bakery and delivered to Hope Shelter.</p>
                      </div>
                    </div>

                    <div className="absolute bottom-10 left-0 w-72 h-64 bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 transform -rotate-3 hover:rotate-0 transition-transform duration-500 z-20 flex flex-col justify-between">
                      <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                        <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z"></path></svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Community Kitchen</h4>
                          <p className="text-sm text-green-600 font-bold">Food Received!</p>
                        </div>
                      </div>
                      <div className="pt-4">
                        <p className="text-sm text-gray-600 italic">"Thank you! Because of this donation, 50 people will have a hot meal tonight."</p>
                      </div>
                    </div>
                  </>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 🤝 DYNAMIC ANIMATION SECTION (How it Works) */}
      <section ref={howItWorksRef} className="py-8 md:py-16 px-4 sm:px-6">
        <div className={`max-w-7xl mx-auto bg-gray-900 text-white rounded-[2rem] md:rounded-[3rem] py-12 md:py-16 shadow-2xl relative overflow-hidden transition-all duration-1000 transform ${howItWorksVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
          {/* Background pattern and decorative elements to reduce empty space feel */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Z2E=')] opacity-50 z-0"></div>
          <div className="absolute top-10 left-10 w-24 h-24 bg-green-500 rounded-full mix-blend-screen filter blur-[50px] opacity-20 hidden md:block"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-teal-500 rounded-full mix-blend-screen filter blur-[60px] opacity-20 hidden md:block"></div>

          <div className="relative z-10 px-2 sm:px-6">
            <div className={`text-center mb-10 flex flex-col items-center transition-all duration-1000 delay-300 transform ${howItWorksVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <span className="text-green-400 font-bold tracking-widest uppercase text-sm mb-2 block">The Process</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">How the Platform Works</h2>
              <p className="text-gray-400 mt-4 text-base md:text-lg font-medium max-w-2xl px-4">Watch the ecosystem in real-time as we seamlessly connect surplus food with local organizations.</p>
            </div>

            <div className={`transition-all duration-1000 delay-500 transform ${howItWorksVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <FlowAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 BENTO BOX FEATURES SECTION */}
      <section ref={featuresRef} className="py-16 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className={`mb-12 lg:mb-16 md:flex md:justify-between md:items-end transition-all duration-1000 transform ${featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
            <div className="max-w-2xl">
              <span className="text-green-600 font-bold tracking-widest uppercase text-sm mb-2 block">Our Mission</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight">Zero Waste.<br />Zero Hunger.</h2>
            </div>
            <p className="text-gray-500 mt-6 md:mt-0 text-lg lg:text-xl font-medium max-w-sm">We provide the tools to ensure every single extra meal finds its way to a hungry family.</p>
          </div>

          {/* Bento Grid Layout! */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6">

            {/* Large Card 1 */}
            <div className={`md:col-span-2 md:row-span-2 bg-white rounded-[2rem] lg:rounded-[2.5rem] p-8 lg:p-12 shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-1000 transform delay-100 relative overflow-hidden group ${featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-green-50 to-white rounded-bl-full -z-10 transition-transform duration-700 group-hover:scale-110"></div>
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 lg:mb-8 shadow-inner">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Urgent Food Matching</h3>
              <p className="text-gray-600 text-base lg:text-lg leading-relaxed max-w-md">Surplus food expires quickly. Our system instantly alerts the nearest registered shelters and food banks the moment you post a donation, ensuring the food is picked up before it goes bad.</p>
            </div>

            {/* Small Card 1 */}
            <div className={`md:col-span-2 bg-gray-900 rounded-[2rem] lg:rounded-[2.5rem] p-8 lg:p-10 shadow-xl text-white relative overflow-hidden group transition-all duration-1000 transform delay-300 ${featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-500 rounded-full opacity-20 blur-2xl group-hover:bg-teal-400 transition-colors duration-500"></div>
              <div className="w-12 h-12 bg-gray-800 text-teal-400 rounded-xl flex items-center justify-center mb-6 border border-gray-700">
                <svg className="w-6 h-6 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z"></path></svg>
              </div>
              <h3 className="text-xl lg:text-2xl font-bold mb-3 tracking-tight">Feed Real People</h3>
              <p className="text-gray-400 text-sm lg:text-base leading-relaxed">Your excess restaurant inventory, event catering leftovers, or surplus groceries directly stock the pantries of verified local charities.</p>
            </div>

            {/* Small Card 2 */}
            <div className={`md:col-span-1 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 shadow-sm border border-teal-100 hover:shadow-md transition-all duration-1000 transform delay-500 group ${featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
              <div className="w-12 h-12 bg-white text-teal-600 rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2 tracking-tight">Local Map View</h3>
              <p className="text-gray-600 text-sm leading-relaxed">See nearby hungry communities.</p>
            </div>

            {/* Small Card 3 */}
            <div className={`md:col-span-1 bg-white rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-1000 transform delay-700 group ${featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6 border border-purple-100 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </div>
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2 tracking-tight">Track Impact</h3>
              <p className="text-gray-600 text-sm leading-relaxed">See the meals you provided.</p>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-3xl font-extrabold text-white mb-6 flex items-center gap-2">
              <span className="text-green-500">Food</span>Connect
            </h2>
            <p className="max-w-sm text-lg">Ending food waste and hunger through smart technology and real-time community engagement.</p>
          </div>
          <div>
            <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-6">Explore</h3>
            <ul className="space-y-3 font-medium">
              <li><Link to="/about" className="hover:text-green-400 transition-colors">About the Platform</Link></li>
              <li><Link to="/contact" className="hover:text-green-400 transition-colors">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-green-400 transition-colors">Knowledge Base & FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-6">Legal</h3>
            <ul className="space-y-3 font-medium">
              <li><Link to="/privacy-policy" className="hover:text-green-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-green-400 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-10 border-t border-gray-800 text-center md:text-left flex flex-col md:flex-row justify-between items-center">
          <p className="font-medium text-gray-500">© {(new Date().getFullYear())} FoodConnect Technologies. All rights reserved.</p>
          <div className="flex gap-6 mt-6 md:mt-0">
            <a href="#" className="text-gray-500 hover:text-white transition-colors font-semibold">Twitter</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors font-semibold">LinkedIn</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default Home;
