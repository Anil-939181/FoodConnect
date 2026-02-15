import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import API from "../services/api";
import { toast } from "react-toastify";

function Matches() {
  const location = useLocation();
  const searchData = location.state;

  const [matches, setMatches] = useState([]);
  const [radius, setRadius] = useState(10);
  const [mealType, setMealType] = useState("");

  const fetchMatches = async () => {
    try {
      const res = await API.post("/match/search", {
        ...searchData,
        radius,
        mealType
      });

      setMatches(res.data);

    } catch (error) {
      toast.error("Error fetching matches");
    }
  };

  useEffect(() => {
    if (searchData) {
      fetchMatches();
    }
  }, [radius, mealType]);

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

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Available Donations
      </h2>

      {/* FILTER PANEL */}
      <div className="bg-white shadow-md rounded-xl p-6 mb-8">
        <h4 className="text-lg font-semibold mb-4 text-gray-700">
          Filters
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Radius */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Radius (km)
            </label>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full border rounded-lg p-2"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Meal Type */}
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

        </div>
      </div>

      {/* MATCH CARDS */}
      {matches.length === 0 && (
        <div className="bg-white shadow-md rounded-xl p-6 text-center text-gray-500">
          No donations found matching your criteria.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {matches.map((donation) => (
          <div
            key={donation._id}
            className="bg-white shadow-md rounded-xl p-6 hover:shadow-lg transition"
          >

            {/* Meal Badge */}
            <div className="mb-3">
              <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">
                {donation.mealType.toUpperCase()}
              </span>
            </div>

            {/* Donor Info */}
            <p className="text-sm text-gray-500 mb-2">
              📍 {donation.donor?.city}
            </p>

            {/* Items */}
            <h4 className="text-lg font-semibold text-gray-700 mb-2">
              Items:
            </h4>

            <ul className="mb-4 text-gray-600">
              {donation.items.map((item, index) => (
                <li key={index}>
                  • {item.name} — {item.quantity} {item.unit}
                </li>
              ))}
            </ul>

            {/* Action */}
            <button
              onClick={() => handleRequestDonation(donation._id)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Request Donation
            </button>

          </div>
        ))}
      </div>
    </div>
  );
}

export default Matches;
