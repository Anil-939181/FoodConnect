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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Search for Food Donations
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

          {/* Requested Items */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-3">
              Requested Items
            </label>

            {requestedItems.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3"
              >
                <input
                  type="text"
                  placeholder="Item Name"
                  value={item.name}
                  onChange={(e) =>
                    handleItemChange(index, "name", e.target.value)
                  }
                  
                  className="border rounded-lg p-2"
                />

                <input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(index, "quantity", e.target.value)
                  }
                  
                  className="border rounded-lg p-2"
                />

                {requestedItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="bg-red-500 text-white px-3 rounded-lg"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="text-blue-600 font-medium hover:underline"
            >
              + Add Another Item
            </button>
          </div>

          {/* Required Before */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Required Before
            </label>
            <input
              type="datetime-local"
              value={requiredBefore || getCurrentDateTime()}
              onChange={(e) => setRequiredBefore(e.target.value)}
              min={getMinDateTime()}
              required
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Search Donations
          </button>

        </form>
      </div>
    </div>
  );
}

export default Request;
