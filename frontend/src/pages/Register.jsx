import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../services/api";
import { decimalToDMS, dmsToDecimal } from "../utils/coordinates";

function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("donor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState([]);
  const [tempLat, setTempLat] = useState("");
  const [tempLon, setTempLon] = useState("");
  // DMS format states
  const [latDegrees, setLatDegrees] = useState("");
  const [latMinutes, setLatMinutes] = useState("");
  const [latSeconds, setLatSeconds] = useState("");
  const [lonDegrees, setLonDegrees] = useState("");
  const [lonMinutes, setLonMinutes] = useState("");
  const [lonSeconds, setLonSeconds] = useState("");
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const handleGetCurrentLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toString();
        const lon = position.coords.longitude.toString();
        
        setLatitude(lat);
        setLongitude(lon);

        // Convert to DMS
        const latDMS = decimalToDMS(parseFloat(lat));
        const lonDMS = decimalToDMS(parseFloat(lon));

        setLatDegrees(latDMS.degrees.toString());
        setLatMinutes(latDMS.minutes.toString());
        setLatSeconds(latDMS.seconds.toString());
        setLonDegrees(lonDMS.degrees.toString());
        setLonMinutes(lonDMS.minutes.toString());
        setLonSeconds(lonDMS.seconds.toString());

        toast.success("Location captured");
        setLocationLoading(false);
      },
      () => {
        toast.error("Unable to get your location. Please enter manually.");
        setLocationLoading(false);
      }
    );
  };

  // Handle DMS to Decimal conversion
  const handleDMSChange = () => {
    if (latDegrees && latMinutes && latSeconds && lonDegrees && lonMinutes && lonSeconds) {
      const lat = dmsToDecimal(
        parseInt(latDegrees),
        parseInt(latMinutes),
        parseFloat(latSeconds)
      );
      const lon = dmsToDecimal(
        parseInt(lonDegrees),
        parseInt(lonMinutes),
        parseFloat(lonSeconds)
      );

      setLatitude(lat.toFixed(6));
      setLongitude(lon.toFixed(6));
    }
  };

  // Handle Decimal to DMS conversion
  const handleDecimalChange = () => {
    if (latitude && longitude) {
      const latDMS = decimalToDMS(parseFloat(latitude));
      const lonDMS = decimalToDMS(parseFloat(longitude));

      setLatDegrees(latDMS.degrees.toString());
      setLatMinutes(latDMS.minutes.toString());
      setLatSeconds(latDMS.seconds.toFixed(2));
      setLonDegrees(lonDMS.degrees.toString());
      setLonMinutes(lonDMS.minutes.toString());
      setLonSeconds(lonDMS.seconds.toFixed(2));
    }
  };

  // Initialize map
  useEffect(() => {
    if (!showMapPicker || !mapRef.current) return;

    // Check if already initialized
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!window.L) {
        toast.error("Map library not loaded. Please refresh the page.");
        return;
      }

      try {
        const L = window.L;
        
        // Initialize map centered on India
        const map = L.map(mapRef.current, {
          attributionControl: true,
          scrollWheelZoom: false // disable by default to allow page scroll
        }).setView([20.5937, 78.9629], 5);
        
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          minZoom: 2,
          attribution: "© OpenStreetMap contributors"
        }).addTo(map);

        // require ctrl key to zoom
        const container = map.getContainer();
        container.addEventListener("wheel", (ev) => {
          ev.preventDefault();
          if (ev.ctrlKey) {
            map.scrollWheelZoom.enable();
          } else {
            map.scrollWheelZoom.disable();
            // pan map vertically with wheel
            const factor = 0.5; // adjust sensitivity
            map.panBy([0, ev.deltaY * factor], { animate: false });
          }
        });

        mapInstanceRef.current = map;

        // Add click handler to map
        map.on("click", (e) => {
          const { lat, lng } = e.latlng;
          setTempLat(lat.toString());
          setTempLon(lng.toString());

          // Remove old marker
          if (markerRef.current) {
            map.removeLayer(markerRef.current);
          }

          // Add new marker
          markerRef.current = L.marker([lat, lng]).addTo(map).bindPopup(
            `<div class="text-sm"><b>Selected Location</b><br/>Lat: ${lat.toFixed(4)}<br/>Lon: ${lng.toFixed(4)}</div>`
          ).openPopup();

          toast.success("Location selected. Click confirm to save.");
        });

        // Force map to recalculate size
        setTimeout(() => {
          map.invalidateSize();
        }, 100);

      } catch (error) {
        console.error("Map initialization error:", error);
        toast.error("Error initializing map. Please try again.");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [showMapPicker]);

  const handleMapSearchZoom = async () => {
    if (!mapSearchQuery.trim()) {
      toast.error("Please enter a location to search");
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(mapSearchQuery)}&format=json&limit=5`
      );
      const results = await response.json();
      
      if (results.length === 0) {
        toast.error("No locations found. Try a different search.");
        setMapSearchResults([]);
      } else {
        setMapSearchResults(results);

        // Zoom to first result
        if (mapInstanceRef.current && results[0]) {
          const lat = parseFloat(results[0].lat);
          const lon = parseFloat(results[0].lon);
          
          mapInstanceRef.current.setView([lat, lon], 13);
          
          // Remove old marker
          if (markerRef.current) {
            mapInstanceRef.current.removeLayer(markerRef.current);
          }

          // Add marker at search result
          const L = window.L;
          markerRef.current = L.marker([lat, lon])
            .addTo(mapInstanceRef.current)
            .bindPopup(
              `<div class="text-sm"><b>${results[0].name}</b><br/>Lat: ${lat.toFixed(4)}<br/>Lon: ${lon.toFixed(4)}</div>`
            )
            .openPopup();
          
          // Set temp values
          setTempLat(lat.toString());
          setTempLon(lon.toString());
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Error searching location. Please try again.");
    }
  };

  const handleConfirmMapLocation = () => {
    if (!tempLat || !tempLon) {
      toast.error("Please select a location on the map");
      return;
    }

    setLatitude(tempLat);
    setLongitude(tempLon);

    // Convert to DMS
    const latDMS = decimalToDMS(parseFloat(tempLat));
    const lonDMS = decimalToDMS(parseFloat(tempLon));

    setLatDegrees(latDMS.degrees.toString());
    setLatMinutes(latDMS.minutes.toString());
    setLatSeconds(latDMS.seconds.toFixed(2));
    setLonDegrees(lonDMS.degrees.toString());
    setLonMinutes(lonDMS.minutes.toString());
    setLonSeconds(lonDMS.seconds.toFixed(2));
    
    // Clean up map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if (markerRef.current) {
      markerRef.current = null;
    }
    
    setShowMapPicker(false);
    setMapSearchResults([]);
    setMapSearchQuery("");
    setTempLat("");
    setTempLon("");
    toast.success("Location confirmed");
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!latitude || !longitude) {
      toast.error("Please select your location using the map picker");
      return;
    }

    try {
      await API.post("/auth/register", {
        name,
        email,
        password,
        role,
        state,
        district,
        pincode,
        city,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        // Include DMS format for more accuracy
        latDegrees: latDegrees ? parseInt(latDegrees) : null,
        latMinutes: latMinutes ? parseInt(latMinutes) : null,
        latSeconds: latSeconds ? parseFloat(latSeconds) : null,
        lonDegrees: lonDegrees ? parseInt(lonDegrees) : null,
        lonMinutes: lonMinutes ? parseInt(lonMinutes) : null,
        lonSeconds: lonSeconds ? parseFloat(lonSeconds) : null
      });

      toast.success("Registration successful! Please login.");
      navigate("/login");

    } catch (error) {
      const errorMessage = error.response?.data?.message || "Registration failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Create Account
        </h2>

        <form onSubmit={handleRegister} className="space-y-4">

          {/* Role Selection */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Register As
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="donor">Donor</option>
              <option value="organization">Organization</option>
            </select>
          </div>

          {/* Dynamic Name Label */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {role === "organization"
                ? "Organization Name"
                : "Full Name"}
            </label>
            <input
              type="text"
              required
              className="w-full border rounded-lg p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <input
            type="email"
            placeholder="Email"
            required
            className="w-full border rounded-lg p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            required
            className="w-full border rounded-lg p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Address Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <input
              type="text"
              placeholder="State"
              required
              className="border rounded-lg p-2"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />

            <input
              type="text"
              placeholder="District"
              required
              className="border rounded-lg p-2"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />

          </div>
          <input
            type="text"
            placeholder="City / Village"
            required
            className="border rounded-lg p-2 md:col-span-2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            type="text"
            placeholder="Pincode"
            required
            className="w-full border rounded-lg p-2"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
          />

          {/* Location Section */}
          <div className="border-t-2 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Location (Required)</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className="px-3 py-1 rounded text-xs font-semibold bg-purple-600 text-white"
                >
                  🗺️ Pick from Map
                </button>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-xs text-gray-500">Select your location from the map.</p>
            </div>

            {/* Location Confirmation */}
            {latitude && longitude && (
              <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-700 font-semibold">
                  ✓ Decimal: {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                </p>
                {latDegrees && latMinutes && latSeconds && lonDegrees && lonMinutes && lonSeconds && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ DMS: {latDegrees}° {latMinutes}' {latSeconds}", {lonDegrees}° {lonMinutes}' {lonSeconds}"
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Register
          </button>

        </form>
      </div>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Select Your Location</h3>
              <button
                onClick={() => {
                  // Clean up map
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.remove();
                    mapInstanceRef.current = null;
                  }
                  if (markerRef.current) {
                    markerRef.current = null;
                  }
                  
                  setShowMapPicker(false);
                  setMapSearchResults([]);
                  setMapSearchQuery("");
                  setTempLat("");
                  setTempLon("");
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Search Bar */}
            <div className="border-b p-4 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search location (e.g., 'Delhi', 'Times Square', 'Mumbai')"
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleMapSearchZoom()}
                  className="flex-1 border rounded-lg p-2"
                  autoFocus
                />
                <button
                  onClick={handleMapSearchZoom}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold whitespace-nowrap"
                >
                  Search
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Click on the map to select, or search and click results below
              </p>
            </div>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Map Container - takes 2/3 of space */}
              <div className="flex-1 bg-gray-100 relative min-h-[350px]">
                <div
                  ref={mapRef}
                  style={{ width: "100%", height: "100%", minHeight: "350px" }}
                  className="z-0"
                />
              </div>

              {/* Search Results Section - takes 1/3 of space */}
              {mapSearchResults.length > 0 && (
                <div className="border-t p-4 bg-gray-50 max-h-[200px] overflow-y-auto">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Click a result or search on map:
                  </p>
                  <div className="space-y-2">
                    {mapSearchResults.map((result, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          const lat = parseFloat(result.lat);
                          const lon = parseFloat(result.lon);
                          setTempLat(lat.toString());
                          setTempLon(lon.toString());
                          
                          // Zoom map to result
                          if (mapInstanceRef.current) {
                            mapInstanceRef.current.setView([lat, lon], 13);
                            
                            // Remove old marker
                            if (markerRef.current) {
                              mapInstanceRef.current.removeLayer(markerRef.current);
                            }
                            
                            // Add marker
                            markerRef.current = window.L.marker([lat, lon])
                              .addTo(mapInstanceRef.current)
                              .bindPopup(
                                `<div class="text-sm"><b>${result.name}</b><br/>Lat: ${lat.toFixed(4)}<br/>Lon: ${lon.toFixed(4)}</div>`
                              )
                              .openPopup();
                          }
                        }}
                        className="p-2 bg-white border rounded-lg hover:bg-blue-50 cursor-pointer transition text-sm"
                      >
                        <p className="font-semibold text-gray-800">{result.name}</p>
                        <p className="text-xs text-gray-600">
                          📍 {parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-4 bg-gray-50 flex gap-2 items-center justify-between">
              <div className="text-sm">
                {tempLat && tempLon ? (
                  <span className="text-green-600 font-semibold">
                    ✓ Location selected: {parseFloat(tempLat).toFixed(4)}, {parseFloat(tempLon).toFixed(4)}
                  </span>
                ) : (
                  <span className="text-gray-500">
                    Click on map or select from search results
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmMapLocation}
                  disabled={!tempLat || !tempLon}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Confirm Location
                </button>
                <button
                  onClick={() => {
                    // Clean up map
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.remove();
                      mapInstanceRef.current = null;
                    }
                    if (markerRef.current) {
                      markerRef.current = null;
                    }
                    
                    setShowMapPicker(false);
                    setMapSearchResults([]);
                    setMapSearchQuery("");
                    setTempLat("");
                    setTempLon("");
                  }}
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;
