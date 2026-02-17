import { useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

function Donate() {
  const [items, setItems] = useState([
    { name: "", quantity: "", unit: "units" }
  ]);

  const [mealType, setMealType] = useState("other");
  const [expiryTime, setExpiryTime] = useState("");
  const [loading, setLoading] = useState(false);

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getCurrentDateTime = () => {
    return getMinDateTime();
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { name: "", quantity: "", unit: "units" }]);
  };

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!expiryTime) {
      toast.error("Please select expiry time");
      return;
    }

    setLoading(true);

    try {
      await API.post("/donations", {
        items: items.map(item => ({
          ...item,
          quantity: Number(item.quantity)
        })),
        mealType,
        expiryTime
      });

      toast.success("Donation created successfully");

      // Reset form
      setItems([{ name: "", quantity: "", unit: "units" }]);
      setMealType("other");
      setExpiryTime("");

    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating donation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Create Donation
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

          {/* Items Section */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-3">
              Items
            </label>

            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-3 mb-3"
              >
                <input
                  type="text"
                  placeholder="Item Name"
                  value={item.name}
                  onChange={(e) =>
                    handleItemChange(index, "name", e.target.value)
                  }
                  required
                  className="border rounded-lg p-2"
                />

                <input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(index, "quantity", e.target.value)
                  }
                  required
                  className="border rounded-lg p-2"
                />

                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Unit"
                    value={item.unit}
                    onChange={(e) =>
                      handleItemChange(index, "unit", e.target.value)
                    }
                    className="border rounded-lg p-2 w-full"
                  />

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="bg-red-500 text-white px-3 rounded-lg"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="text-green-600 font-medium hover:underline"
            >
              + Add Another Item
            </button>
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Expiry Time
            </label>
            <input
              type="datetime-local"
              value={expiryTime || getCurrentDateTime()}
              onChange={(e) => setExpiryTime(e.target.value)}
              min={getMinDateTime()}
              required
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Donation"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default Donate;
