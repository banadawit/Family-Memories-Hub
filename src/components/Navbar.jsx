// src/components/Navbar.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import LogoutConfirmationModal from "./LogoutConfirmationModal"; // Import the new modal

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setShowLogoutModal(false); // Close the modal after logging out
  };

  return (
    <nav className="bg-white shadow-md p-4 mb-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-pink-700">
          Family Memories Hub ❤️
        </Link>
        <div className="flex items-center space-x-4">
          <Link
            to="/profile"
            className="text-gray-700 hover:text-pink-600 transition-colors duration-200 font-semibold"
          >
            My Profile
          </Link>
          <button
            onClick={() => setShowLogoutModal(true)} // This now opens the modal
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