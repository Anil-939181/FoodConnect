import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const name = localStorage.getItem("name");

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav className="bg-green-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">

        {/* Logo */}
        <Link to="/" className="text-xl font-bold">
          FoodConnect
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">

          {!token && (
            <>
              <Link to="/" className="hover:text-gray-200">Home</Link>
              <Link to="/login" className="hover:text-gray-200">Login</Link>
              <Link to="/register" className="hover:text-gray-200">Register</Link>
            </>
          )}

          {token && (
            <>
              <Link to="/dashboard" className="hover:text-gray-200">
                Dashboard
              </Link>

              {role === "donor" && (
                <Link to="/donate" className="hover:text-gray-200">
                  Donate
                </Link>
              )}

              {role === "organization" && (
                <Link to="/request" className="hover:text-gray-200">
                  Request
                </Link>
              )}

              <Link to="/my-activity" className="hover:text-gray-200">
                My Activity
              </Link>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="bg-white text-green-600 px-3 py-1 rounded-md"
                >
                  {name || "Profile"}
                </button>

                {profileOpen && (
  <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg p-4">
    
    <p className="font-semibold">{name}</p>
    <p className="text-sm text-gray-600 capitalize">{role}</p>

    <Link
      to="/account"
      className="mt-3 block w-full bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 text-center"
      onClick={() => setProfileOpen(false)}
    >
      My Account
    </Link>
    <button
      onClick={handleLogout}
      className="mt-3 w-full bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
    >
      Logout
    </button>
  </div>
)}

              </div>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-green-700 px-4 pb-4 space-y-3">

          {!token && (
            <>
              <Link to="/" onClick={() => setMenuOpen(false)} className="block">Home</Link>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block">Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block">Register</Link>
            </>
          )}

          {token && (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block">Dashboard</Link>

              {role === "donor" && (
                <Link to="/donate" onClick={() => setMenuOpen(false)} className="block">Donate</Link>
              )}

              {role === "organization" && (
                <Link to="/request" onClick={() => setMenuOpen(false)} className="block">Request</Link>
              )}

              <Link to="/my-activity" onClick={() => setMenuOpen(false)} className="block">My Activity</Link>
              <Link to="/account" onClick={() => setMenuOpen(false)} className="block">My Account</Link>
              <button
                onClick={handleLogout}
                className="block text-left w/full"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
