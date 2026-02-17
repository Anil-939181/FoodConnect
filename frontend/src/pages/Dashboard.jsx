import { useEffect, useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

function Dashboard() {
  const role = localStorage.getItem("role");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [role]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const endpoint = role === "donor" ? "/dashboard/donor" : "/dashboard/organization";
      const res = await API.get(endpoint);
      setData(res.data);
    } catch (error) {
      toast.error("Error loading dashboard");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-24 rounded-2xl animate-pulse"></div>
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-xl animate-pulse"></div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded mb-3 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No data available</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      available: "bg-gray-100 text-gray-700",
      requested: "bg-blue-100 text-blue-700",
      reserved: "bg-orange-100 text-orange-700",
      fulfilled: "bg-green-100 text-green-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      rejected: "bg-red-100 text-red-700"
    };
    return badges[status] || "bg-gray-100 text-gray-700";
  };

  const getExpiryCountdown = (expiryTime) => {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const diff = expiry - now;

    if (diff < 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d left`;
    return `${hours}h left`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const AnimatedStat = ({ value, label, icon, color }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      const steps = 20;
      const increment = Math.ceil(value / steps);
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(current);
        }
      }, 30);
      return () => clearInterval(timer);
    }, [value]);

    const colorClasses = {
      blue: "bg-blue-50 border-blue-200",
      green: "bg-green-50 border-green-200",
      orange: "bg-orange-50 border-orange-200",
      purple: "bg-purple-50 border-purple-200",
      red: "bg-red-50 border-red-200",
      gray: "bg-gray-50 border-gray-200"
    };

    const iconColorClasses = {
      blue: "text-blue-500",
      green: "text-green-500",
      orange: "text-orange-500",
      purple: "text-purple-500",
      red: "text-red-500",
      gray: "text-gray-500"
    };

    return (
      <div
        className={`${colorClasses[color]} border-l-4 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-fadeIn`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">{label}</p>
            <p className={`text-3xl font-bold mt-2 ${iconColorClasses[color]}`}>
              {count}
            </p>
          </div>
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
    );
  };

  // =================== DONOR DASHBOARD ===================
  if (role === "donor") {
    const { stats, recent } = data;
    return (
      <div className="space-y-8 fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white shadow-lg">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-green-100 mt-2">Donation overview and recent activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <AnimatedStat
            value={stats.totalDonations}
            label="Total Donations"
            icon={null}
            color="purple"
          />
          <AnimatedStat
            value={stats.availableDonations}
            label="Available"
            icon={null}
            color="gray"
          />
          <AnimatedStat
            value={stats.requestedDonations}
            label="Requested"
            icon={null}
            color="blue"
          />
          <AnimatedStat
            value={stats.reservedDonations}
            label="Reserved"
            icon={null}
            color="orange"
          />
          <AnimatedStat
            value={stats.completedDonations}
            label="Completed"
            icon={null}
            color="green"
          />
        </div>

        {/* Requests Received Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Requests Received</p>
              <p className="text-4xl font-bold text-gray-800 mt-2">{stats.totalRequestsReceived}</p>
            </div>
            <div className="text-3xl text-gray-400">&nbsp;</div>
          </div>
        </div>

        {/* Recent Donations Table */}
        {recent.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Recent Donations</h2>
              <p className="text-gray-500 text-sm mt-1">Your last 5 donations</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">
                      Meal Type
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">
                      Items
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">
                      Expiry
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">
                      Requests
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">
                      Posted
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((donation) => (
                    <tr
                      key={donation._id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-8 py-4">
                        <span className="capitalize font-medium text-gray-800">
                          {donation.mealType}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-gray-600">
                        {donation.itemsCount} item{donation.itemsCount !== 1 ? "s" : ""}
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(donation.status)}`}>
                          {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-sm text-orange-600 font-medium">
                          {getExpiryCountdown(donation.expiryTime)}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                          {donation.requestsCount}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-gray-600 text-sm">
                        {formatDate(donation.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <p className="text-gray-500 text-lg">No donations yet. Start sharing food today.</p>
          </div>
        )}
      </div>
    );
  }

  // =================== ORGANIZATION DASHBOARD ===================
  if (role === "organization") {
    const { stats, recent } = data;

    return (
      <div className="space-y-8 fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl p-8 text-white shadow-lg">
          <h1 className="text-4xl font-bold">Welcome Back, Organization! 👋</h1>
          <p className="text-blue-100 mt-2">Track your food requests and matches</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <AnimatedStat
            value={stats.totalRequests}
            label="Total Requests"
            icon="📋"
            color="purple"
          />
          <AnimatedStat
            value={stats.requestedCount}
            label="Requested"
            icon="🔔"
            color="blue"
          />
          <AnimatedStat
            value={stats.reservedCount}
            label="Reserved"
            icon="🔒"
            color="orange"
          />
          <AnimatedStat
            value={stats.completedCount}
            label="Fulfilled"
            icon="✨"
            color="green"
          />
          <AnimatedStat
            value={stats.cancelledCount}
            label="Cancelled"
            icon="❌"
            color="red"
          />
        </div>

        {/* Nearby Donations Card */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-200 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Nearby Available Donations</p>
              <p className="text-4xl font-bold text-teal-600 mt-2">
                {stats.nearbyAvailableDonationsCount}
              </p>
            </div>
            <span className="text-5xl">🗺️</span>
          </div>
        </div>

        {/* Recent Requests Table */}
        {recent.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Recent Requests</h2>
              <p className="text-gray-500 text-sm mt-1">Your last 5 food requests</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">
                      Request ID
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">
                      Items
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">
                      Required On
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((request) => (
                    <tr
                      key={request._id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-8 py-4">
                        <span className="font-mono text-sm text-gray-700">
                          {request._id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-gray-600">
                        {request.itemsCount} item{request.itemsCount !== 1 ? "s" : ""}
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-gray-600 text-sm">
                        {formatDate(request.requiredBefore)}
                      </td>
                      <td className="px-8 py-4 text-gray-600 text-sm">
                        {formatDate(request.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <p className="text-gray-500 text-lg">No requests yet. Start searching for available food.</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default Dashboard;
