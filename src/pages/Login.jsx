import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCurrentThemeDark, setIsCurrentThemeDark] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsCurrentThemeDark(isDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    setIsCurrentThemeDark(document.documentElement.classList.contains("dark"));
    return () => observer.disconnect();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError(authError.message);
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 font-inter transition-colors duration-300
                   ${
                     isCurrentThemeDark
                       ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
                       : "bg-gradient-to-br from-pink-50 via-white to-pink-50"
                   }`}
    >
      <div
        className={`w-full max-w-md p-8 rounded-xl shadow-2xl space-y-8 transition-all duration-300
                      ${
                        isCurrentThemeDark
                          ? "bg-gray-800 border border-gray-700"
                          : "bg-white border border-gray-100"
                      }`}
      >
        <div className="text-center space-y-2">
          <h2
            className={`text-3xl font-bold ${
              isCurrentThemeDark ? "text-pink-400" : "text-pink-600"
            }`}
          >
            Welcome Back
          </h2>
          <p
            className={`text-sm ${
              isCurrentThemeDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Log in to access your family memories
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className={`block text-sm font-medium ${
                isCurrentThemeDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-all
                         ${
                           isCurrentThemeDark
                             ? "bg-gray-700 border-gray-600 text-white focus:ring-pink-500 focus:border-transparent"
                             : "bg-white border-gray-300 focus:ring-pink-400 focus:border-transparent"
                         }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className={`block text-sm font-medium ${
                isCurrentThemeDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-all
                         ${
                           isCurrentThemeDark
                             ? "bg-gray-700 border-gray-600 text-white focus:ring-pink-500 focus:border-transparent"
                             : "bg-white border-gray-300 focus:ring-pink-400 focus:border-transparent"
                         }`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div
              className={`p-3 rounded-md flex items-center ${
                isCurrentThemeDark
                  ? "bg-red-900/50 text-red-200"
                  : "bg-red-100 text-red-700"
              }`}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center
                       ${
                         loading
                           ? "bg-pink-400 cursor-not-allowed"
                           : "bg-pink-600 hover:bg-pink-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                       }`}
            disabled={loading}
          >
            {loading ? (
              <>
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
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        <Link
          to="/forgot-password"
          className={`font-medium hover:underline ${
            isCurrentThemeDark
              ? "text-pink-400 hover:text-pink-300"
              : "text-pink-600 hover:text-pink-700"
          }`}
        >
          Forgot your password?
        </Link>

        {/* <div className={`text-center text-sm ${isCurrentThemeDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Don't have an account?{' '}
          <Link 
            to="/signup" 
            className={`font-medium hover:underline ${isCurrentThemeDark ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-700'}`}
          >
            Sign up
          </Link>
        </div> */}
      </div>
    </div>
  );
}
