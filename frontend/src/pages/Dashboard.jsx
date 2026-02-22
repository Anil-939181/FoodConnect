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
      blue: "from-blue-50 to-white border-blue-100",
      green: "from-green-50 to-white border-green-100",
      orange: "from-orange-50 to-white border-orange-100",
      purple: "from-purple-50 to-white border-purple-100",
      red: "from-red-50 to-white border-red-100",
      gray: "from-gray-50 to-white border-gray-100",
      teal: "from-teal-50 to-white border-teal-100"
    };

    const iconColorClasses = {
      blue: "text-blue-600 bg-blue-100",
      green: "text-green-600 bg-green-100",
      orange: "text-orange-600 bg-orange-100",
      purple: "text-purple-600 bg-purple-100",
      red: "text-red-600 bg-red-100",
      gray: "text-gray-600 bg-gray-200",
      teal: "text-teal-600 bg-teal-100"
    };

    return (
      <div className={`bg-gradient-to-br ${colorClasses[color]} bg-opacity-50 border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group`}>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wider">{label}</p>
            <p className="text-4xl font-extrabold text-gray-800 tracking-tight">{count}</p>
          </div>
          {icon && (
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColorClasses[color]} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
              <span className="text-2xl">{icon}</span>
            </div>
          )}
        </div>
        <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${iconColorClasses[color]} opacity-20 group-hover:scale-150 transition-transform duration-500 blur-2xl`}></div>
      </div>
    );
  };

  // =================== DONOR DASHBOARD ===================
  if (role === "donor") {
    const { stats, recent } = data;
    return (
      <div className="min-h-screen bg-gray-50 pb-12 w-full">
        {/* 🌟 Premium Header */}
        <div className="bg-gradient-to-tr from-green-700 to-emerald-900 text-white pb-24 pt-10 md:pt-12 px-6 shadow-inner mb-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
              Dashboard
            </h1>
            <p className="text-green-100 text-lg max-w-2xl font-medium">
              Donation overview and recent activity
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 space-y-8 relative z-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            <AnimatedStat
              value={stats.totalDonations}
              label="Total Donations"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path></svg>}
              color="purple"
            />
            <AnimatedStat
              value={stats.availableDonations}
              label="Available"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
              color="gray"
            />
            <AnimatedStat
              value={stats.requestedDonations}
              label="Requested"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>}
              color="blue"
            />
            <AnimatedStat
              value={stats.reservedDonations}
              label="Reserved"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>}
              color="orange"
            />
            <AnimatedStat
              value={stats.completedDonations}
              label="Completed"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
              color="green"
            />
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-gray-500 font-semibold uppercase tracking-wider text-sm mb-1">Impact Tracker</p>
              <h3 className="text-3xl font-extrabold text-gray-800">Total Requests Received</h3>
              <p className="text-gray-500 mt-2">Organizations have reached out to claim your donations.</p>
            </div>
            <div className="w-full md:w-auto bg-green-50 text-green-700 font-extrabold text-5xl md:text-6xl px-8 py-6 rounded-2xl border border-green-100 flex items-center justify-center shadow-sm">
              {stats.totalRequestsReceived}
            </div>
          </div>

          {/* Recent Donations Table */}
          {recent.length > 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Recent Donations</h2>
                  <p className="text-gray-500 text-sm mt-1">Your latest 5 contributions</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                      <th className="px-6 py-4 font-semibold">Meal Type</th>
                      <th className="px-6 py-4 font-semibold">Items</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Expiry</th>
                      <th className="px-6 py-4 font-semibold text-center">Requests</th>
                      <th className="px-6 py-4 font-semibold">Posted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recent.map((donation) => (
                      <tr
                        key={donation._id}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-800 capitalize">
                            {donation.mealType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">
                          {donation.itemsCount} item{donation.itemsCount !== 1 ? "s" : ""}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${getStatusBadge(donation.status)}`}>
                            {donation.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-md">
                            {getExpiryCountdown(donation.expiryTime)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-sm">
                            {donation.requestsCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm font-medium">
                          {formatDate(donation.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No donations yet</h3>
              <p className="text-gray-500">Start sharing food today to see your activity here.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =================== ORGANIZATION DASHBOARD ===================
  if (role === "organization") {
    const { stats, recent } = data;

    return (
      <div className="min-h-screen bg-gray-50 pb-12 w-full">
        {/* 🌟 Premium Header */}
        <div className="bg-gradient-to-tr from-green-700 to-emerald-900 text-white pb-24 pt-10 md:pt-12 px-6 shadow-inner mb-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
              Welcome Back! 👋
            </h1>
            <p className="text-green-100 text-lg max-w-2xl font-medium">
              Track your food requests, manage collections, and coordinate with donors.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 space-y-8 relative z-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            <AnimatedStat
              value={stats.totalRequests}
              label="Total Requests"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>}
              color="purple"
            />
            <AnimatedStat
              value={stats.requestedCount}
              label="Pending"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
              color="blue"
            />
            <AnimatedStat
              value={stats.reservedCount}
              label="Reserved"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>}
              color="orange"
            />
            <AnimatedStat
              value={stats.completedCount}
              label="Fulfilled"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>}
              color="green"
            />
            <AnimatedStat
              value={stats.cancelledCount}
              label="Cancelled"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
              color="red"
            />
          </div>


          {/* Recent Requests Table */}
          {recent.length > 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Recent Requests</h2>
                  <p className="text-gray-500 text-sm mt-1">Your latest 5 food requests</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                      <th className="px-6 py-4 font-semibold">Items</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Required By</th>
                      <th className="px-6 py-4 font-semibold">Date Requested</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recent.map((request) => (
                      <tr
                        key={request._id}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4 text-gray-800 font-bold">
                          {request.itemsCount} item{request.itemsCount !== 1 ? "s" : ""}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${getStatusBadge(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium text-sm bg-orange-50/30">
                          {request.requiredBefore ? formatDate(request.requiredBefore) : <span className="text-gray-400 italic">Flexible</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm font-medium">
                          {formatDate(request.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No requests yet</h3>
              <p className="text-gray-500">Browse matches to find available food in your area.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default Dashboard;
