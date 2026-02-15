import { useEffect, useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

function Dashboard() {
  const role = localStorage.getItem("role");

  const [active, setActive] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [extra, setExtra] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      if (role === "donor") {
        const res = await API.get("/donations/my/all");

        const donations = res.data;

        const activeCount = donations.filter(d =>
          ["available", "requested", "reserved"].includes(d.status)
        ).length;

        const completedCount = donations.filter(d =>
          d.status === "completed"
        ).length;

        const totalRequests = donations.reduce(
          (sum, d) => sum + (d.requestedBy?.length || 0),
          0
        );

        setActive(activeCount);
        setCompleted(completedCount);
        setExtra(totalRequests);

      } else {
        const res = await API.get("/requests/history");

        const requests = res.data;

        const activeCount = requests.filter(r =>
          ["requested", "reserved"].includes(r.status)
        ).length;

        const completedCount = requests.filter(r =>
          r.status === "fulfilled"
        ).length;

        const cancelledCount = requests.filter(r =>
          r.status === "cancelled"
        ).length;

        setActive(activeCount);
        setCompleted(completedCount);
        setExtra(cancelledCount);
      }

    } catch (error) {
      toast.error("Error loading dashboard data");
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Dashboard
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Active */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700">
            {role === "donor" ? "Active Donations" : "Active Requests"}
          </h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {active}
          </p>
        </div>

        {/* Completed */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700">
            Completed
          </h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {completed}
          </p>
        </div>

        {/* Extra Metric */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700">
            {role === "donor" ? "Total Requests Received" : "Cancelled Requests"}
          </h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {extra}
          </p>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
