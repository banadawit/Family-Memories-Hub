import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import MessageModal from "../components/MessageModal"; // Import MessageModal

export default function SetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

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
      console.log("SetPassword: Detected theme change to dark mode?", isDark); // Debugging log
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

  useEffect(() => {
    // Check if the user already has a password set.
    if (user && user.identities) { // Ensure identities exist before checking
      const hasPasswordProvider = user.identities.some(
        (identity) =>
          identity.provider === "email" && identity.identity_data?.password_set
      );
      if (hasPasswordProvider) {
        navigate("/");
      }
    }
  }, [user, navigate]);

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
      const { error: updateError } = await supabase.auth.updateUser({ // Renamed error to updateError
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      showCustomMessage("Password set successfully! You can now log in with your new password.", "success");
      // Give a short delay for the message to be seen before navigating
      setTimeout(() => {
        navigate("/");
      }, 1500); 
    } catch (err) {
      setError(err.message);
      showCustomMessage(`Error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isCurrentThemeDark ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-pink-50 to-white'}`}>
      <Navbar />
      <div className="container mx-auto p-4 md:p-6 font-inter">
        {/* Debugging Theme Indicator */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Current Theme: <span className="font-semibold">{isCurrentThemeDark ? "Dark" : "Light"}</span>
        </p>

        <div className={`max-w-md mx-auto p-6 md:p-8 rounded-lg shadow-xl text-center
                       ${isCurrentThemeDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${isCurrentThemeDark ? 'text-pink-400' : 'text-pink-700'}`}>
            Set Your Password
          </h2>
          <p className={`mb-6 ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-600'}`}>
            You've been invited to the family hub. Please set a password for
            future logins.
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
              aria-label="Set your password"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Setting...
                </span>
              ) : "Set Password"}
            </button>
          </form>
        </div>
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
