import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav className="bg-green-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">FoodConnect</Link>

        <div className="space-x-6">
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

          <button
            onClick={handleLogout}
            className="bg-white text-green-600 px-3 py-1 rounded-md hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
