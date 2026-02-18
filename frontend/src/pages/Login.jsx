import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../services/api";
import { EyeOpen, EyeClosed } from "../components/EyeIcons";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      toast.success("Login successful!");
      navigate("/dashboard");

    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Login to FoodConnect
        </h2>

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOpen /> : <EyeClosed />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="text-blue-600 text-sm hover:underline focus:outline-none"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Login
          </button>

        </form>
      </div>

    </div>
  );
}

export default Login;
