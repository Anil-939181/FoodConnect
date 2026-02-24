import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../services/api";
import { decimalToDMS, dmsToDecimal } from "../utils/coordinates";

function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("donor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState([]);
  const [tempLat, setTempLat] = useState("");
  const [tempLon, setTempLon] = useState("");
  const [latDegrees, setLatDegrees] = useState("");
  const [latMinutes, setLatMinutes] = useState("");
  const [latSeconds, setLatSeconds] = useState("");
  const [lonDegrees, setLonDegrees] = useState("");
  const [lonMinutes, setLonMinutes] = useState("");
  const [lonSeconds, setLonSeconds] = useState("");

  // OTP States
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [step, setStep] = useState(1);

  const handleNext = async () => {
    if (step === 1) {
      if (!name.trim()) { toast.error("Name is required"); return; }
    }
    if (step === 2) {
      if (!phone.trim() || !email.trim() || !password) {
        toast.error("Phone, email and password are required");
        return;
      }
      if (!isEmailVerified) {
        if (!showOtpInput) {
          try {
            setOtpLoading(true);
            const result = await API.post("/auth/check", { email, phone });
            if (result.data.exists) {
              toast.error("Email or phone already in use. Please login or use different credentials.");
              setOtpLoading(false);
              return;
            }
            await API.post("/auth/send-otp", { email, purpose: "VERIFY" });
            setShowOtpInput(true);
            toast.success(`OTP sent to ${email}`);
          } catch (err) {
            toast.error(err.response?.data?.message || "Unable to send OTP. Please try again.");
          } finally {
            setOtpLoading(false);
          }
          return;
        } else {
          try {
            if (!otp.trim()) { toast.error("Please enter the OTP"); return; }
            setOtpLoading(true);
            await API.post("/auth/verify-otp", { email, otp, purpose: "VERIFY" });
            setIsEmailVerified(true);
            toast.success("Email verified successfully!");
          } catch (err) {
            toast.error(err.response?.data?.message || "Invalid OTP. Please try again.");
            setOtpLoading(false);
            return;
          } finally {
            setOtpLoading(false);
          }
        }
      }
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (step < 3) await handleNext();
    else handleRegister(e);
  };

  const handleGetCurrentLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toString();
        const lon = position.coords.longitude.toString();
        setLatitude(lat); setLongitude(lon);
        const latDMS = decimalToDMS(parseFloat(lat));
        const lonDMS = decimalToDMS(parseFloat(lon));
        setLatDegrees(latDMS.degrees.toString()); setLatMinutes(latDMS.minutes.toString()); setLatSeconds(latDMS.seconds.toString());
        setLonDegrees(lonDMS.degrees.toString()); setLonMinutes(lonDMS.minutes.toString()); setLonSeconds(lonDMS.seconds.toString());
        toast.success("Location captured");
        setLocationLoading(false);
      },
      () => { toast.error("Unable to get your location."); setLocationLoading(false); }
    );
  };

  useEffect(() => {
    if (!showMapPicker || !mapRef.current) return;
    if (mapInstanceRef.current) { mapInstanceRef.current.invalidateSize(); return; }
    const timer = setTimeout(() => {
      if (!window.L) { toast.error("Map library not loaded. Please refresh."); return; }
      try {
        const L = window.L;
        const map = L.map(mapRef.current, { scrollWheelZoom: false, dragging: true }).setView([20.5937, 78.9629], 5);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19, attribution: "© OpenStreetMap contributors"
        }).addTo(map);
        const container = map.getContainer();
        L.DomEvent.disableScrollPropagation(container);
        container.addEventListener("wheel", (ev) => {
          ev.preventDefault(); ev.stopPropagation();
          if (ev.ctrlKey) map.scrollWheelZoom.enable();
          else { map.scrollWheelZoom.disable(); map.panBy([0, ev.deltaY * 0.5], { animate: false }); }
        }, { passive: false });
        mapInstanceRef.current = map;
        map.on("click", (e) => {
          const { lat, lng } = e.latlng;
          setTempLat(lat.toString()); setTempLon(lng.toString());
          if (markerRef.current) map.removeLayer(markerRef.current);
          markerRef.current = L.marker([lat, lng]).addTo(map)
            .bindPopup(`<b>Selected Location</b><br/>Lat: ${lat.toFixed(4)}<br/>Lon: ${lng.toFixed(4)}`).openPopup();
          toast.success("Location selected. Click confirm to save.");
        });
        setTimeout(() => map.invalidateSize(), 100);
      } catch (error) { toast.error("Error initializing map."); }
    }, 100);
    return () => clearTimeout(timer);
  }, [showMapPicker]);

  useEffect(() => { document.body.style.overflow = showMapPicker ? "hidden" : ""; }, [showMapPicker]);

  const closeMap = () => {
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    markerRef.current = null;
    setShowMapPicker(false); setMapSearchResults([]); setMapSearchQuery(""); setTempLat(""); setTempLon("");
  };

  const handleMapSearchZoom = async () => {
    if (!mapSearchQuery.trim()) { toast.error("Please enter a location to search"); return; }
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(mapSearchQuery)}&format=json&limit=5`);
      const results = await response.json();
      if (!results.length) { toast.error("No locations found."); setMapSearchResults([]); return; }
      setMapSearchResults(results);
      if (mapInstanceRef.current && results[0]) {
        const lat = parseFloat(results[0].lat), lon = parseFloat(results[0].lon);
        mapInstanceRef.current.setView([lat, lon], 13);
        if (markerRef.current) mapInstanceRef.current.removeLayer(markerRef.current);
        markerRef.current = window.L.marker([lat, lon]).addTo(mapInstanceRef.current)
          .bindPopup(`<b>${results[0].display_name?.split(",")[0]}</b>`).openPopup();
        setTempLat(lat.toString()); setTempLon(lon.toString());
      }
    } catch { toast.error("Error searching location."); }
  };

  const handleConfirmMapLocation = () => {
    if (!tempLat || !tempLon) { toast.error("Please select a location on the map"); return; }
    setLatitude(tempLat); setLongitude(tempLon);
    const latDMS = decimalToDMS(parseFloat(tempLat));
    const lonDMS = decimalToDMS(parseFloat(tempLon));
    setLatDegrees(latDMS.degrees.toString()); setLatMinutes(latDMS.minutes.toString()); setLatSeconds(latDMS.seconds.toFixed(2));
    setLonDegrees(lonDMS.degrees.toString()); setLonMinutes(lonDMS.minutes.toString()); setLonSeconds(lonDMS.seconds.toFixed(2));
    closeMap();
    toast.success("Location confirmed ✓");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!latitude || !longitude) { toast.error("Please select your location using the map picker"); return; }
    try {
      await API.post("/auth/register", {
        name, email, password, phone,
        role, state, district, pincode, city,
        latitude: parseFloat(latitude), longitude: parseFloat(longitude),
        latDegrees: latDegrees ? parseInt(latDegrees) : null,
        latMinutes: latMinutes ? parseInt(latMinutes) : null,
        latSeconds: latSeconds ? parseFloat(latSeconds) : null,
        lonDegrees: lonDegrees ? parseInt(lonDegrees) : null,
        lonMinutes: lonMinutes ? parseInt(lonMinutes) : null,
        lonSeconds: lonSeconds ? parseFloat(lonSeconds) : null,
      });
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  // Step circle styles
  const circleClass = (i) => {
    if (step > i) return "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-green-600 text-white shadow";
    if (step === i) return "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-green-600 text-white ring-4 ring-green-100 shadow";
    return "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-gray-100 text-gray-400 border-2 border-gray-200";
  };
  const labelClass = (i) => {
    if (step === i) return "text-xs font-semibold text-green-700 mt-1 text-center";
    if (step > i) return "text-xs font-medium text-green-500 mt-1 text-center";
    return "text-xs font-medium text-gray-400 mt-1 text-center";
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent focus:bg-white transition placeholder-gray-400";

  return (
    <div className="min-h-[calc(100vh-80px)] sm:min-h-[calc(100vh-96px)] bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4 sm:p-10">

      {/* ── Card ── */}
      <div className="w-full max-w-lg sm:max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col justify-center">

        {/* Accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-green-700 via-emerald-400 to-green-500" />

        {/* Header */}
        <div className="flex flex-col items-center px-6 sm:px-8 pt-8 pb-2">
          <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl shadow-lg text-2xl mb-4 select-none">
            🍱
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight text-center">Join Food Connect</h1>
          <p className="text-sm text-gray-400 mt-1 mb-6 text-center">Together we can end food waste, one meal at a time</p>
        </div>

        {/* Stepper */}
        <div className="px-6 sm:px-8 mb-6">
          <div className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={circleClass(1)}>{step > 1 ? "✓" : "1"}</div>
              <span className={labelClass(1)}>Account</span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 mb-5 rounded transition-all ${step > 1 ? "bg-green-500" : "bg-gray-200"}`} />
            <div className="flex flex-col items-center">
              <div className={circleClass(2)}>{step > 2 ? "✓" : "2"}</div>
              <span className={labelClass(2)}>Contact</span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 mb-5 rounded transition-all ${step > 2 ? "bg-green-500" : "bg-gray-200"}`} />
            <div className="flex flex-col items-center">
              <div className={circleClass(3)}>3</div>
              <span className={labelClass(3)}>Address</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmitForm} className="px-6 sm:px-8 pb-8">

          {/* ── Step 1: Account ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-sm font-bold text-gray-600 flex items-center gap-2 uppercase tracking-wider">
                <span className="text-base">👤</span> Account Information
              </h2>

              {/* Role selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Register As
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("donor")}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all ${role === "donor"
                      ? "border-green-500 bg-green-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50"
                      }`}
                  >
                    <span className="text-2xl block mb-1">🤝</span>
                    <span className="block text-sm font-bold text-gray-800">Donor</span>
                    <span className="block text-xs text-gray-400 mt-0.5">Share surplus food</span>
                    {role === "donor" && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("organization")}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all ${role === "organization"
                      ? "border-green-500 bg-green-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50"
                      }`}
                  >
                    <span className="text-2xl block mb-1">🏢</span>
                    <span className="block text-sm font-bold text-gray-800">Organization</span>
                    <span className="block text-xs text-gray-400 mt-0.5">Receive donations</span>
                    {role === "organization" && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</span>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  {role === "organization" ? "Organization Name" : "Full Name"}{" "}
                  <span className="text-red-400 normal-case">*</span>
                </label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder={role === "organization" ? "e.g. Helping Hands NGO" : "e.g. Rahul Sharma"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Contact ── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-sm font-bold text-gray-600 flex items-center gap-2 uppercase tracking-wider">
                <span className="text-base">📞</span> Contact Information
              </h2>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Phone <span className="text-red-400 normal-case">*</span>
                </label>
                <input type="tel" className={inputClass} placeholder="e.g. 9876543210" required value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Email <span className="text-red-400 normal-case">*</span>
                </label>
                <input type="email" className={inputClass} placeholder="you@example.com" required value={email} onChange={(e) => { setEmail(e.target.value); setIsEmailVerified(false); setShowOtpInput(false); }} disabled={showOtpInput || isEmailVerified} />
              </div>

              {showOtpInput && !isEmailVerified && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl animate-fade-in">
                  <label className="block text-xs font-semibold text-orange-700 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    <span>✉️</span> Enter Verification OTP
                  </label>
                  <p className="text-xs text-orange-600 mb-3">Please check your email <strong>{email}</strong> for a 6-digit code.</p>
                  <input type="text" maxLength={6} className={`${inputClass} !border-orange-300 focus:!ring-orange-400 font-mono tracking-widest text-center text-lg`} placeholder="●●●●●●" required value={otp} onChange={(e) => setOtp(e.target.value)} />
                </div>
              )}

              {isEmailVerified && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 animate-fade-in">
                  <span className="text-green-500">✅</span>
                  <span className="text-xs font-bold text-green-700">Email verified successfully</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Password <span className="text-red-400 normal-case">*</span>
                </label>
                <input type="password" className={inputClass} placeholder="Create a strong password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Step 3: Address ── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-sm font-bold text-gray-600 flex items-center gap-2 uppercase tracking-wider">
                <span className="text-base">📍</span> Address &amp; Location
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    State <span className="text-red-400 normal-case">*</span>
                  </label>
                  <input type="text" className={inputClass} placeholder="e.g. Andhra Pradesh" required value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    District <span className="text-red-400 normal-case">*</span>
                  </label>
                  <input type="text" className={inputClass} placeholder="e.g. Krishna" required value={district} onChange={(e) => setDistrict(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    City / Village <span className="text-red-400 normal-case">*</span>
                  </label>
                  <input type="text" className={inputClass} placeholder="e.g. Vijayawada" required value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Pincode <span className="text-red-400 normal-case">*</span>
                  </label>
                  <input type="text" className={inputClass} placeholder="e.g. 520001" required value={pincode} onChange={(e) => setPincode(e.target.value)} />
                </div>
              </div>

              {/* Location picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Map Location <span className="text-red-400 normal-case">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50">
                  <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                    Pick your precise location so nearby donors and organizations can find you.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-semibold transition"
                    >
                      🗺️ Pick from Map
                    </button>
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      disabled={locationLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-700 text-xs sm:text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {locationLoading ? "⏳ Getting..." : "📡 Use My Location"}
                    </button>
                  </div>

                  {latitude && longitude && (
                    <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                      <span className="text-green-500">✅</span>
                      <span className="text-xs font-semibold text-green-700">
                        Location set: {parseFloat(latitude).toFixed(5)}, {parseFloat(longitude).toFixed(5)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Nav buttons ── */}
          <div className="flex items-center gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2 sm:py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 text-xs sm:text-sm font-semibold hover:border-green-400 hover:text-green-600 transition bg-white"
              >
                ← Back
              </button>
            )}
            <button
              type="submit"
              disabled={otpLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm shadow-lg transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {otpLoading ? "⏳ Processing..." : (step === 2 && !showOtpInput && !isEmailVerified) ? "Verify Email →" : (step === 2 && showOtpInput && !isEmailVerified) ? "Confirm OTP →" : step < 3 ? "Continue →" : "🎉 Create Account"}
            </button>
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-gray-400 mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-green-600 font-bold hover:underline">Sign in</Link>
          </p>
        </form>
      </div>

      {/* ── Map Modal ── */}
      {showMapPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 sm:p-4">
          <div className="bg-white sm:rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl h-full sm:h-auto overflow-hidden" style={{ maxHeight: "100%" }}>

            {/* Modal header */}
            <div className="shrink-0 flex items-start justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800">📍 Select Your Location</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span className="hidden sm:inline">Search a place or click directly on the map · Ctrl+scroll to zoom</span>
                  <span className="sm:hidden text-amber-600 font-medium">✨ Double-tap to drag the map & pinch to zoom</span>
                </p>
              </div>
              <button
                onClick={closeMap}
                className="w-8 h-8 shrink-0 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold transition ml-2"
              >
                ✕
              </button>
            </div>

            {/* Search */}
            <div className="shrink-0 flex flex-col sm:flex-row gap-2 px-4 sm:px-6 py-3 border-b border-gray-100">
              <input
                type="text"
                className={inputClass}
                placeholder="Search city, area, landmark…"
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleMapSearchZoom()}
                autoFocus
              />
              <button
                type="button"
                onClick={handleMapSearchZoom}
                className="w-full sm:w-auto px-5 py-2 sm:py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-bold transition whitespace-nowrap"
              >
                Search
              </button>
            </div>

            {/* Map container */}
            <div className="flex-1 bg-gray-100 relative min-h-[250px] sm:max-h-[40vh]">
              <div ref={mapRef} className="w-full h-full absolute inset-0 z-0" style={{ touchAction: "none" }} />
            </div>

            {/* Search results */}
            {mapSearchResults.length > 0 && (
              <div className="border-t border-gray-100 px-4 sm:px-6 py-3 bg-gray-50 overflow-y-auto" style={{ maxHeight: "160px" }}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Results</p>
                <div className="space-y-1.5">
                  {mapSearchResults.map((result, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        const lat = parseFloat(result.lat), lon = parseFloat(result.lon);
                        setTempLat(lat.toString()); setTempLon(lon.toString());
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.setView([lat, lon], 13);
                          if (markerRef.current) mapInstanceRef.current.removeLayer(markerRef.current);
                          markerRef.current = window.L.marker([lat, lon])
                            .addTo(mapInstanceRef.current)
                            .bindPopup(`<b>${result.display_name?.split(",")[0]}</b>`)
                            .openPopup();
                        }
                      }}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 cursor-pointer transition"
                    >
                      <p className="text-sm font-semibold text-gray-800 truncate">{result.display_name?.split(",").slice(0, 2).join(", ")}</p>
                      <p className="text-xs text-gray-400">📍 {parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal footer */}
            <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
              <span className={`text-sm truncate w-full sm:w-auto text-center sm:text-left ${tempLat && tempLon ? "text-green-600 font-semibold" : "text-gray-400"}`}>
                {tempLat && tempLon
                  ? `✓ ${parseFloat(tempLat).toFixed(4)}, ${parseFloat(tempLon).toFixed(4)}`
                  : "Click map or pick from results"}
              </span>
              <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                <button
                  onClick={closeMap}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-500 text-xs sm:text-sm font-semibold hover:border-green-400 hover:text-green-600 transition bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmMapLocation}
                  disabled={!tempLat || !tempLon}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-bold transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Confirm Location
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Register;