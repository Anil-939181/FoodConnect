import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/auth/forgot-password", { email });
      toast.success("OTP sent to your email. Please check your inbox.");
      navigate("/reset-password", { state: { email } });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent focus:bg-white transition placeholder-gray-400";

  return (
    <div className="min-h-[calc(100vh-80px)] sm:min-h-[calc(100vh-96px)] bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4 sm:p-10">

      {/* ── Card ── */}
      <div className="w-full max-w-md sm:max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col justify-center">

        {/* Accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-green-700 via-emerald-400 to-green-500 shrink-0" />

        {/* Header */}
        <div className="flex flex-col items-center px-6 sm:px-8 pt-8 pb-4 shrink-0">
          <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl shadow-lg mb-4 text-white">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4v-3.286l7.743-7.743A6 6 0 0115 7h.01M15 7a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight text-center">Forgot Password</h1>
          <p className="text-sm text-gray-400 mt-1 text-center">Enter your email to receive a reset code</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 sm:px-8 pb-8 flex-1 flex flex-col justify-center">

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
          </div>

          <div className="mt-8">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm shadow-lg transition disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6 shrink-0">
            Remembered your password?{" "}
            <a href="/login" className="text-green-600 font-bold hover:underline">
              Back to Login
            </a>
          </p>

        </form>
      </div>

    </div>
  );
}

export default ForgotPassword;
