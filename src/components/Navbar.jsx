import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSearch } from "../context/SearchContext";
import { useState, useEffect } from "react";
import LogoutConfirmationModal from "./LogoutConfirmationModal";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { searchQuery, setSearchQuery } = useSearch();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // This useEffect watches for changes in the search query
  // and redirects to the home page if the user is on another page.
  useEffect(() => {
    // Check if the user is not on the home page and a search query is being entered
    if (searchQuery.trim() && location.pathname !== '/') {
      navigate('/');
    }
  }, [searchQuery, location.pathname, navigate]);

  const handleLogout = async () => {
    await signOut();
    setShowLogoutModal(false);
  };

  return (
    <nav className="bg-white shadow-md p-4 mb-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-pink-700">
          Family Memories Hub ❤️
        </Link>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
          />
          <Link
            to="/profile"
            className="text-gray-700 hover:text-pink-600 transition-colors duration-200 font-semibold"
          >
            My Profile
          </Link>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-pink-700 transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </div>
      {showLogoutModal && (
        <LogoutConfirmationModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </nav>
  );
}