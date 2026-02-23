import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import API from "../services/api";
import { toast } from "react-toastify";

function Matches() {
  const location = useLocation();
  const searchData = location.state;
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [customRequiredBefore, setCustomRequiredBefore] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  const [matches, setMatches] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [radius, setRadius] = useState(10);
  const [mealType, setMealType] = useState("");
  const [itemFilter, setItemFilter] = useState("");
  const [sortBy, setSortBy] = useState("best");

  const [selectedMap, setSelectedMap] = useState(null);

  // Fetch user location on mount
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const res = await API.get("/auth/me");
        if (res.data.latitude && res.data.longitude) {
          setUserLocation({ latitude: res.data.latitude, longitude: res.data.longitude });
        }
      } catch (error) {
        console.error("Error fetching user location:", error);
      }
    };
    fetchUserLocation();
  }, []);

  const fetchMatches = async (reset = false) => {
    if (loading || !userLocation) return;

    try {
      setLoading(true);

      const res = await API.post("/match/search", {
        ...searchData,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius,
        mealType,
        page: reset ? 1 : page,
        limit: 10
      });

      const newResults = res.data.results;

      if (reset) {
        setMatches(newResults);
        setPage(2);
      } else {
        setMatches(prev => [...prev, ...newResults]);
        setPage(prev => prev + 1);
      }

      if (newResults.length < 10) {
        setHasMore(false);
      }

    } catch (error) {
      toast.error("Error fetching matches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchData && userLocation) {
      setMatches([]);
      setPage(1);
      setHasMore(true);
      fetchMatches(true);
    }
  }, [radius, mealType, userLocation]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.offsetHeight
      ) {
        if (hasMore && !loading) {
          fetchMatches();
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading, page]);

  // ⏳ Countdown
  const getTimeRemaining = (expiry) => {
    const total = new Date(expiry) - new Date();

    if (total <= 0) return { label: "Expired", color: "text-red-600" };

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / (1000 * 60)) % 60);

    const totalHours = Math.floor(total / (1000 * 60 * 60));

    if (days >= 1) {
      return {
        label: `${days} day${days > 1 ? 's' : ''} ${hours}h left`,
        color: "text-green-600"
      };
    }

    if (totalHours <= 2) {
      return {
        label: `${totalHours}h ${minutes}m left`,
        color: "text-red-600 animate-pulse font-bold"
      };
    }

    if (totalHours <= 5) {
      return {
        label: `${totalHours}h ${minutes}m left`,
        color: "text-orange-600"
      };
    }

    return {
      label: `${totalHours}h ${minutes}m left`,
      color: "text-green-600"
    };
  };

  const filteredMatches = matches
    .filter(donation => {
      if (!itemFilter) return true;
      return donation.items.some(item =>
        item.name.toLowerCase().includes(itemFilter.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortBy === "expiry") {
        return new Date(a.expiryTime) - new Date(b.expiryTime);
      }
      if (sortBy === "best") {
        return (b.matchScore || 0) - (a.matchScore || 0);
      }
      return 0;
    });

  const handleRequestDonation = async (donationId) => {
    try {
      await API.post("/match/request", {
        donationId,
        requiredBefore: searchData?.requiredBefore
      });

      // Optimistic UI update: remove the requested item from the view
      setMatches(prev => prev.filter(m => m._id !== donationId));
      setShowRequestModal(null);

      toast.success("Request sent successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error sending request");
    }
  };

  const getMatchBadge = (score) => {
    if (!score) return null;
    if (score >= 8) return "bg-green-100 text-green-700";
    if (score >= 5) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getMatchLabel = (score) => {
    if (!score) return "";
    if (score >= 8) return "High Match";
    if (score >= 5) return "Medium Match";
    return "Low Match";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12 w-full">
      {/* 🌟 Premium Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-gradient-to-br from-green-600 to-emerald-800 text-white pb-20 pt-10 md:pt-12 px-6 sm:px-10 shadow-xl rounded-[2rem] mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full filter blur-3xl transform translate-x-1/2 -translate-y-1/2 z-0"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
              Discover Donations
            </h2>
            <p className="text-green-100 text-lg max-w-2xl font-medium">
              Find and request surplus food available in your community. Use the filters below to narrow down your search perfectly.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 md:px-6 -mt-16">
        {/* 🎨 FILTER SECTION - Glassmorphism */}
        <div className="bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl p-4 md:p-6 mb-8 md:mb-10 border border-white/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">

            <div className="space-y-2">
              <label className="flex justify-between text-sm font-semibold text-gray-700">
                <span>Distance Radius</span>
                <span className="text-green-600 font-bold">{radius} km</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Meal Type
              </label>
              <div className="relative">
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium"
                >
                  <option value="">All Meals</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snacks">Snacks</option>
                  <option value="fruits">Fruits</option>
                  <option value="other">Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Search Item
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. rice, bread..."
                  value={itemFilter}
                  onChange={(e) => setItemFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium placeholder-gray-400"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Sort By
              </label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium"
                >
                  <option value="best">Best Match Score</option>
                  <option value="expiry">Expiring Soonest</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">

          {filteredMatches.map((donation) => {
            const timeInfo = getTimeRemaining(donation.expiryTime);

            return (
              <div
                key={donation._id}
                className="group bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col h-full relative overflow-hidden"
              >
                {/* Highlight bar at top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>

                {donation.foodImage && (
                  <div className="w-full h-36 mb-4 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 relative group/img">
                    <div className="absolute inset-0 bg-black/10 group-hover/img:bg-transparent transition-colors z-10"></div>
                    <img src={donation.foodImage} alt={donation.mealType} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                  </div>
                )}

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 capitalize leading-tight">
                      {donation.mealType}
                    </h3>
                    <div className="flex items-center gap-1 mt-1.5 text-sm font-medium text-gray-500">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      <span className="truncate max-w-[120px]">{donation.donor?.city || "Unknown Location"}</span>
                      <span className="mx-1 text-gray-300">•</span>
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-bold border border-emerald-100 whitespace-nowrap">
                        {donation.distance ? `${donation.distance.toFixed(1)} km` : `< ${radius} km`}
                      </span>
                    </div>
                  </div>

                  {donation.matchScore && (
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0 ${getMatchBadge(donation.matchScore)} border border-current border-opacity-20`}>
                      {getMatchLabel(donation.matchScore)}
                    </span>
                  )}
                </div>

                <div className="flex-1 bg-gray-50/50 rounded-xl p-3 border border-gray-50 mb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Available Items</p>
                  <div className="flex flex-wrap gap-2">
                    {donation.items.map((item, index) => (
                      <span key={index} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium px-2.5 py-1 rounded-md shadow-sm">
                        {item.name} <span className="text-gray-400 text-xs">|</span> <span className="text-green-600 font-bold">{item.quantity} {item.unit}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-auto">
                  <div className={`flex items-center gap-2 mb-4 text-sm font-medium ${timeInfo.color}`}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {timeInfo.label}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedDonation(donation);
                        setCustomRequiredBefore(searchData?.requiredBefore || "");
                      }}
                      className="flex-1 bg-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-green-700 active:bg-green-800 transition-colors shadow-sm shadow-green-600/20 flex items-center justify-center gap-2"
                    >
                      Request
                      <svg className="w-4 h-4 md:hidden xl:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>

                    <button
                      onClick={() => setSelectedMap(donation)}
                      className="px-4 flex-shrink-0 bg-white border-2 border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1.5 group/btn"
                      title="View on Map"
                    >
                      <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                      <span className="text-sm">Map</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}

          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 h-[320px] animate-pulse flex flex-col">
                <div className="flex justify-between mb-4">
                  <div className="space-y-3">
                    <div className="h-6 w-32 bg-gray-200 rounded"></div>
                    <div className="h-4 w-24 bg-gray-100 rounded"></div>
                  </div>
                  <div className="h-8 w-16 bg-gray-100 rounded-lg"></div>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl mb-5"></div>
                <div className="h-4 w-3/4 bg-gray-100 rounded mb-4"></div>
                <div className="flex gap-3">
                  <div className="flex-1 h-11 bg-gray-200 rounded-xl"></div>
                  <div className="w-12 h-11 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))
          }

          {!loading && filteredMatches.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No matches found</h3>
              <p className="text-gray-500 max-w-sm mx-auto">Try expanding your search radius, changing the meal type, or clearing the search text.</p>
            </div>
          )}

        </div>

        {/* MAP MODAL */}
        {selectedMap && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

              <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                <div>
                  <h3 className="font-extrabold text-xl text-gray-900">Donor Location</h3>
                  {selectedMap.donor?.name && (
                    <p className="text-sm font-medium text-gray-500 mt-0.5">{selectedMap.donor.name} <span className="text-gray-300 mx-1">•</span> <span className="text-emerald-600">{selectedMap.donor?.city}</span></p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedMap(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <div className="p-5 overflow-y-auto">
                {selectedMap.donor?.latitude && selectedMap.donor?.longitude ? (
                  <>
                    <div className="mb-5 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                      <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        Coordinates Location
                      </p>
                      <p className="text-sm text-gray-700 font-medium">
                        {selectedMap.donor.latitude.toFixed(6)}, {selectedMap.donor.longitude.toFixed(6)}
                      </p>
                      {selectedMap.donor?.latDegrees && selectedMap.donor?.latMinutes && selectedMap.donor?.latSeconds && (
                        <p className="text-xs text-gray-500 mt-1.5 font-mono bg-white inline-block px-2 py-1 rounded border border-gray-100">
                          {selectedMap.donor.latDegrees}° {selectedMap.donor.latMinutes}' {selectedMap.donor.latSeconds?.toFixed(2)}" , {selectedMap.donor.lonDegrees}° {selectedMap.donor.lonMinutes}' {selectedMap.donor.lonSeconds?.toFixed(2)}"
                        </p>
                      )}
                    </div>

                    <div className="w-full h-[300px] mb-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative group bg-gray-50 flex items-center justify-center">
                      <div className="absolute inset-0 border-4 border-white rounded-xl z-10 pointer-events-none"></div>
                      <iframe
                        width="100%"
                        height="100%"
                        className="rounded-xl relative z-0"
                        src={`https://maps.google.com/maps?q=${selectedMap.donor.latitude},${selectedMap.donor.longitude}&z=15&output=embed`}
                        title="map"
                      ></iframe>
                    </div>

                    <a
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#4285F4] text-white rounded-xl hover:bg-[#3367D6] font-semibold text-sm transition-colors shadow-sm shadow-[#4285F4]/20"
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedMap.donor.latitude},${selectedMap.donor.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <svg className="w-5 h-5 text-white/90" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                      Open in Google Maps
                    </a>
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-8 border border-dashed border-gray-200 text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <p className="text-gray-900 font-bold mb-1">No Location Data</p>
                    <p className="text-gray-500 text-sm">The donor has not provided precise coordinates for this donation.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* REQUEST MODAL */}
        {selectedDonation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">

            <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">

              <button
                onClick={() => setSelectedDonation(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>

              <div className="mb-6 border-b border-gray-100 pb-4 pr-8">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-lg mb-2">Request Donation</span>
                <h3 className="text-2xl font-extrabold text-gray-900 capitalize leading-tight">
                  {selectedDonation.mealType}
                </h3>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Location</p>
                    <p className="text-sm font-bold text-gray-900">{selectedDonation.donor?.city}</p>
                    {selectedDonation.distance && (
                      <p className="text-xs font-medium text-emerald-600 mt-0.5">{selectedDonation.distance.toFixed(2)} km away</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Expires At</p>
                    <p className="text-sm font-bold text-gray-900">{new Date(selectedDonation.expiryTime).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Donation Items</h4>
                <ul className="space-y-2">
                  {selectedDonation.items.map((item, index) => (
                    <li key={index} className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                      <span className="font-medium text-gray-700">{item.name}</span>
                      <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md text-sm">{item.quantity} {item.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  When do you need this by? <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={customRequiredBefore}
                  onChange={(e) => setCustomRequiredBefore(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedDonation(null)}
                  className="flex-1 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await API.post("/match/request", {
                        donationId: selectedDonation._id,
                        requiredBefore: customRequiredBefore
                      });

                      toast.success("Request sent successfully");
                      setSelectedDonation(null);

                    } catch (error) {
                      toast.error(error.response?.data?.message || "Error sending request");
                    }
                  }}
                  className="flex-[2] bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 active:bg-green-800 transition-colors shadow-lg shadow-green-600/30"
                >
                  Confirm Request
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Matches;
