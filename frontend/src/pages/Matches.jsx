import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import API from "../services/api";
import { toast } from "react-toastify";

function Matches() {
  const location = useLocation();
  const searchData = location.state;
  const [selectedDonation, setSelectedDonation] = useState(null);
const [customRequiredBefore, setCustomRequiredBefore] = useState("");

  const [matches, setMatches] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [radius, setRadius] = useState(10);
  const [mealType, setMealType] = useState("");
  const [itemFilter, setItemFilter] = useState("");
  const [sortBy, setSortBy] = useState("best");

  const [selectedMap, setSelectedMap] = useState(null);

  const fetchMatches = async (reset = false) => {
    if (loading) return;

    try {
      setLoading(true);

      const res = await API.post("/match/search", {
        ...searchData,
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
    if (searchData) {
      setMatches([]);
      setPage(1);
      setHasMore(true);
      fetchMatches(true);
    }
  }, [radius, mealType]);

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

    const hours = Math.floor(total / (1000 * 60 * 60));
    const minutes = Math.floor((total / (1000 * 60)) % 60);

    if (hours <= 2) {
      return {
        label: `${hours}h ${minutes}m left`,
        color: "text-red-600 animate-pulse font-bold"
      };
    }

    if (hours <= 5) {
      return {
        label: `${hours}h ${minutes}m left`,
        color: "text-orange-600"
      };
    }

    return {
      label: `${hours}h ${minutes}m left`,
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
    <div className="max-w-7xl mx-auto px-4">

      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Nearby Food Donations
      </h2>

      {/* FILTER SECTION */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 shadow-lg rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Radius: {radius} km
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Meal Type
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="">All</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snacks">Snacks</option>
              <option value="fruits">Fruits</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Search Item
            </label>
            <input
              type="text"
              placeholder="e.g. rice"
              value={itemFilter}
              onChange={(e) => setItemFilter(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Sort
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="best">Best Match</option>
              <option value="expiry">Expiry Soon</option>
            </select>
          </div>

        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

        {filteredMatches.map((donation) => {
          const timeInfo = getTimeRemaining(donation.expiryTime);

          return (
            <div
              key={donation._id}
              className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-2xl transform hover:-translate-y-2 transition duration-300"
            >

              <div className="flex justify-between items-center mb-3">
                {donation.matchScore && (
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getMatchBadge(donation.matchScore)}`}>
                    {getMatchLabel(donation.matchScore)}
                  </span>
                )}

                <span className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full">
                  Within {radius} km
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-800">
                {donation.mealType.toUpperCase()}
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                📍 {donation.donor?.city}
              </p>

              <p className={`mt-3 text-sm ${timeInfo.color}`}>
                ⏳ {timeInfo.label}
              </p>

              <ul className="mt-4 text-gray-700 space-y-1">
                {donation.items.map((item, index) => (
                  <li key={index}>
                    • {item.name} — {item.quantity} {item.unit}
                  </li>
                ))}
              </ul>

              <div className="flex gap-3 mt-5">
                <button
  onClick={() => {
    setSelectedDonation(donation);
    setCustomRequiredBefore(searchData?.requiredBefore || "");
  }}

                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Request
                </button>

                <button
                  onClick={() => setSelectedMap(donation)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  View Map
                </button>
              </div>

            </div>
          );
        })}

        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-60"></div>
          ))
        }

      </div>

      {/* MAP MODAL */}
      {selectedMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h3 className="font-bold mb-3">Location Preview</h3>
            <iframe
              width="100%"
              height="250"
              src={`https://maps.google.com/maps?q=${selectedMap.location.coordinates[1]},${selectedMap.location.coordinates[0]}&z=15&output=embed`}
              title="map"
            ></iframe>

            <button
              onClick={() => setSelectedMap(null)}
              className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {selectedDonation && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    
    <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative animate-fadeIn shadow-2xl">

      {/* Close Button */}
      <button
        onClick={() => setSelectedDonation(null)}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
      >
        ✕
      </button>

      <h3 className="text-xl font-bold mb-4 text-gray-800">
        Donation Details
      </h3>

      {/* Meal */}
      <p className="text-gray-600 mb-1">
        🍽 <strong>Meal:</strong> {selectedDonation.mealType}
      </p>

      {/* City */}
      <p className="text-gray-600 mb-1">
        📍 <strong>City:</strong> {selectedDonation.donor?.city}
      </p>

      {/* Distance */}
      {selectedDonation.distance && (
        <p className="text-gray-600 mb-1">
          🚗 <strong>Distance:</strong> {selectedDonation.distance.toFixed(2)} km
        </p>
      )}

      {/* Expiry */}
      <p className="text-gray-600 mb-3">
        ⏳ <strong>Expires:</strong>{" "}
        {new Date(selectedDonation.expiryTime).toLocaleString()}
      </p>

      {/* Items */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Items:</h4>
        <ul className="space-y-1 text-gray-700">
          {selectedDonation.items.map((item, index) => (
            <li key={index}>
              • {item.name} — {item.quantity} {item.unit}
            </li>
          ))}
        </ul>
      </div>

      {/* Required Before Input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">
          Required Before (Optional)
        </label>
        <input
          type="datetime-local"
          value={customRequiredBefore}
          onChange={(e) => setCustomRequiredBefore(e.target.value)}
          className="w-full border rounded-lg p-2"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-4">
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
          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
        >
          Confirm Request
        </button>

        <button
          onClick={() => setSelectedDonation(null)}
          className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition"
        >
          Cancel
        </button>
      </div>

    </div>
  </div>
)}

    </div>
  );
}

export default Matches;
