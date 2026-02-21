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

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent focus:bg-white transition placeholder-gray-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center sm:px-4 sm:py-10">

      {/* ── Card ── */}
      <div className="w-full max-w-md sm:max-w-lg bg-white sm:rounded-3xl shadow-xl overflow-hidden min-h-screen sm:min-h-0 flex flex-col justify-center">

        {/* Accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-green-700 via-emerald-400 to-green-500 shrink-0" />

        {/* Header */}
        <div className="flex flex-col items-center px-6 sm:px-8 pt-8 pb-4 shrink-0">
          <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl shadow-lg text-2xl mb-4 select-none">
            🍱
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight text-center">Welcome Back!</h1>
          <p className="text-sm text-gray-400 mt-1 text-center">Login to continue ending food waste</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="px-6 sm:px-8 pb-8 flex-1 flex flex-col justify-center">

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                className={inputClass}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className={`${inputClass} pr-10`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOpen /> : <EyeClosed />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-green-600 text-xs sm:text-sm font-semibold hover:underline focus:outline-none"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </button>
            </div>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm shadow-lg transition"
            >
              🚀 Login to Dashboard
            </button>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6 shrink-0">
            Don't have an account?{" "}
            <a href="/register" className="text-green-600 font-bold hover:underline">
              Create one
            </a>
          </p>

        </form>
      </div>

    </div>
  );
}

export default Login;
