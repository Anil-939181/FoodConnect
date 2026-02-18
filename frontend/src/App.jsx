import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Donate from "./pages/Donate";
import Request from "./pages/Request";
import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Matches from "./pages/Matches";
import MyActivity from "./pages/MyActivity";
import Navbar from "./components/Navbar";
import Loading from "./components/Loading";
import Account from "./pages/Account";
function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Loading />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        {/* Your Routes Here */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/donate"
          element={
            <ProtectedRoute>
              <Donate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/request"
          element={
            <ProtectedRoute>
              <Request />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-activity"
          element={
            <ProtectedRoute>
              <MyActivity />
            </ProtectedRoute>
          }
        />
        <Route path="/matches" element={<ProtectedRoute>
              <Matches />
            </ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute>
              <Account />
            </ProtectedRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/" element={<ResetPassword />} />
      </Routes>
      </div>
    </div>
   
  );
}

export default App;
