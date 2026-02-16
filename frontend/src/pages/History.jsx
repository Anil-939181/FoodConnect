import { useEffect, useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

function History() {
  const role = localStorage.getItem("role");

  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState("ongoing");
  const [searchText, setSearchText] = useState("");
  const [compactView, setCompactView] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 5;

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  useEffect(() => {
  setPage(1);
}, [activeTab]);

  useEffect(() => {
  setPage(1);
}, [activeTab, searchText]);

  const fetchHistory = async (pageNumber = 1) => {
    try {
      let res;

      if (role === "donor") {
        res = await API.get(
  `/donations/my/all?page=${pageNumber}&limit=${limit}&tab=${activeTab}&search=${searchText}`
);

      } else {
        res = await API.get(
  `/requests/history?page=${pageNumber}&limit=${limit}&tab=${activeTab}&search=${searchText}`
);

      }

      setData(res.data.results);
      setTotalPages(res.data.totalPages);

    } catch (error) {
      toast.error("Error fetching activity");
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

      {/* Cards */}
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
                  <button
                    key={org._id}
                    onClick={() => handleApprove(entry._id, org._id)}
                    className="bg-green-600 text-white px-3 py-1 rounded-md text-sm"
                  >
                    Approve {org.name}
                  </button>
                ))}

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
              </div>
            )}

            {role === "organization" && selectedEntry.matchedDonation && (
              <div className="mt-4 space-y-2">
                <p><strong>Donor:</strong> {selectedEntry.matchedDonation.donor?.name}</p>
                <p><strong>City:</strong> {selectedEntry.matchedDonation.donor?.city}</p>
                <p><strong>Expiry:</strong> {new Date(selectedEntry.matchedDonation.expiryTime).toLocaleString()}</p>

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

    </div>
  );
}

export default History;
