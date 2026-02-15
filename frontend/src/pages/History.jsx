import { useEffect, useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

function History() {
  const [data, setData] = useState([]);
  const role = localStorage.getItem("role");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      if (role === "donor") {
        const res = await API.get("/donations/my/all");
        setData(res.data);
      } else {
        const res = await API.get("/requests/history");
        setData(res.data);
      }
    } catch (error) {
      toast.error("Error fetching history");
    }
  };

  const handleComplete = async (requestId) => {
    await API.post("/match/complete", { requestId });
    toast.success("Marked as completed");
    fetchHistory();
  };

  const handleCancel = async (requestId) => {
    await API.post("/requests/cancel", { requestId });
    toast.success("Request cancelled");
    fetchHistory();
  };

  const handleApprove = async (donationId, orgId) => {
    await API.post("/match/approve", {
      donationId,
      organizationId: orgId
    });
    toast.success("Donation approved");
    fetchHistory();
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

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-gray-800">
        History
      </h2>

      {data.length === 0 && (
        <div className="bg-white shadow-md rounded-xl p-6 text-center text-gray-500">
          No records found.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.map((entry) => (
          <div
            key={entry._id}
            className="bg-white shadow-md rounded-xl p-6 hover:shadow-lg transition"
          >
            <div className="flex justify-between items-center mb-4">
              <span className={getStatusBadge(entry.status)}>
                {entry.status.toUpperCase()}
              </span>
            </div>

            {/* ================= DONOR VIEW ================= */}
            {role === "donor" && (
              <>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">
                  Donated Items
                </h4>

                <ul className="mb-4 text-gray-600">
                  {entry.items.map((item, index) => (
                    <li key={index}>
                      • {item.name} — {item.quantity} {item.unit}
                    </li>
                  ))}
                </ul>

                {/* Requested By */}
                {entry.requestedBy?.length > 0 && entry.status !== "completed" && (
  <div className="mt-4">
    <h5 className="font-semibold mb-2">
      Requested By:
    </h5>

    {entry.requestedBy.map((org) => {
      const isReserved =
        entry.status === "reserved" &&
        entry.acceptedBy?._id === org._id;

      return (
        <div
          key={org._id}
          className="flex justify-between items-center mb-2"
        >
          <span>
            {org.name} ({org.city})
          </span>

          {/* Show Approve only if not reserved */}
          {entry.status !== "reserved" && (
            <button
              onClick={() =>
                handleApprove(entry._id, org._id)
              }
              className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
            >
              Approve
            </button>
          )}

          {/* Show Reserved badge */}
          {isReserved && (
            <span className="text-orange-600 font-semibold text-sm">
              Reserved
            </span>
          )}
        </div>
      );
    })}
  </div>
)}


                {/* Reserved Info */}
                {entry.status === "reserved" && entry.acceptedBy && (
                  <div className="mt-4 text-gray-600">
                    Reserved by: {entry.acceptedBy.name}
                  </div>
                )}
              </>
            )}

            {/* ================= ORGANIZATION VIEW ================= */}
            {role === "organization" && (
              <>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">
                  Donation Details
                </h4>

                {entry.matchedDonation && (
                  <>
                    <p className="text-sm text-gray-500 mb-2">
                      📍 {entry.matchedDonation.donor?.city}
                    </p>

                    <ul className="mb-4 text-gray-600">
                      {entry.matchedDonation.items.map((item, index) => (
                        <li key={index}>
                          • {item.name} — {item.quantity} {item.unit}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {entry.status === "reserved" && (
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={() => handleComplete(entry._id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Complete
                    </button>

                    <button
                      onClick={() => handleCancel(entry._id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}

export default History;
