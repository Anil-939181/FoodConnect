import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Request() {
  const [requestedItems, setRequestedItems] = useState([
    { name: "", quantity: "" }
  ]);

  const [mealType, setMealType] = useState("other");
  const [requiredBefore, setRequiredBefore] = useState("");

  const navigate = useNavigate();

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getCurrentDateTime = () => {
    return getMinDateTime();
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...requestedItems];
    updated[index][field] = value;
    setRequestedItems(updated);
  };

  const addItem = () => {
    setRequestedItems([...requestedItems, { name: "", quantity: "" }]);
  };

  const removeItem = (index) => {
    const updated = requestedItems.filter((_, i) => i !== index);
    setRequestedItems(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanItems = requestedItems.filter(
      item => item.name.trim() !== ""
    );

    const searchData = {
      requestedItems: cleanItems,
      mealType,
      requiredBefore
    };

    toast.success("Searching for available donations...");

    // Navigate WITHOUT creating request
    navigate("/matches", { state: searchData });
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white transition placeholder-gray-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center sm:px-4 sm:py-10">
      {/* ── Card ── */}
      <div className="w-full max-w-2xl bg-white sm:rounded-3xl shadow-xl overflow-hidden min-h-screen sm:min-h-0 flex flex-col">
        {/* Accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-blue-700 via-cyan-400 to-blue-500 shrink-0" />

        {/* Header */}
        <div className="flex flex-col items-center px-6 sm:px-8 pt-8 pb-4 shrink-0">
          <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl shadow-lg text-2xl mb-4 select-none">
            🔍
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight text-center">Find Donations</h1>
          <p className="text-sm text-gray-400 mt-1 text-center">Search for available food near you</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 sm:px-8 pb-8 flex-1 flex flex-col">
          <div className="space-y-6">

            {/* Meal Type */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Meal Type <span className="text-gray-300 normal-case tracking-normal">(Optional)</span>
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

            {/* Requested Items */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Requested Items <span className="text-gray-300 normal-case tracking-normal">(Optional)</span>
              </label>

              <div className="space-y-3">
                {requestedItems.map((item, index) => (
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
                      className={`${inputClass} sm:w-2/3 !bg-white`}
                    />

                    <div className="flex gap-2 sm:gap-3 sm:flex-1">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        className={`${inputClass} flex-1 !bg-white`}
                      />

                      {requestedItems.length > 1 && (
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
                className="mt-3 text-blue-600 font-semibold text-xs sm:text-sm hover:underline flex items-center gap-1"
              >
                <span>+</span> Add Another Item
              </button>
            </div>

            {/* Required Before */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Required Before <span className="text-red-400 normal-case tracking-normal">*</span>
              </label>
              <input
                type="datetime-local"
                value={requiredBefore || getCurrentDateTime()}
                onChange={(e) => setRequiredBefore(e.target.value)}
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
              className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-xs sm:text-sm shadow-lg transition"
            >
              🚀 Search Donations
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default Request;
