import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import MessageModal from "../components/MessageModal"; // Import MessageModal

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // State to dynamically track the current theme from the document element
  const [isCurrentThemeDark, setIsCurrentThemeDark] = useState(false);
  // State for custom message modal
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState({ text: '', type: '' });

  // Effect to listen for changes in the 'dark' class on the document element
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsCurrentThemeDark(isDark);
      console.log("UpdatePassword: Detected theme change to dark mode?", isDark); // Debugging log
    });

    // Observe changes to the 'class' attribute of the <html> element
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Set initial state based on current class when component mounts
    setIsCurrentThemeDark(document.documentElement.classList.contains('dark'));

    // Cleanup the observer when the component unmounts
    return () => observer.disconnect();
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  const showCustomMessage = (text, type) => {
    setMessageContent({ text, type });
    setShowMessageModal(true);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      
      if (updateError) {
        throw updateError;
      }

      showCustomMessage("Your password has been updated successfully!", "success");
      // Give a short delay for the message to be seen before navigating
      setTimeout(() => {
        navigate("/"); // Redirect to home page
      }, 1500); 
    } catch (err) {
      setError(err.message);
      showCustomMessage(`Error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 font-inter transition-colors duration-200
                   ${isCurrentThemeDark ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-pink-50 to-white'}`}>
      <div className={`w-full max-w-md p-6 md:p-8 rounded-lg shadow-xl space-y-6 text-center
                     ${isCurrentThemeDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-3xl font-bold ${isCurrentThemeDark ? 'text-pink-400' : 'text-pink-700'}`}>
          Update Your Password
        </h2>
        <p className={`text-lg ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Enter a new password for your account.
        </p>

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label htmlFor="new-password" className={`block text-sm font-medium mb-1 ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-700'}`}>
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent ${isCurrentThemeDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-pink-500' : 'bg-white border-gray-300 focus:ring-pink-500'}`}
              required
              disabled={loading}
              aria-label="Enter new password"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className={`block text-sm font-medium mb-1 ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent ${isCurrentThemeDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-pink-500' : 'bg-white border-gray-300 focus:ring-pink-500'}`}
              required
              disabled={loading}
              aria-label="Confirm new password"
            />
          </div>
          {error && (
            <p className={`text-sm p-2 rounded-md ${isCurrentThemeDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'}`} role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className={`w-full p-3 rounded-lg shadow-md font-semibold text-white transition-colors duration-200
                       ${loading ? 'bg-pink-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'}`}
            disabled={loading}
            aria-label="Update your password"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : "Update Password"}
          </button>
        </form>
      </div>
      {showMessageModal && (
        <MessageModal
          message={messageContent.text}
          type={messageContent.type}
          onClose={() => setShowMessageModal(false)}
          darkMode={isCurrentThemeDark}
        />
      )}
    </div>
  );
}
