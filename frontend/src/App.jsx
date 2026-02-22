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
import EditDonation from "./pages/EditDonation";
import Account from "./pages/Account";
import Navbar from "./components/Navbar";
import Loading from "./components/Loading";
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
      {/* Your Routes Here */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/dashboard"
          element={
            <div className="max-w-7xl mx-auto p-6 pt-24">
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </div>
          }
        />

        <Route
          path="/donate"
          element={
            <div className="max-w-7xl mx-auto p-6 pt-24">
              <ProtectedRoute>
                <Donate />
              </ProtectedRoute>
            </div>
          }
        />

        <Route
          path="/request"
          element={
            <div className="max-w-7xl mx-auto p-6 pt-24">
              <ProtectedRoute>
                <Request />
              </ProtectedRoute>
            </div>
          }
        />

        <Route
          path="/my-activity"
          element={
            <div className="max-w-7xl mx-auto p-6 pt-24">
              <ProtectedRoute>
                <MyActivity />
              </ProtectedRoute>
            </div>
          }
        />
        <Route
          path="/account"
          element={
            <div className="max-w-7xl mx-auto p-6 pt-24">
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            </div>
          }
        />
        <Route
          path="/donations/:id/edit"
          element={
            <div className="max-w-7xl mx-auto p-6 pt-24">
              <ProtectedRoute>
                <EditDonation />
              </ProtectedRoute>
            </div>
          }
        />
        <Route path="/matches" element={
          <div className="max-w-7xl mx-auto p-6 pt-24">
            <ProtectedRoute>
              <Matches />
            </ProtectedRoute>
          </div>
        } />
      </Routes>
    </div>

  );
}

export default App;
