import { useEffect, useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";
import { haversineDistance } from "../utils/distance";

function MyActivity() {
  const role = localStorage.getItem("role");

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

  const handleComplete = async (requestId) => {
    await API.post("/match/complete", { requestId });
    toast.success("Marked as completed");
    fetchHistory(page);
  };

  const handleCancel = async (requestId) => {
    await API.post("/requests/cancel", { requestId });
    toast.success("Request cancelled");
    fetchHistory(page);
  };

  const handleApprove = async (donationId, orgId) => {
    await API.post("/match/approve", {
      donationId,
      organizationId: orgId
    });
    toast.success("Donation approved");
    fetchHistory(page);
  };

  const handleDeleteDonation = async (donationId) => {
    // debug / feedback
    console.log("handleDeleteDonation called", donationId);
    toast.info("Please confirm deletion");
    // open modal
    setDeleteTarget(donationId);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    console.log("confirmDelete invoked", deleteTarget);
    if (!deleteTarget) return;
    try {
      const res = await API.delete(`/donations/${deleteTarget}`);
      console.log("delete response", res.data);
      toast.success("Donation removed");
      fetchHistory(page);
    } catch (error) {
      console.error("delete error", error);
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

  const getStatusBadge = (status) => {
    const base = "px-3 py-1 text-xs font-semibold rounded-full ";
    const colors = {
      available: "bg-gray-200 text-gray-700",
      requested: "bg-blue-100 text-blue-600",
      reserved: "bg-orange-100 text-orange-600",
      completed: "bg-green-100 text-green-600",
      fulfilled: "bg-green-100 text-green-600",
      cancelled: "bg-red-100 text-red-600",
      rejected: "bg-red-100 text-red-600"
    };
    return base + (colors[status] || colors.available);
  };

  const ongoingStatuses = ["available", "requested", "reserved"];
  const completedStatuses = ["completed", "cancelled", "rejected", "fulfilled"];

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
    <div className="max-w-7xl mx-auto px-4">

      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        My Activity
      </h2>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center mb-6">

        <button
          onClick={() => setActiveTab("ongoing")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === "ongoing"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Ongoing
        </button>

        <button
          onClick={() => setActiveTab("completed")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === "completed"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Completed
        </button>

        <input
          type="text"
          placeholder="Search items..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="border rounded-lg px-3 py-2 ml-auto"
        />

        <button
          onClick={() => setCompactView(!compactView)}
          className="bg-gray-100 px-3 py-2 rounded-lg"
        >
          {compactView ? "Card View" : "Compact View"}
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow animate-pulse h-28"></div>
          ))}
        </div>
      )}

      {/* Cards */}
      {!loading && (
        <>
        <div
          className={`transition-all duration-300 ${
            compactView
              ? "space-y-3"
              : "grid grid-cols-1 md:grid-cols-2 gap-6"
          }`}
        >
          {filteredData.map(entry => (
            <div
              key={entry._id}
              className={`bg-white shadow-md rounded-xl p-6 hover:shadow-xl transition ${
                compactView ? "flex justify-between items-center" : ""
              }`}
            >
              <div>
                <span className={getStatusBadge(entry.status)}>
                  {entry.status.toUpperCase()}
                </span>

                {role === "donor" && (
                  <ul className="mt-2 text-sm text-gray-600">
                    {entry.items?.slice(0, compactView ? 1 : 3).map((item, i) => (
                      <li key={i}>
                        • {item.name} — {item.quantity} {item.unit}
                      </li>
                    ))}
                  </ul>
                )}

                {role === "organization" && entry.matchedDonation && (
                  <ul className="mt-2 text-sm text-gray-600">
                    {entry.matchedDonation.items
                      ?.slice(0, compactView ? 1 : 3)
                      .map((item, i) => (
                        <li key={i}>
                          • {item.name} — {item.quantity} {item.unit}
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-3 mt-3 flex-wrap">

                {role === "donor" &&
                  entry.status === "requested" &&
                  entry.requestedBy?.map(org => (
                    <div key={org._id} className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(entry._id, org._id)}
                        className="bg-green-600 text-white px-3 py-1 rounded-md text-sm"
                      >
                        Approve {org.name}
                      </button>
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
                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-sm"
                      >
                        Map
                      </button>
                    </div>
                  ))}
                {role === "donor" && entry.status === "available" && (!entry.requestedBy || entry.requestedBy.length === 0) && (
                  <button
                    onClick={() => handleDeleteDonation(entry._id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    title="Delete donation"
                  >
                    🗑️
                  </button>
                )}

                {role === "organization" &&
                  entry.status === "reserved" && (
                    <>
                      <button
                        onClick={() => handleComplete(entry._id)}
                        className="bg-green-600 text-white px-3 py-1 rounded-md text-sm"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleCancel(entry._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                <button
                  onClick={() => setSelectedEntry(entry)}
                  className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm"
                >
                  View Details
                </button>

              </div>
            </div>
          ))}
        </div>
        </>
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
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative overflow-y-auto max-h-[90vh]">

            <button
              onClick={() => setSelectedEntry(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-xl"
            >
              ✕
            </button>

            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              Activity Details
            </h3>

            <span className={getStatusBadge(selectedEntry.status)}>
              {selectedEntry.status.toUpperCase()}
            </span>

            {role === "donor" && (
              <div className="mt-4 space-y-2">
                <p><strong>Meal Type:</strong> {selectedEntry.mealType}</p>
                <p><strong>Created At:</strong> {new Date(selectedEntry.createdAt).toLocaleString()}</p>
                <p><strong>Expiry:</strong> {new Date(selectedEntry.expiryTime).toLocaleString()}</p>

                <h4 className="font-semibold mt-3">Items</h4>
                {selectedEntry.items?.map((item, i) => (
                  <p key={i}>
                    • {item.name} — {item.quantity} {item.unit}
                  </p>
                ))}

                {/* Show organizations that requested or accepted this donation */}
                {selectedEntry.acceptedBy && (
                  <div className="mt-3">
                    <h4 className="font-semibold">Accepted By</h4>
                    {Array.isArray(selectedEntry.acceptedBy) ? (
                      selectedEntry.acceptedBy.map((org) => (
                        <div key={org._id} className="text-sm text-gray-700">
                          <p className="font-medium">{org.name}</p>
                          <p className="text-gray-500">{org.city} — {org.phone || org.email}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-700">
                        <p className="font-medium">{selectedEntry.acceptedBy.name}</p>
                        <p className="text-gray-500">{selectedEntry.acceptedBy.city} — {selectedEntry.acceptedBy.phone || selectedEntry.acceptedBy.email}</p>
                      </div>
                    )}
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
                            className="ml-3 text-sm text-blue-600 hover:underline"
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
              <div className="mt-4 space-y-2">
                <p><strong>Donor:</strong> {selectedEntry.matchedDonation.donor?.name}</p>
                <p><strong>City:</strong> {selectedEntry.matchedDonation.donor?.city}</p>
                <p><strong>Expiry:</strong> {new Date(selectedEntry.matchedDonation.expiryTime).toLocaleString()}</p>

                {distanceKm !== null && (
                  <div className="mt-3 text-sm text-gray-600">
                    <strong>Distance:</strong> {distanceKm} km from you
                  </div>
                )}

                <div className="mt-3">
                  <button
                    onClick={() => {
                        
                      const donor = selectedEntry.matchedDonation?.donor;
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
  setMapModal({
    query: `${donor?.name || ""} ${donor?.city || ""}`.trim()
  });
}

                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Donor Location
                  </button>
                </div>

                <h4 className="font-semibold mt-3">Items</h4>
                {selectedEntry.matchedDonation.items?.map((item, i) => (
                  <p key={i}>
                    • {item.name} — {item.quantity} {item.unit}
                  </p>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

      {/* MAP MODAL */}
      {/* MAP MODAL */}
{mapModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-lg">Location Details</h3>
          {mapModal.name && (
            <p className="text-sm text-gray-600">
              {mapModal.name} {mapModal.city ? `• ${mapModal.city}` : ''}
            </p>
          )}
        </div>

        <button
          onClick={() => setMapModal(null)}
          className="text-gray-500 text-2xl hover:text-gray-700 transition"
        >
          ×
        </button>
      </div>

      {/* If Coordinates Available */}
      {mapModal.lat && mapModal.lon ? (
        <>
          {/* Coordinates Box */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Coordinates:
            </p>

            <p className="text-sm text-gray-800">
              <span className="font-medium">Decimal:</span>{" "}
              {Number(mapModal.lat).toFixed(6)},{" "}
              {Number(mapModal.lon).toFixed(6)}
            </p>

            {mapModal.latDegrees &&
              mapModal.latMinutes &&
              mapModal.latSeconds &&
              mapModal.lonDegrees &&
              mapModal.lonMinutes &&
              mapModal.lonSeconds && (
                <p className="text-sm text-gray-800 mt-1">
                  <span className="font-medium">DMS:</span>{" "}
                  {mapModal.latDegrees}° {mapModal.latMinutes}'{" "}
                  {Number(mapModal.latSeconds).toFixed(2)}" ,{" "}
                  {mapModal.lonDegrees}° {mapModal.lonMinutes}'{" "}
                  {Number(mapModal.lonSeconds).toFixed(2)}"
                </p>
              )}
          </div>

          {/* Map Preview */}
          <div className="w-full h-64 mb-3 rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={`https://maps.google.com/maps?q=${mapModal.lat},${mapModal.lon}&z=15&output=embed`}
              title="map"
            ></iframe>
          </div>

          {/* Google Maps Button */}
          <a
            className="inline-block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition"
            href={`https://www.google.com/maps/search/?api=1&query=${mapModal.lat},${mapModal.lon}`}
            target="_blank"
            rel="noreferrer"
          >
            📍 Open in Google Maps
          </a>
        </>
      ) : (
        <>
          {/* Fallback using address query */}
          <div className="w-full h-64 mb-3 rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(
                mapModal.query || mapModal.city || ""
              )}&z=12&output=embed`}
              title="map"
            ></iframe>
          </div>

          <a
            className="inline-block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              mapModal.query || mapModal.city || ""
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            📍 Open in Google Maps
          </a>
        </>
      )}

      {/* Close Button */}
      <button
        onClick={() => setMapModal(null)}
        className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
      >
        Close
      </button>
    </div>
  </div>
)}


    </div>
  );
}

export default MyActivity;
