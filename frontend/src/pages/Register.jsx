import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Register() {
  const [role, setRole] = useState("donor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await API.post("/auth/register", {
        name,
        email,
        password,
        role,
        state,
        district,
        pincode,
        city
      });

      navigate("/login");

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Create Account
        </h2>

        <form onSubmit={handleRegister} className="space-y-4">

          {/* Role Selection */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Register As
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="donor">Donor</option>
              <option value="organization">Organization</option>
            </select>
          </div>

          {/* Dynamic Name Label */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {role === "organization"
                ? "Organization Name"
                : "Full Name"}
            </label>
            <input
              type="text"
              required
              className="w-full border rounded-lg p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <input
            type="email"
            placeholder="Email"
            required
            className="w-full border rounded-lg p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            required
            className="w-full border rounded-lg p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Address Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <input
              type="text"
              placeholder="State"
              required
              className="border rounded-lg p-2"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />

            <input
              type="text"
              placeholder="District"
              required
              className="border rounded-lg p-2"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />

          </div>
          <input
            type="text"
            placeholder="City / Village"
            required
            className="border rounded-lg p-2 md:col-span-2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            type="text"
            placeholder="Pincode"
            required
            className="w-full border rounded-lg p-2"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
          />

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Register
          </button>

        </form>
      </div>

    </div>
  );
}

export default Register;
