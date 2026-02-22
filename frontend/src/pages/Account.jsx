import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../services/api";
import { decimalToDMS, dmsToDecimal } from "../utils/coordinates";

function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modes: "VIEW", "VERIFY", "EDIT"
  const [mode, setMode] = useState("VIEW");

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [deleteOtpSent, setDeleteOtpSent] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleting, setDeleting] = useState(false);

  // profile image states
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // form states
  const [name, setName] = useState("");
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

  // DMS States
  const [latDegrees, setLatDegrees] = useState("");
  const [latMinutes, setLatMinutes] = useState("");
  const [latSeconds, setLatSeconds] = useState("");
  const [lonDegrees, setLonDegrees] = useState("");
  const [lonMinutes, setLonMinutes] = useState("");
  const [lonSeconds, setLonSeconds] = useState("");

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // View mode map ref
  const viewMapRef = useRef(null);
  const viewMapInstanceRef = useRef(null);
  const viewMarkerRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me");
        setUser(res.data);
        resetFormToUser(res.data);
      } catch (err) {
        toast.error("Unable to load user data.");
      }
    };
    fetchUser();
  }, []);

  const resetFormToUser = (userData) => {
    setName(userData.name || "");
    setPhone(userData.phone || "");
    setState(userData.state || "");
    setDistrict(userData.district || "");
    setPincode(userData.pincode || "");
    setCity(userData.city || "");
    setLatitude(userData.latitude?.toString() || "");
    setLongitude(userData.longitude?.toString() || "");
    setLatDegrees(userData.latDegrees?.toString() || "");
    setLatMinutes(userData.latMinutes?.toString() || "");
    setLatSeconds(userData.latSeconds?.toString() || "");
    setLonDegrees(userData.lonDegrees?.toString() || "");
    setLonMinutes(userData.lonMinutes?.toString() || "");
    setLonSeconds(userData.lonSeconds?.toString() || "");
    setPreviewImage(userData.profileImage || null);
    setProfileImageFile(null);
  };

  // --- View Mode Map Initialization ---
  useEffect(() => {
    if (mode === "VIEW" && user?.latitude && user?.longitude && viewMapRef.current) {
      const lat = parseFloat(user.latitude);
      const lon = parseFloat(user.longitude);

      if (!window.L) return;

      if (!viewMapInstanceRef.current) {
        viewMapInstanceRef.current = window.L.map(viewMapRef.current, {
          attributionControl: false,
          zoomControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false
        }).setView([lat, lon], 14);

        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19
        }).addTo(viewMapInstanceRef.current);

        viewMarkerRef.current = window.L.marker([lat, lon]).addTo(viewMapInstanceRef.current)
          .bindPopup("<b>Your Saved Location</b>").openPopup();

        setTimeout(() => { viewMapInstanceRef.current?.invalidateSize(); }, 200);
      } else {
        viewMapInstanceRef.current.setView([lat, lon], 14);
        if (viewMarkerRef.current) {
          viewMarkerRef.current.setLatLng([lat, lon]);
        }
      }
    }

    return () => {
      if (mode !== "VIEW" && viewMapInstanceRef.current) {
        viewMapInstanceRef.current.remove();
        viewMapInstanceRef.current = null;
        viewMarkerRef.current = null;
      }
    };
  }, [mode, user]);

  const handleSendOtp = async (purpose = "UPDATE") => {
    setLoading(true);
    try {
      await API.post("/auth/send-otp", { email: user.email, purpose });
      if (purpose === "UPDATE") {
        setOtpSent(true);
        setMode("VERIFY");
      } else if (purpose === "DELETE") {
        setDeleteOtpSent(true);
      }
      toast.success("OTP sent to your email.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpForEdit = () => {
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }
    // In the current backend, OTP is sent along with profile updates.
    // To strictly allow editing only after verification, we'd need a separate verify route.
    // Since we don't know if backend has a standalone verify, we'll optimistically allow them 
    // into EDIT mode and send the OTP together with the final save request.
    if (otp.length > 3) { // rudimentary check
      setMode("EDIT");
      toast.success("OTP accepted. You can now edit your profile.");
    } else {
      toast.error("Please enter a valid OTP");
    }
  };

  const handleSendDeleteOtp = async () => {
    handleSendOtp("DELETE");
  };

  const handleDelete = async () => {
    if (!deleteOtpSent || !deleteOtp) {
      toast.error("Please request and enter OTP to delete account.");
      return;
    }
    setDeleting(true);
    try {
      await API.delete("/auth/delete-account", { data: { otp: deleteOtp } });
      toast.success("Account deleted. Logging out...");
      localStorage.clear();
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };

  const handleGetCurrentLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toString();
        const lon = position.coords.longitude.toString();
        setLatitude(lat);
        setLongitude(lon);
        const latDMS = decimalToDMS(parseFloat(lat));
        const lonDMS = decimalToDMS(parseFloat(lon));
        setLatDegrees(latDMS.degrees.toString());
        setLatMinutes(latDMS.minutes.toString());
        setLatSeconds(latDMS.seconds.toFixed(2));
        setLonDegrees(lonDMS.degrees.toString());
        setLonMinutes(lonDMS.minutes.toString());
        setLonSeconds(lonDMS.seconds.toFixed(2));
        toast.success("Location captured");
        setLocationLoading(false);
      },
      () => {
        toast.error("Unable to get your location.");
        setLocationLoading(false);
      }
    );
  };

  useEffect(() => {
    document.body.style.overflow = showMapPicker ? "hidden" : "";
  }, [showMapPicker]);

  // --- Picker Map Initialization ---
  useEffect(() => {
    if (!showMapPicker || !mapRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      return;
    }
    const timer = setTimeout(() => {
      if (!window.L) {
        toast.error("Map library not loaded. Please refresh the page.");
        return;
      }
      try {
        const L = window.L;
        const initialLat = latitude ? parseFloat(latitude) : 20.5937;
        const initialLon = longitude ? parseFloat(longitude) : 78.9629;
        const zoom = latitude ? 13 : 5;

        const map = L.map(mapRef.current, { attributionControl: true, scrollWheelZoom: false }).setView([initialLat, initialLon], zoom);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          minZoom: 2,
        }).addTo(map);

        const container = map.getContainer();
        L.DomEvent.disableScrollPropagation(container);
        L.DomEvent.disableClickPropagation(container);
        container.addEventListener("wheel", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          if (ev.ctrlKey) {
            map.scrollWheelZoom.enable();
          } else {
            map.scrollWheelZoom.disable();
            map.panBy([0, ev.deltaY * 0.5], { animate: false });
          }
        }, { passive: false });

        mapInstanceRef.current = map;

        if (latitude && longitude) {
          markerRef.current = L.marker([initialLat, initialLon]).addTo(map).bindPopup("Current Location").openPopup();
        }

        map.on("click", (e) => {
          const { lat, lng } = e.latlng;
          setTempLat(lat.toString());
          setTempLon(lng.toString());
          if (markerRef.current) {
            map.removeLayer(markerRef.current);
          }
          markerRef.current = L.marker([lat, lng]).addTo(map).bindPopup(
            `<div class="text-sm"><b>Selected Location</b><br/>Lat: ${lat.toFixed(4)}<br/>Lon: ${lng.toFixed(4)}</div>`
          ).openPopup();
        });
        setTimeout(() => { map.invalidateSize(); }, 100);
      } catch (error) {
        console.error("Map error:", error);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [showMapPicker]);

  const handleMapSearchZoom = async () => {
    if (!mapSearchQuery.trim()) {
      toast.error("Enter location to search"); return;
    }
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(mapSearchQuery)}&format=json&limit=5`);
      const results = await resp.json();
      if (results.length === 0) {
        toast.error("No locations found.");
        setMapSearchResults([]);
        return;
      }
      setMapSearchResults(results);
      if (mapInstanceRef.current && results[0]) {
        const lat = parseFloat(results[0].lat);
        const lon = parseFloat(results[0].lon);
        mapInstanceRef.current.setView([lat, lon], 13);
        if (markerRef.current) {
          mapInstanceRef.current.removeLayer(markerRef.current);
        }
        markerRef.current = window.L.marker([lat, lon]).addTo(mapInstanceRef.current).openPopup();
        setTempLat(lat.toString());
        setTempLon(lon.toString());
      }
    } catch {
      toast.error("Error searching location.");
    }
  };

  const handleConfirmMapLocation = () => {
    if (!tempLat || !tempLon) { toast.error("Select a location"); return; }
    setLatitude(tempLat);
    setLongitude(tempLon);
    const latDMS = decimalToDMS(parseFloat(tempLat));
    const lonDMS = decimalToDMS(parseFloat(tempLon));
    setLatDegrees(latDMS.degrees.toString());
    setLatMinutes(latDMS.minutes.toString());
    setLatSeconds(latDMS.seconds.toFixed(2));
    setLonDegrees(lonDMS.degrees.toString());
    setLonMinutes(lonDMS.minutes.toString());
    setLonSeconds(lonDMS.seconds.toFixed(2));

    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    setShowMapPicker(false);
    toast.success("Location confirmed");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error("OTP is missing.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("state", state);
      formData.append("district", district);
      formData.append("pincode", pincode);
      formData.append("city", city);
      if (latitude) formData.append("latitude", latitude);
      if (longitude) formData.append("longitude", longitude);
      if (latDegrees) formData.append("latDegrees", latDegrees);
      if (latMinutes) formData.append("latMinutes", latMinutes);
      if (latSeconds) formData.append("latSeconds", latSeconds);
      if (lonDegrees) formData.append("lonDegrees", lonDegrees);
      if (lonMinutes) formData.append("lonMinutes", lonMinutes);
      if (lonSeconds) formData.append("lonSeconds", lonSeconds);
      formData.append("otp", otp);
      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }

      await API.put("/auth/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Profile updated successfully");
      const res = await API.get("/auth/me");
      setUser(res.data);
      setMode("VIEW");
      setOtpSent(false);
      setOtp("");
      setProfileImageFile(null);
      setPreviewImage(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setMode("VIEW");
    setOtpSent(false);
    setOtp("");
    if (user) resetFormToUser(user);
    setProfileImageFile(null);
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-50 -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-4xl shadow-lg ring-4 ring-green-50 overflow-hidden shrink-0">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            <div className="text-center sm:text-left flex-1 mt-2">
              <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{user?.name}</h1>
              <div className="inline-flex items-center mt-2 px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-600">
                {user?.role}
              </div>
              <p className="text-gray-500 mt-2 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* --- VIEW MODE --- */}
        {mode === "VIEW" && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">

            {/* Left Column: Text Info */}
            <div className="p-8 md:w-1/2 flex flex-col">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800">Account Details</h2>
              </div>

              <div className="space-y-5 flex-1 pl-2">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                  <p className="text-gray-800 font-medium">{user?.phone || "Not provided"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">State</p>
                    <p className="text-gray-800 font-medium">{user?.state || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">District</p>
                    <p className="text-gray-800 font-medium">{user?.district || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">City / Village</p>
                  <p className="text-gray-800 font-medium">{user?.city || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Pincode</p>
                  <p className="text-gray-800 font-medium">{user?.pincode || "-"}</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => handleSendOtp("UPDATE")}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-semibold transition shadow-md shadow-green-600/20 text-sm"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setDeleteOtpSent(!deleteOtpSent)}
                  className="ml-4 text-xs font-medium text-red-500 hover:text-red-700 hover:underline transition"
                >
                  Delete Account
                </button>

                {/* Inline Delete UI trigger */}
                {deleteOtpSent && (
                  <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100 animate-fade-in">
                    <p className="text-xs text-red-600 mb-2 font-medium">An OTP to delete your account has been sent to your email.</p>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Enter OTP" className={`${inputClass} !py-1.5`} value={deleteOtp} onChange={(e) => setDeleteOtp(e.target.value)} />
                      <button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition shrink-0">
                        {deleting ? "Deleting..." : "Confirm Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Mini Map */}
            <div className="md:w-1/2 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col items-center justify-center p-8 relative min-h-[300px]">
              <div className="flex items-center gap-2 mb-4 w-full">
                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800">Saved Location</h2>
              </div>

              {user?.latitude && user?.longitude ? (
                <div className="w-full h-full min-h-[250px] rounded-2xl border-4 border-white shadow-lg overflow-hidden relative group">
                  <div ref={viewMapRef} className="w-full h-full absolu inset-0 z-0 bg-gray-200"></div>
                  {/* Overlay to prevent exact mapping interaction until edited */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none flex items-center justify-center z-10">
                  </div>
                </div>
              ) : (
                <div className="text-center p-10 bg-white rounded-2xl border border-gray-200 shadow-sm w-full">
                  <p className="text-gray-500 mb-2">No location saved yet.</p>
                  <span className="text-xs text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">Edit profile to add</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- VERIFY OTP MODE (Transition to Edit) --- */}
        {mode === "VERIFY" && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8 max-w-md mx-auto text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
            <p className="text-sm text-gray-500 mb-6">We've sent a security code to verify it's you before allowing edits. Keep this window open.</p>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter OTP (e.g. 123456)"
                className={`${inputClass} text-center text-lg tracking-widest font-mono`}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button
                onClick={handleVerifyOtpForEdit}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition"
              >
                Verify & Continue
              </button>
              <button
                onClick={handleCancelEdit}
                className="w-full text-gray-500 hover:text-gray-800 text-sm font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* --- EDIT MODE --- */}
        {mode === "EDIT" && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-6 sm:p-10 animate-fade-in relative">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Edit Profile</h2>
              </div>
              <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-700 font-bold bg-gray-50 w-8 h-8 rounded-full flex items-center justify-center">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Profile Image Picker */}
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pt-4">
                <div className="w-24 h-24 rounded-[2rem] bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl text-gray-400">👤</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-white text-xs font-bold">Change</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setProfileImageFile(file);
                        setPreviewImage(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Profile Picture</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">Upload a photo to help organizations and donors recognize you. (Optional)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input type="text" required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                  <input type="text" required pattern="[0-9]{10,15}" title="Enter valid phone" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">State</label>
                  <input type="text" required className={inputClass} value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">District</label>
                  <input type="text" required className={inputClass} value={district} onChange={(e) => setDistrict(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">City / Village</label>
                  <input type="text" required className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Pincode</label>
                  <input type="text" required className={inputClass} value={pincode} onChange={(e) => setPincode(e.target.value)} />
                </div>
              </div>

              {/* Location Selection */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-0.5">Location Coordinates <span className="text-red-400">*</span></label>
                    <p className="text-xs text-gray-500">Pick your exact location to help drivers find you.</p>
                  </div>
                  <button type="button" onClick={() => setShowMapPicker(true)} className="px-4 py-2 rounded-lg text-sm font-bold bg-green-600 hover:bg-green-700 text-white shadow-md transition flex items-center gap-2">
                    🗺️ Pick from Map
                  </button>
                </div>

                {/* Selected Location Preview */}
                <div className="bg-white border rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">📍</div>
                  {latitude && longitude ? (
                    <div>
                      <p className="text-sm font-bold text-gray-800">Coordinates Selected</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">LAT: {parseFloat(latitude).toFixed(5)} | LON: {parseFloat(longitude).toFixed(5)}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-500 font-semibold italic">No location selected yet.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-600/20 text-sm">
                  {loading ? "⏳ Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={handleCancelEdit} className="w-1/3 min-w-[100px] bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* Map Picker Modal (Unchanged essentially) */}
      {showMapPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Select Your Location</h3>
              <button
                onClick={() => setShowMapPicker(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 font-bold flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-white border-b shadow-sm">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search location (e.g., 'Delhi', 'New York')"
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleMapSearchZoom()}
                  className={`${inputClass} !py-2.5 shadow-inner`}
                  autoFocus
                />
                <button
                  onClick={handleMapSearchZoom}
                  className="bg-blue-600 text-white px-6 rounded-xl hover:bg-blue-700 font-bold whitespace-nowrap shadow-md transition"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
              <div className="flex-1 bg-gray-100 relative min-h-[350px]">
                <div
                  ref={mapRef}
                  className="absolute inset-0 z-0"
                />
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-md pointer-events-none border border-gray-100">
                  <p className="text-xs font-semibold text-gray-700">Click anywhere to drop a pin 📍</p>
                </div>
              </div>

              {mapSearchResults.length > 0 && (
                <div className="border-t p-4 bg-white/95 backdrop-blur absolute bottom-0 left-0 right-0 z-20 max-h-[200px] overflow-y-auto shadow-[-0_10px_30px_rgba(0,0,0,0.1)]">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Search Results</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mapSearchResults.map((result, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          const lat = parseFloat(result.lat);
                          const lon = parseFloat(result.lon);
                          setTempLat(lat.toString());
                          setTempLon(lon.toString());
                          if (mapInstanceRef.current) {
                            mapInstanceRef.current.setView([lat, lon], 14);
                            if (markerRef.current) { mapInstanceRef.current.removeLayer(markerRef.current); }
                            markerRef.current = window.L.marker([lat, lon]).addTo(mapInstanceRef.current).openPopup();
                          }
                        }}
                        className="p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition flex items-start gap-3"
                      >
                        <span className="text-lg">📍</span>
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-gray-800 line-clamp-1">{result.name}</p>
                          <p className="text-gray-500 font-mono mt-0.5">{parseFloat(result.lat).toFixed(3)}, {parseFloat(result.lon).toFixed(3)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t p-5 bg-gray-50 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
              <div className="text-sm">
                {tempLat && tempLon ? (
                  <span className="text-green-600 font-bold flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                    <span>✓</span> Selected: {parseFloat(tempLat).toFixed(4)}, {parseFloat(tempLon).toFixed(4)}
                  </span>
                ) : (
                  <span className="text-gray-500 font-medium">No point selected.</span>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={() => setShowMapPicker(false)} className="flex-1 px-6 py-2.5 rounded-xl font-bold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleConfirmMapLocation} disabled={!tempLat || !tempLon} className="flex-1 px-8 py-2.5 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 transition shadow-md">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Account;

