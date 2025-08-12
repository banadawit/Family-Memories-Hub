import React from "react";

export default function LogoutConfirmationModal({
  onConfirm,
  onCancel,
  darkMode,
}) {
  // Added darkMode prop
  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 font-inter p-4
                 ${
                   darkMode
                     ? "bg-black bg-opacity-70"
                     : "bg-black bg-opacity-40"
                 }`} // Dynamic background overlay
      onClick={onCancel} // Allow clicking outside to cancel
      role="dialog" // Added for accessibility
      aria-modal="true" // Added for accessibility
      aria-label="Confirm Logout" // Added for accessibility
    >
      <div
        className={`relative p-6 rounded-lg shadow-lg w-full max-w-sm space-y-4
                   ${darkMode ? "bg-gray-800" : "bg-white"}`} // Dynamic modal background
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <h3
          className={`text-xl font-semibold mb-2 ${
            darkMode ? "text-pink-400" : "text-pink-700"
          }`}
        >
          {" "}
          {/* Dynamic title color */}
          Confirm Logout
        </h3>
        <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          {" "}
          {/* Dynamic text color */}
          Are you sure you want to log out?
        </p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className={`px-4 py-2 border rounded-lg transition-colors duration-200
                       ${
                         darkMode
                           ? "border-gray-600 text-gray-200 hover:bg-gray-700"
                           : "border-gray-300 text-gray-700 hover:bg-gray-100"
                       }`} // Dynamic button style
            aria-label="Cancel logout" // Added for accessibility
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg shadow-md transition-colors duration-200
                       ${
                         darkMode
                           ? "bg-red-700 text-white hover:bg-red-800"
                           : "bg-red-600 text-white hover:bg-red-700"
                       }`} // Dynamic button style
            aria-label="Confirm logout" // Added for accessibility
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
