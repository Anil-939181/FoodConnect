import { Link } from "react-router-dom";

function Home() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  return (
    <div>

      {/* HERO SECTION */}
      <section className="bg-green-600 text-white py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Reduce Food Waste. Feed More Lives.
        </h1>

        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          FoodConnect bridges the gap between donors and organizations,
          ensuring surplus food reaches those who need it most.
        </p>

        {!token ? (
          <div className="space-x-4">
            <Link
              to="/register"
              className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
            >
              Get Started
            </Link>

            <Link
              to="/login"
              className="border border-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Login
            </Link>
          </div>
        ) : (
          <div className="space-x-4">
            {role === "user" && (
              <Link
                to="/donate"
                className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
              >
                Donate Food
              </Link>
            )}

            {role === "organization" && (
              <Link
                to="/request"
                className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
              >
                Request Food
              </Link>
            )}

            <Link
              to="/dashboard"
              className="border border-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-6xl mx-auto px-6 text-center">

          <h2 className="text-3xl font-bold mb-12 text-gray-800">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            <div className="bg-white shadow-md rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3 text-green-600">
                1. Donate or Request
              </h3>
              <p className="text-gray-600">
                Donors list surplus food items. Organizations create food requests.
              </p>
            </div>

            <div className="bg-white shadow-md rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3 text-blue-600">
                2. Smart Matching
              </h3>
              <p className="text-gray-600">
                Our system matches nearby donations based on distance,
                meal type, and quantity.
              </p>
            </div>

            <div className="bg-white shadow-md rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3 text-purple-600">
                3. Reserve & Complete
              </h3>
              <p className="text-gray-600">
                Approve, reserve, and complete transactions seamlessly.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-800 text-white py-6 text-center">
        <p>© 2026 FoodConnect. All rights reserved.</p>
      </footer>

    </div>
  );
}

export default Home;
