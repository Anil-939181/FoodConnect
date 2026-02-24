import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import { toast } from "react-toastify";

function EditDonation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([{ name: "", quantity: "", unit: "units" }]);
  const [mealType, setMealType] = useState("other");
  const [expiryTime, setExpiryTime] = useState("");
  const [loading, setLoading] = useState(false);

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const res = await API.get(`/donations/${id}`);
        const d = res.data;
        setItems(d.items.map(i => ({ ...i })));
        setMealType(d.mealType || "other");
        setExpiryTime(d.expiryTime ? d.expiryTime.slice(0, 16) : "");
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load donation");
        navigate("/my-activity");
      }
    };
    fetchDonation();
  }, [id, navigate]);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { name: "", quantity: "", unit: "units" }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!expiryTime) {
      toast.error("Please select expiry time");
      return;
    }
    setLoading(true);
    try {
      await API.put(`/donations/${id}`, {
        items: items.map(item => ({ ...item, quantity: Number(item.quantity) })),
        mealType,
        expiryTime
      });
      toast.success("Donation updated successfully");
      navigate("/my-activity");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating donation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 mt-4 sm:mt-8">
      <div className="bg-white shadow-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Edit Donation
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Meal Type */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Meal Type
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snacks">Snacks</option>
              <option value="fruits">Fruits</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Items list */}
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={item.name}
                  required
                  onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Qty</label>
                <input
                  type="number"
                  min="0"
                  value={item.quantity}
                  required
                  onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Unit</label>
                <select
                  value={item.unit}
                  onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="units">units</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="liters">liters</option>
                </select>
              </div>
              <button
                type="button"
                className="text-red-500 self-start"
                onClick={() => removeItem(idx)}
                title="Remove item"
              >
                ✖️
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="text-blue-600 hover:underline text-sm"
          >
            + Add Item
          </button>

          {/* Expiry */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Expiry</label>
            <input
              type="datetime-local"
              value={expiryTime}
              required
              min={getMinDateTime()}
              onChange={(e) => setExpiryTime(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            {loading ? "Updating…" : "Update Donation"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditDonation;
