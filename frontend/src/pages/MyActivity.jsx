import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { toast } from "react-toastify";
import { haversineDistance } from "../utils/distance";

function MyActivity() {
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState("ongoing");
  const [searchText, setSearchText] = useState("");
  const [compactView, setCompactView] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [mapModal, setMapModal] = useState(null); // { lat, lon, query }
  const [userLocation, setUserLocation] = useState(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const limit = 5;

  // Fetch user location on mount
  useEffect(() => {
    const fetchUserLoc = async () => {
      try {
        const res = await API.get("/auth/me");
        if (res.data.latitude && res.data.longitude) {
          setUserLocation({ latitude: res.data.latitude, longitude: res.data.longitude });
        }
      } catch (error) {
        console.error("Error fetching user location:", error);
      }
    };
    fetchUserLoc();
  }, []);

  useEffect(() => {
    fetchHistory(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (page === 1) {
      fetchHistory(1);
    } else {
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchText]);

  // When selectedEntry changes, compute distance using user location
  useEffect(() => {
    setDistanceKm(null);
    if (!selectedEntry || !userLocation) return;

    const myLat = userLocation.latitude;
    const myLon = userLocation.longitude;

    if (!Number.isFinite(myLat) || !Number.isFinite(myLon)) return;

    // For donor: calculate distance to organizations that requested/accepted
    if (role === "donor") {
      // Use accepted org or first requestor if available
      let targetLat = null, targetLon = null;

      if (selectedEntry.acceptedBy?.latitude && selectedEntry.acceptedBy?.longitude) {
        targetLat = selectedEntry.acceptedBy.latitude;
        targetLon = selectedEntry.acceptedBy.longitude;
      } else if (selectedEntry.requestedBy?.[0]?.latitude && selectedEntry.requestedBy?.[0]?.longitude) {
        targetLat = selectedEntry.requestedBy[0].latitude;
        targetLon = selectedEntry.requestedBy[0].longitude;
      }

      if (Number.isFinite(targetLat) && Number.isFinite(targetLon)) {
        const km = haversineDistance(myLat, myLon, targetLat, targetLon);
        setDistanceKm(km.toFixed(1));
      }
    }

    // For organization: calculate distance to donor
    if (role === "organization") {
      const donorLat = selectedEntry.matchedDonation?.donor?.latitude;
      const donorLon = selectedEntry.matchedDonation?.donor?.longitude;

      if (Number.isFinite(donorLat) && Number.isFinite(donorLon)) {
        const km = haversineDistance(myLat, myLon, donorLat, donorLon);
        setDistanceKm(km.toFixed(1));
      }
    }
  }, [selectedEntry, userLocation, role]);

  const fetchHistory = async (pageNumber = 1) => {
    try {
      setLoading(true);
      let res;

      if (role === "donor") {
        res = await API.get(`/donations/my/all?page=${pageNumber}&limit=${limit}&tab=${activeTab}&search=${searchText}`);

      } else {
        res = await API.get(`/requests/my-activity?page=${pageNumber}&limit=${limit}&tab=${activeTab}&search=${searchText}`);

      }

      setData(res.data.results || res.data || []);
      setTotalPages(res.data.totalPages || Math.max(1, Math.ceil((res.data.total || 0) / limit)));

    } catch (error) {
      toast.error("Error fetching activity");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDonation = async (donationId) => {
    setDeleteTarget(donationId);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await API.delete(`/donations/${deleteTarget}`);
      toast.success("Donation removed");
      fetchHistory(page);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleDeliver = async (requestId) => {
    try {
      await API.post("/match/deliver", { requestId });
      toast.success("Marked as delivered");
      fetchHistory(page);
      if (typeof window !== 'undefined' && window.refreshNotif) {
        window.refreshNotif();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error marking as delivered");
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await API.post("/match/accept", { requestId });
      toast.success("Donation accepted");
      fetchHistory(page);
      if (typeof window !== 'undefined' && window.refreshNotif) {
        window.refreshNotif();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error accepting donation");
    }
  };

  const handleCancel = async (requestId) => {
    try {
      await API.post("/requests/cancel", { requestId });
      toast.success("Request cancelled");
      fetchHistory(page);
      if (typeof window !== 'undefined' && window.refreshNotif) {
        window.refreshNotif();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error cancelling request");
    }
  };

  const handleApprove = async (donationId, orgId) => {
    try {
      await API.post("/match/approve", {
        donationId,
        organizationId: orgId
      });
      toast.success("Donation approved");
      fetchHistory(page);
      // refresh notification count
      if (typeof window !== 'undefined' && window.refreshNotif) {
        window.refreshNotif();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error approving donation");
    }
  };

  const getStatusBadge = (status) => {
    const base = "px-3 py-1 text-xs font-semibold rounded-full ";
    const colors = {
      available: "bg-gray-200 text-gray-700",
      requested: "bg-blue-100 text-blue-600",
      reserved: "bg-orange-100 text-orange-600",
      accepted: "bg-indigo-100 text-indigo-600",
      delivered: "bg-green-100 text-green-700",
      completed: "bg-green-100 text-green-600",
      fulfilled: "bg-green-100 text-green-600",
      cancelled: "bg-red-100 text-red-600",
      rejected: "bg-red-100 text-red-600"
    };
    return base + (colors[status] || colors.available);
  };

  const ongoingStatuses = ["available", "requested", "reserved", "accepted"];
  const completedStatuses = ["completed", "delivered", "cancelled", "rejected", "fulfilled"];

  const filteredData = data
    .filter(entry =>
      activeTab === "ongoing"
        ? ongoingStatuses.includes(entry.status)
        : completedStatuses.includes(entry.status)
    )
    .filter(entry => {
      if (!searchText) return true;

      const text = searchText.toLowerCase();

      if (role === "donor") {
        return entry.items?.some(item =>
          item.name.toLowerCase().includes(text)
        );
      } else {
        return entry.matchedDonation?.items?.some(item =>
          item.name.toLowerCase().includes(text)
        );
      }
    });

  return (
    <div className="min-h-screen bg-gray-50 pb-12 w-full">
      {/* 🌟 Premium Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-gradient-to-tr from-green-700 to-emerald-900 text-white pb-20 pt-10 md:pt-12 px-6 sm:px-10 shadow-xl rounded-[2rem] mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full filter blur-3xl transform translate-x-1/2 -translate-y-1/2 z-0"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
              My Activity
            </h2>
            <p className="text-green-100 text-lg max-w-2xl font-medium">
              Track your donations, monitor ongoing requests, and review your past contributions to the community.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 md:px-6 -mt-16">

        {/* 🎨 FILTER SECTION - Glassmorphism */}
        <div className="bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl p-4 md:p-6 mb-8 md:mb-10 border border-white/40 flex flex-col md:flex-row items-center justify-between gap-4">

          <div className="flex bg-gray-100 p-1.5 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab("ongoing")}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === "ongoing"
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Ongoing Activity
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === "completed"
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              History
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search items..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium placeholder-gray-400"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse flex flex-col h-48"></div>
            ))}
          </div>
        )}

        {/* Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {
              filteredData.map(entry => (
                <div
                  key={entry._id}
                  className="group bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>

                  {(role === "donor" ? entry.foodImage : entry.matchedDonation?.foodImage) && (
                    <div className="w-full h-32 mb-4 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 relative group/img">
                      <div className="absolute inset-0 bg-black/5 group-hover/img:bg-transparent transition-colors z-10"></div>
                      <img src={role === "donor" ? entry.foodImage : entry.matchedDonation?.foodImage} alt="Food Donation" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105" />
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`${getStatusBadge(entry.status)} uppercase tracking-wider`}>
                        {entry.status}
                      </span>
                      <p className="text-xs text-gray-400 mt-2 font-medium">#{entry._id.slice(-6)}</p>
                    </div>

                    {/* Subtle Edit / Delete in top right */}
                    {role === "donor" && entry.status === "available" && (!entry.requestedBy || entry.requestedBy.length === 0) && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => navigate(`/donations/${entry._id}/edit`)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit donation"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button
                          onClick={() => handleDeleteDonation(entry._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete donation"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 bg-gray-50/50 rounded-xl p-3 border border-gray-50 mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Items</p>
                    <div className="flex flex-wrap gap-2">
                      {role === "donor" && entry.items?.slice(0, 3).map((item, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded shadow-sm">
                          {item.name} <span className="text-green-600">{item.quantity} {item.unit}</span>
                        </span>
                      ))}
                      {role === "organization" && entry.matchedDonation?.items?.slice(0, 3).map((item, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded shadow-sm">
                          {item.name} <span className="text-green-600">{item.quantity} {item.unit}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex flex-col gap-2">

                      {role === "organization" && entry.status === "reserved" && (
                        <div className="flex w-full gap-2">
                          <button
                            onClick={() => handleAccept(entry._id)}
                            className="flex-1 bg-green-50 text-green-700 font-semibold py-2 rounded-xl hover:bg-green-100 border border-green-200 transition text-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleCancel(entry._id)}
                            className="flex-1 bg-red-50 text-red-600 font-semibold py-2 rounded-xl border border-red-200 hover:bg-red-100 transition text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {role === "organization" && entry.status === "accepted" && (
                        <div className="flex w-full gap-2">
                          <button
                            onClick={() => handleDeliver(entry._id)}
                            className="flex-1 bg-green-600 text-white font-semibold py-2 rounded-xl hover:bg-green-700 transition text-sm shadow-sm border border-green-700"
                          >
                            Mark Delivered
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold py-2 rounded-xl hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-colors flex items-center justify-center gap-1.5 text-sm"
                      >
                        View Details
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                      </button>

                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage(prev => prev - 1)}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="font-semibold">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(prev => prev + 1)}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
        {/* DELETE CONFIRMATION MODAL */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4 text-red-600">Confirm Deletion</h3>
              <p>This donation helps people in need. Consider completing it instead.</p>
              <p className="mt-4">Are you sure you want to delete?</p>
              <div className="mt-6 flex justify-end gap-3">
                <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={cancelDelete}>Cancel</button>
                <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        )}


        {/* DETAILS MODAL */}
        {selectedEntry && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative overflow-y-auto max-h-[90vh]">
              <button
                onClick={() => setSelectedEntry(null)}
                className="absolute top-4 right-4 bg-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                title="Close"
              >
                ✕
              </button>

              <h3 className="text-2xl font-bold mb-5 text-gray-800 border-b pb-3">
                Donation Details
              </h3>

              <div className="mb-4">
                <span className={`${getStatusBadge(selectedEntry.status)} uppercase tracking-wider text-sm px-3 py-1`}>
                  {selectedEntry.status}
                </span>
              </div>

              {role === "donor" && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Meal Type</p>
                      <p className="font-medium text-gray-800">{selectedEntry.mealType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Created At</p>
                      <p className="font-medium text-gray-800 text-sm">{new Date(selectedEntry.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Expiry</p>
                      <p className="font-medium text-gray-800 text-sm">{new Date(selectedEntry.expiryTime).toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                      Items
                    </h4>
                    <ul className="space-y-2">
                      {selectedEntry.items?.map((item, i) => (
                        <li key={i} className="flex justify-between items-center bg-white border border-gray-100 p-2.5 rounded-lg shadow-sm">
                          <span className="font-medium text-gray-700">{item.name}</span>
                          <span className="bg-green-50 text-green-700 font-bold px-2 py-1 rounded text-sm">{item.quantity} {item.unit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Incoming Requests Section inside the modal */}
                  {selectedEntry.status === "requested" && selectedEntry.requestedBy && selectedEntry.requestedBy.length > 0 && (
                    <div className="mt-6 border-t pt-4 border-gray-100">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                        Pending Requests
                      </h4>
                      <div className="space-y-3">
                        {selectedEntry.requestedBy.map(org => (
                          <div key={org._id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                            <div>
                              <p className="font-bold text-gray-800">{org.name}</p>
                              {org.city && <p className="text-xs text-gray-500 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> {org.city}</p>}
                            </div>
                            <div className="flex w-full sm:w-auto gap-2">
                              <button
                                onClick={() => {
                                  if (org.latitude && org.longitude) {
                                    setMapModal({
                                      lat: org.latitude, lon: org.longitude,
                                      latDegrees: org.latDegrees, latMinutes: org.latMinutes, latSeconds: org.latSeconds,
                                      lonDegrees: org.lonDegrees, lonMinutes: org.lonMinutes, lonSeconds: org.lonSeconds,
                                      name: org.name, city: org.city
                                    });
                                  } else {
                                    setMapModal({ query: `${org.name} ${org.city || ''}`.trim() });
                                  }
                                }}
                                className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition text-sm"
                              >
                                View Map
                              </button>
                              <button
                                onClick={() => {
                                  handleApprove(selectedEntry._id, org._id);
                                  setSelectedEntry(null);
                                }}
                                className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 shadow-sm transition text-sm shadow-green-600/20"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show organizations that accepted or reserved this donation */}
                  {(selectedEntry.acceptedBy || selectedEntry.reservedFor) && (
                    <div className="mt-6 border-t pt-4 border-gray-100">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {selectedEntry.acceptedBy ? "Accepted By" : "Approved To"}
                      </h4>
                      {(() => {
                        const org = selectedEntry.acceptedBy || selectedEntry.reservedFor;
                        const orgs = Array.isArray(org) ? org : [org];
                        return orgs.map((o) => (
                          <div key={o._id} className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl mb-2">
                            <p className="font-bold text-blue-900">{o.name}</p>
                            <p className="text-sm text-blue-700">{o.city} {o.phone ? `— ${o.phone}` : ""} {o.email ? `— ${o.email}` : ""}</p>
                          </div>
                        ));
                      })()}
                    </div>
                  )}

                  {selectedEntry.requestedBy && selectedEntry.requestedBy.length > 0 && (
                    <div className="mt-3">
                      <h4 className="font-semibold">Requested By</h4>
                      {selectedEntry.requestedBy.map((org) => (
                        <div key={org._id} className="text-sm text-gray-700 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{org.name}</p>
                            <p className="text-gray-500">{org.city} — {org.phone || org.email}</p>
                          </div>
                          <div>
                            <button
                              onClick={() => {
                                // Use organization's location directly from User model
                                if (org.latitude && org.longitude) {
                                  setMapModal({
                                    lat: org.latitude,
                                    lon: org.longitude,
                                    latDegrees: org.latDegrees,
                                    latMinutes: org.latMinutes,
                                    latSeconds: org.latSeconds,
                                    lonDegrees: org.lonDegrees,
                                    lonMinutes: org.lonMinutes,
                                    lonSeconds: org.lonSeconds,
                                    name: org.name,
                                    city: org.city
                                  });
                                } else {
                                  setMapModal({ query: `${org.name} ${org.city || ''}`.trim() });
                                }
                              }}
                              className="ml-3 text-sm text-green-600 hover:underline"
                            >
                              View Map
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {distanceKm !== null && (
                    <div className="mt-3 text-sm text-gray-600">
                      <strong>Distance:</strong> {distanceKm} km from you
                    </div>
                  )}
                </div>
              )}

              {role === "organization" && selectedEntry.matchedDonation && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Donor</p>
                      <p className="font-medium text-gray-800">{selectedEntry.matchedDonation.donor?.name || "Unknown Donor"}</p>
                      {selectedEntry.status === "fulfilled" && (
                        <p className="text-xs text-gray-500 mt-1">{selectedEntry.matchedDonation.donor?.phone || selectedEntry.matchedDonation.donor?.email || ""}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Location</p>
                      <p className="font-medium text-gray-800 text-sm">{selectedEntry.matchedDonation.donor?.city || "Not specified"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Expiry</p>
                      <p className="font-medium text-gray-800 text-sm">{new Date(selectedEntry.matchedDonation.expiryTime).toLocaleString()}</p>
                    </div>
                  </div>

                  {distanceKm !== null && (
                    <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-800">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span className="font-medium text-sm">Distance: {distanceKm} km from you</span>
                      </div>
                      <button
                        onClick={() => {
                          const donor = selectedEntry.matchedDonation.donor;
                          if (donor?.latitude && donor?.longitude) {
                            setMapModal({
                              lat: donor.latitude,
                              lon: donor.longitude,
                              latDegrees: donor.latDegrees,
                              latMinutes: donor.latMinutes,
                              latSeconds: donor.latSeconds,
                              lonDegrees: donor.lonDegrees,
                              lonMinutes: donor.lonMinutes,
                              lonSeconds: donor.lonSeconds,
                              name: donor.name,
                              city: donor.city
                            });
                          } else {
                            setMapModal({ query: donor?.city || '' });
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-semibold transition"
                      >
                        Map
                      </button>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                      Items
                    </h4>
                    <ul className="space-y-2">
                      {selectedEntry.matchedDonation.items?.map((item, i) => (
                        <li key={i} className="flex justify-between items-center bg-white border border-gray-100 p-2.5 rounded-lg shadow-sm">
                          <span className="font-medium text-gray-700">{item.name}</span>
                          <span className="bg-green-50 text-green-700 font-bold px-2 py-1 rounded text-sm">{item.quantity} {item.unit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* MAP MODAL */}
        {mapModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-4 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-semibold text-lg">Location Details</h4>
                  {mapModal.name && (
                    <p className="text-sm text-gray-600">{mapModal.name} {mapModal.city ? `• ${mapModal.city}` : ''}</p>
                  )}
                </div>
                <button onClick={() => setMapModal(null)} className="text-gray-500 text-2xl">×</button>
              </div>

              {mapModal.lat && mapModal.lon ? (
                <>
                  {/* Location Coordinates Display */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Coordinates:</p>
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">Decimal:</span> {mapModal.lat.toFixed(6)}, {mapModal.lon.toFixed(6)}
                    </p>
                    {mapModal.latDegrees && mapModal.latMinutes && mapModal.latSeconds && mapModal.lonDegrees && mapModal.lonMinutes && mapModal.lonSeconds && (
                      <p className="text-sm text-gray-800 mt-1">
                        <span className="font-medium">DMS:</span> {mapModal.latDegrees}° {mapModal.latMinutes}' {mapModal.latSeconds?.toFixed(2)}" , {mapModal.lonDegrees}° {mapModal.lonMinutes}' {mapModal.lonSeconds?.toFixed(2)}"
                      </p>
                    )}
                  </div>

                  {/* Map */}
                  <div className="w-full h-72 mb-3 rounded-lg overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://maps.google.com/maps?q=${mapModal.lat},${mapModal.lon}&z=15&output=embed`}
                      title="map"
                    />
                  </div>

                  {/* Google Maps Link */}
                  <a
                    className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold"
                    href={`https://www.google.com/maps/search/?api=1&query=${mapModal.lat},${mapModal.lon}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Open in Google Maps
                  </a>
                </>
              ) : (
                <>
                  <div className="w-full h-72 mb-3 rounded-lg overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(mapModal.query)}&z=12&output=embed`}
                      title="map"
                    />
                  </div>
                  <a
                    className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapModal.query)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Open in Google Maps
                  </a>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div >
  );
}

export default MyActivity;
