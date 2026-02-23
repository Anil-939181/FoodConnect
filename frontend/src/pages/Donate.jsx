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

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent focus:bg-white transition placeholder-gray-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center sm:px-4 sm:py-10">
      {/* ── Card ── */}
      <div className="w-full max-w-2xl bg-white sm:rounded-3xl shadow-xl overflow-hidden min-h-screen sm:min-h-0 flex flex-col">
        {/* Accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-green-700 via-emerald-400 to-green-500 shrink-0" />

        {/* Header */}
        <div className="flex flex-col items-center px-6 sm:px-8 pt-8 pb-4 shrink-0">
          <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl shadow-lg mb-4 text-white">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight text-center">Donate Food</h1>
          <p className="text-sm text-gray-400 mt-1 text-center">Share your surplus meals with those in need</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 sm:px-8 pb-8 flex-1 flex flex-col">
          <div className="space-y-6">

            {/* Meal Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Meal Type
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className={inputClass}
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
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Items to Donate
              </label>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 sm:p-0 bg-gray-50 border sm:border-transparent border-gray-100 rounded-xl sm:bg-transparent"
                  >
                    <input
                      type="text"
                      placeholder="Item Name (e.g. Rice)"
                      value={item.name}
                      onChange={(e) =>
                        handleItemChange(index, "name", e.target.value)
                      }
                      required
                      className={`${inputClass} sm:w-2/5 !bg-white`}
                    />

                    <div className="flex gap-2 sm:gap-3 sm:flex-1">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        required
                        className={`${inputClass} flex-1 !bg-white`}
                      />
                      <input
                        type="text"
                        placeholder="Unit (e.g. kg)"
                        value={item.unit}
                        onChange={(e) =>
                          handleItemChange(index, "unit", e.target.value)
                        }
                        className={`${inputClass} flex-1 !bg-white`}
                      />

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="w-10 sm:w-12 shrink-0 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition font-bold"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addItem}
                className="mt-3 text-green-600 font-semibold text-xs sm:text-sm hover:underline flex items-center gap-1"
              >
                <span>+</span> Add Another Item
              </button>
            </div>

            {/* Expiry */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Expiry Time
              </label>
              <input
                type="datetime-local"
                value={expiryTime || getCurrentDateTime()}
                onChange={(e) => setExpiryTime(e.target.value)}
                min={getMinDateTime()}
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm shadow-lg transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Create Donation"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default Donate;
