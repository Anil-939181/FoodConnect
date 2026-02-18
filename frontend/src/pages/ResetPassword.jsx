import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../services/api";
import { EyeOpen, EyeClosed } from "../components/EyeIcons";

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const email = location.state?.email || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || !password || !confirmPassword) {
      toast.error("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    // Password strength validation (min 8 chars, 1 uppercase, 1 number)
    const strong = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strong.test(password)) {
      toast.error("Password must be at least 8 characters, include an uppercase letter and a number.");
      return;
    }
    setLoading(true);
    try {
      await API.post("/auth/reset-password", { email, otp, password });
      toast.success("Password reset successful! Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Reset Password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-600 mb-1">OTP</label>
            <input
              type="text"
              required
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">New Password</label>
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
          <div>
            <label className="block text-sm text-gray-600 mb-1">Confirm Password</label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 pr-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
              tabIndex={-1}
              onClick={() => setShowConfirmPassword((v) => !v)}
            >
              {showConfirmPassword ? <EyeOpen /> : <EyeClosed />}
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
