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

              <Link to="/history" className="hover:text-gray-200">
                History
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
                  <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded-md shadow-lg">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setProfileOpen(false)}
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
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

              <Link to="/history" onClick={() => setMenuOpen(false)} className="block">History</Link>

              <button
                onClick={handleLogout}
                className="block text-left w-full"
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
