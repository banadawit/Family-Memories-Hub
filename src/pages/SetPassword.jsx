import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function SetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Check if the user already has a password set.
    if (user) {
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
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      alert(
        "Password set successfully! You can now log in with your new password."
      );
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pink-50">
      <Navbar />
      <div className="container mx-auto p-6 font-inter">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-pink-700 mb-4">
            Set Your Password
          </h2>
          <p className="text-gray-600 mb-6">
            You've been invited to the family hub. Please set a password for
            future logins.
          </p>

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              type="submit"
              className="w-full bg-pink-600 text-white p-3 rounded-lg shadow-md hover:bg-pink-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Setting..." : "Set Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
