import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import AlbumDetails from "./pages/AlbumDetails"; // <--- Make sure this import is here
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";

/**
 * PrivateRoute component to protect routes that require authentication.
 * If the user is not logged in, they are redirected to the login page.
 */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Show a loading message while authentication state is being determined
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50 text-pink-700 font-inter">
        Loading application...
      </div>
    );
  }

  // If no user is logged in, redirect to the login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If user is logged in, render the child components (the protected route)
  return children;
}

/**
 * Main App component that sets up the routing for the application.
 */
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/album/:id"
            element={
              <PrivateRoute>
                <AlbumDetails />
              </PrivateRoute>
            }
          />

          {/* Main profile page for the current user */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          {/* Dynamic route for other users' profiles */}
          <Route
            path="/profile/:id"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
