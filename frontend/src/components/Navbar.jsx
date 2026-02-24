import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const name = localStorage.getItem("name");

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await API.get("/auth/me");
          setUserProfile(res.data);
          // Sync name to localStorage if it was missing or outdated
          if (res.data.name && res.data.name !== name) {
            localStorage.setItem("name", res.data.name);
          }
        } catch (err) {
          console.error("Failed to load user profile in Navbar");
        }
      }
    };
    fetchUser();
  }, [token]);

  // Close menus when route changes
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const NavLink = ({ to, children }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`relative px-4 py-2 font-bold tracking-wide transition-all duration-300 rounded-lg
          ${isActive ? "text-green-700 bg-green-50/50" : "text-gray-600 hover:text-green-600 hover:bg-green-50/30"}
          group`}
      >
        {children}
        <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-green-500 rounded-full transition-transform duration-300 origin-left 
          ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
        />
      </Link>
    );
  };

  const MobileNavLink = ({ to, children, onClick }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={onClick}
        className={`block px-4 py-2 rounded-lg text-base font-medium transition-all duration-200
          ${isActive ? "bg-green-50 text-green-600" : "text-gray-700 hover:text-green-600 hover:bg-gray-50"}`}
      >
        {children}
      </Link>
    );
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 
        ${scrolled ? "bg-white/80 backdrop-blur-lg shadow-lg py-3 border-b border-white/20" : "bg-white/95 backdrop-blur-sm py-4 border-b border-gray-100"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-x-6 flex justify-between items-center">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50 transition-all duration-300 group-hover:scale-105">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-500 tracking-tight">
              FoodConnect
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-8">

            <NavLink to="/">Home</NavLink>

            {!token && (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                <Link to="/login" className="px-4 py-2 font-medium text-gray-700 hover:text-green-600 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="px-5 py-2.5 font-bold text-white bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 rounded-full shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] hover:shadow-[0_12px_25px_-8px_rgba(16,185,129,0.6)] transition-all duration-300 transform hover:-translate-y-0.5">
                  Register
                </Link>
              </div>
            )}

            {token && (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>

                {role === "donor" && (
                  <NavLink to="/donate">Donate</NavLink>
                )}

                {role === "organization" && (
                  <NavLink to="/request">Request</NavLink>
                )}

                <NavLink to="/my-activity">My Activity</NavLink>

                {/* Profile Dropdown */}
                <div className="relative ml-4 pl-4 border-l border-gray-200">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-inner overflow-hidden shrink-0">
                      {userProfile?.profileImage ? (
                        <img src={userProfile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-full h-full text-white/90 mt-1.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium text-gray-700 hidden lg:block">{userProfile?.name || name || "Profile"}</span>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
                      <div className="absolute right-0 mt-4 w-72 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl ring-1 ring-black/5 py-2 z-50 transform transition-all duration-300 origin-top-right animate-fade-in">
                        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-br from-green-50/50 to-emerald-50/30 rounded-t-2xl">
                          <p className="font-bold text-gray-900 truncate text-lg">{userProfile?.name || name}</p>
                          <p className="text-xs font-bold text-green-600 uppercase tracking-widest mt-1">{role}</p>
                        </div>

                        <div className="p-2">
                          <Link
                            to="/account"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 rounded-xl hover:bg-green-50 hover:text-green-700 hover:shadow-sm transition-all"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            My Account
                          </Link>
                        </div>

                        <div className="p-2 border-t border-gray-100">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 rounded-xl hover:bg-red-50 hover:shadow-sm transition-all text-red-600 group"
                          >
                            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile Hamburger Dropdown Button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 relative flex flex-col justify-between">
              <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2.5' : ''}`} />
              <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div
          className={`md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-2xl overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="px-4 py-4 space-y-1">

            <MobileNavLink to="/" onClick={() => setMenuOpen(false)}>Home</MobileNavLink>

            {!token && (
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-center px-4 py-2.5 font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="text-center px-4 py-2.5 font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-md shadow-green-600/20"
                >
                  Register
                </Link>
              </div>
            )}

            {token && (
              <>
                <MobileNavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</MobileNavLink>

                {role === "donor" && (
                  <MobileNavLink to="/donate" onClick={() => setMenuOpen(false)}>Donate</MobileNavLink>
                )}

                {role === "organization" && (
                  <MobileNavLink to="/request" onClick={() => setMenuOpen(false)}>Request</MobileNavLink>
                )}

                <MobileNavLink to="/my-activity" onClick={() => setMenuOpen(false)}>My Activity</MobileNavLink>

                <div className="pt-2 mt-1 border-t border-gray-100">
                  <Link
                    to="/account"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-inner overflow-hidden shrink-0">
                        {userProfile?.profileImage ? (
                          <img src={userProfile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-full h-full text-white/90 mt-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{userProfile?.name || name}</p>
                        <p className="text-xs font-bold text-green-600 uppercase tracking-wider">{role}</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full text-left px-4 py-2 mt-1 text-base font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors group"
                  >
                    <svg className="w-5 h-5 text-red-500 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
      {/* Spacer to prevent content from going under the fixed navbar */}
      <div className="h-20 sm:h-24"></div>
    </>
  );
}

export default Navbar;
