import { useState, useEffect } from "react"; // Import useEffect for dark mode
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // State to dynamically track the current theme from the document element
  const [isCurrentThemeDark, setIsCurrentThemeDark] = useState(false);

  // Effect to listen for changes in the 'dark' class on the document element
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsCurrentThemeDark(isDark);
      console.log(
        "ForgotPassword: Detected theme change to dark mode?",
        isDark
      ); // Debugging log
    });

    // Observe changes to the 'class' attribute of the <html> element
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Set initial state based on current class when component mounts
    setIsCurrentThemeDark(document.documentElement.classList.contains("dark"));

    // Cleanup the observer when the component unmounts
    return () => observer.disconnect();
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Ensure this URL matches your actual deployed app's update-password route
        redirectTo: "https://fammoments.vercel.app/update-password",
      });

      if (error) {
        throw error;
      }

      setMessage(
        "A password reset link has been sent to your email address. Please check your inbox."
      );
      setEmail(""); // Clear email field on success
    } catch (err) {
      setMessage(`Error: ${err.message || "Failed to send reset link."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 font-inter transition-colors duration-200
                   ${
                     isCurrentThemeDark
                       ? "bg-gradient-to-b from-gray-900 to-gray-800"
                       : "bg-gradient-to-b from-pink-50 to-white"
                   }`}
    >
      <div
        className={`w-full max-w-md p-6 md:p-8 rounded-lg shadow-xl space-y-6 text-center
                     ${isCurrentThemeDark ? "bg-gray-800" : "bg-white"}`}
      >
        <h2
          className={`text-3xl font-bold ${
            isCurrentThemeDark ? "text-pink-400" : "text-pink-700"
          }`}
        >
          Forgot Password?
        </h2>
        <p
          className={`text-lg ${
            isCurrentThemeDark ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Enter your email to receive a password reset link.
        </p>

        <form onSubmit={handleResetRequest} className="space-y-4">
          <div>
            <label
              htmlFor="email-reset"
              className={`block text-sm font-medium mb-1 ${
                isCurrentThemeDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Email Address
            </label>
            <input
              id="email-reset"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                isCurrentThemeDark
                  ? "bg-gray-700 border-gray-600 text-white focus:ring-pink-500"
                  : "bg-white border-gray-300 focus:ring-pink-500"
              }`}
              required
              disabled={loading}
              aria-label="Email address for password reset"
            />
          </div>
          <button
            type="submit"
            className={`w-full p-3 rounded-lg shadow-md font-semibold text-white transition-colors duration-200
                       ${
                         loading
                           ? "bg-pink-400 cursor-not-allowed"
                           : "bg-pink-600 hover:bg-pink-700"
                       }`}
            disabled={loading}
            aria-label="Send password reset link"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </span>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>
        {message && (
          <p
            className={`mt-2 text-sm p-2 rounded-md ${
              message.startsWith("Error")
                ? isCurrentThemeDark
                  ? "bg-red-900 text-red-200"
                  : "bg-red-100 text-red-700"
                : isCurrentThemeDark
                ? "bg-green-900 text-green-200"
                : "bg-green-100 text-green-700"
            }`}
            role="status" // Changed from alert to status for less intrusive success messages
          >
            {message}
          </p>
        )}
        <Link
          to="/login"
          className={`font-semibold transition-colors duration-200 ${
            isCurrentThemeDark
              ? "text-pink-400 hover:text-pink-300"
              : "text-pink-600 hover:text-pink-700"
          }`}
          aria-label="Back to login page"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
