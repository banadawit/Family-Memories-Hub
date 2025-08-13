import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import AlbumCard from "../components/AlbumCard";
import MessageModal from "../components/MessageModal";
import InviteUser from "../components/InviteUser";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const profileId = id || user?.id;
  const isCurrentUserProfile = profileId === user?.id;

  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [avatarPath, setAvatarPath] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [isCurrentThemeDark, setIsCurrentThemeDark] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState({ text: "", type: "" });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState(null);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [profileRole, setProfileRole] = useState('member');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsCurrentThemeDark(isDark);
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsCurrentThemeDark(document.documentElement.classList.contains('dark'));

    return () => observer.disconnect();
  }, []);

  const showCustomMessage = (text, type) => {
    setMessageContent({ text, type });
    setShowMessageModal(true);
  };

  useEffect(() => {
    async function getProfileAndAlbums() {
      if (!profileId) return;

      setLoading(true);

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(`full_name, avatar_url, role`)
          .eq("id", profileId)
          .single();
        
        if (profileError) throw profileError;
        if (!profileData) throw new Error("Profile not found");

        setFullName(profileData.full_name);
        setAvatarPath(profileData.avatar_url);
        setProfileRole(profileData.role);

        if (profileData.avatar_url) {
          const { data: signedData, error: signedUrlError } = await supabase.storage
            .from("family-memories")
            .createSignedUrl(profileData.avatar_url, 3600);

          setAvatarUrl(signedUrlError ? null : signedData.signedUrl);
        } else {
          setAvatarUrl(null);
        }

        const { data: albumsData, error: albumsError } = await supabase
          .from("albums")
          .select(`*, memories(count)`)
          .eq("uploaded_by", profileId)
          .order("created_at", { ascending: false });

        if (albumsError) throw albumsError;
        setAlbums(albumsData || []);

      } catch (error) {
        console.error("Error fetching data:", error);
        showCustomMessage(`Error: ${error.message}`, 'error');
      } finally {
        setLoading(false);
      }
    }
    getProfileAndAlbums();
  }, [profileId]);

  async function updateProfile(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const updates = {
        id: user.id,
        full_name: fullName,
        avatar_url: avatarPath,
        updated_at: new Date(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;
      showCustomMessage("Profile updated successfully!", "success");
    } catch (error) {
      console.error("Error updating profile:", error.message);
      showCustomMessage(`Error updating profile: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar(e) {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `avatars/${user.id}.${fileExt}`;

      let { error: uploadError } = await supabase.storage
        .from("family-memories")
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("family-memories")
          .createSignedUrl(filePath, 3600);

      if (signedUrlError) {
        throw signedUrlError;
      }

      setAvatarPath(filePath);
      setAvatarUrl(signedUrlData.signedUrl);

      showCustomMessage(
        'Avatar uploaded successfully! Click "Update Profile" to save your changes.',
        "success"
      );
    } catch (error) {
      console.error("Error uploading avatar:", error.message);
      showCustomMessage(`Error uploading avatar: ${error.message}`, "error");
    } finally {
      setUploading(false);
    }
  }

  async function handlePasswordUpdate(e) {
    e.preventDefault();
    setPasswordUpdating(true);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      setPasswordUpdating(false);
      return;
    }

    try {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

      if (signInError) {
        setPasswordError("Incorrect current password.");
        setPasswordUpdating(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      showCustomMessage("Password updated successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message);
      showCustomMessage(`Error updating password: ${err.message}`, "error");
    } finally {
      setPasswordUpdating(false);
    }
  }

  if (loading)
    return (
      <div className={`min-h-screen flex items-center justify-center font-inter transition-colors duration-200 ${isCurrentThemeDark ? 'bg-gray-900 text-gray-300' : 'bg-pink-50 text-pink-700'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isCurrentThemeDark ? 'border-pink-400' : 'border-pink-600'}`}></div>
      </div>
    );

  if (!profileId)
    return (
      <div className={`min-h-screen flex items-center justify-center font-inter transition-colors duration-200 ${isCurrentThemeDark ? 'bg-gray-900 text-red-400' : 'bg-pink-50 text-red-500'}`}>
        No profile found.
      </div>
    );

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isCurrentThemeDark ? 'bg-gray-900' : 'bg-pink-50'}`}>
      <Navbar />
      <div className="container mx-auto p-4 md:p-6 font-inter">
        <div className={`max-w-xl mx-auto p-6 md:p-8 rounded-xl shadow-lg ${isCurrentThemeDark ? 'bg-gray-800 shadow-pink-900/20' : 'bg-white shadow-gray-400/20'}`}>
          <button
            onClick={() => navigate(-1)}
            className={`mb-6 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${isCurrentThemeDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            aria-label="Go back"
          >
            &larr; Back
          </button>

          <h2 className={`text-3xl font-bold mb-8 text-center ${isCurrentThemeDark ? 'text-pink-400' : 'text-pink-700'}`}>
            {isCurrentUserProfile ? 'My Profile' : `${fullName}'s Profile`}
          </h2>

          <div className="flex flex-col items-center space-y-6">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className={`w-36 h-36 rounded-full object-cover border-4 ${isCurrentThemeDark ? 'border-pink-600' : 'border-pink-200'} shadow-md`}
              />
            ) : (
              <div className={`w-36 h-36 rounded-full flex items-center justify-center text-6xl border-4 ${isCurrentThemeDark ? 'bg-gray-700 border-pink-600 text-gray-400' : 'bg-gray-200 border-pink-200 text-gray-500'} shadow-md`}>
                {fullName ? fullName.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            {isCurrentUserProfile && (
              <div>
                <label
                  htmlFor="avatar-upload"
                  className={`cursor-pointer font-semibold py-2 px-6 rounded-full transition-all duration-200 transform hover:scale-105 ${isCurrentThemeDark ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-pink-100 text-pink-700 hover:bg-pink-200'} shadow-sm`}
                  aria-label={uploading ? "Uploading avatar" : "Change profile avatar"}
                >
                  {uploading ? "Uploading..." : "Change Avatar"}
                </label>
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                />
              </div>
            )}
          </div>
          
          {isCurrentUserProfile ? (
            <>
              <form onSubmit={updateProfile} className="space-y-6 mt-8">
                <div>
                  <label htmlFor="full-name" className={`block text-sm font-medium mb-2 ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Full Name
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    value={fullName || ""}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`mt-1 block w-full p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${isCurrentThemeDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-offset-gray-800' : 'bg-white border-gray-300 focus:ring-offset-white'}`}
                    required
                    disabled={loading || uploading}
                  />
                </div>
                <div>
                  <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="text"
                    value={user?.email || ""}
                    className={`mt-1 block w-full p-3 rounded-lg ${isCurrentThemeDark ? 'bg-gray-700 text-gray-300 cursor-not-allowed' : 'bg-gray-100 cursor-not-allowed'}`}
                    disabled
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Role
                  </label>
                  <div className={`mt-1 p-3 rounded-lg font-medium ${profileRole === 'admin' ? (isCurrentThemeDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800') : (isCurrentThemeDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100')}`}>
                    {profileRole.charAt(0).toUpperCase() + profileRole.slice(1)}
                  </div>
                </div>
                <button
                  type="submit"
                  className={`w-full p-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${isCurrentThemeDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'} ${loading || uploading ? 'bg-pink-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'} text-white disabled:opacity-50`}
                  disabled={loading || uploading}
                  aria-label="Update profile information"
                >
                  {loading ? "Saving..." : "Update Profile"}
                </button>
              </form>

              <div className={`mt-10 pt-8 rounded-lg p-6 ${isCurrentThemeDark ? 'bg-gray-700/50 border-t border-gray-700' : 'bg-pink-50 border-t border-gray-200'}`}>
                <h3 className={`text-2xl font-bold mb-6 ${isCurrentThemeDark ? 'text-pink-400' : 'text-pink-700'}`}>
                  Change Password
                </h3>
                <form onSubmit={handlePasswordUpdate} className="space-y-5">
                  <div>
                    <label htmlFor="current-password" className={`block text-sm font-medium mb-2 ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Current Password
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${isCurrentThemeDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-offset-gray-800' : 'bg-white border-gray-300 focus:ring-offset-white'}`}
                      required
                      disabled={passwordUpdating}
                      aria-label="Enter current password"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-password-profile" className={`block text-sm font-medium mb-2 ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      New Password
                    </label>
                    <input
                      id="new-password-profile"
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${isCurrentThemeDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-offset-gray-800' : 'bg-white border-gray-300 focus:ring-offset-white'}`}
                      required
                      disabled={passwordUpdating}
                      aria-label="Enter new password"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-new-password-profile" className={`block text-sm font-medium mb-2 ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Confirm New Password
                    </label>
                    <input
                      id="confirm-new-password-profile"
                      type="password"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${isCurrentThemeDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-offset-gray-800' : 'bg-white border-gray-300 focus:ring-offset-white'}`}
                      required
                      disabled={passwordUpdating}
                      aria-label="Confirm new password"
                    />
                  </div>
                  {passwordError && (
                    <p className={`text-sm p-3 rounded-md ${isCurrentThemeDark ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-700'}`} role="alert">
                      {passwordError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className={`w-full p-3 rounded-lg shadow-md font-semibold text-white transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${isCurrentThemeDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'} ${passwordUpdating ? 'bg-pink-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'}`}
                    disabled={passwordUpdating}
                    aria-label="Change password"
                  >
                    {passwordUpdating ? "Updating..." : "Change Password"}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="space-y-8 mt-8">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Full Name
                </label>
                <div className={`mt-1 p-3 rounded-lg ${isCurrentThemeDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100'}`}>
                  {fullName}
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Role
                </label>
                <div className={`mt-1 p-3 rounded-lg font-medium ${profileRole === 'admin' ? (isCurrentThemeDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800') : (isCurrentThemeDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100')}`}>
                  {profileRole.charAt(0).toUpperCase() + profileRole.slice(1)}
                </div>
              </div>
              <div>
                <p className={`text-lg font-semibold text-center mt-8 mb-6 ${isCurrentThemeDark ? 'text-pink-400' : 'text-pink-700'}`}>
                  {fullName} has {albums.length} {albums.length === 1 ? 'album' : 'albums'}
                </p>
                {albums.length > 0 ? (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {albums.map((album) => (
                      <Link to={`/album/${album.id}`} key={album.id}>
                        <AlbumCard album={album} darkMode={isCurrentThemeDark} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className={`text-center py-8 ${isCurrentThemeDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {fullName} hasn't created any albums yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        {isCurrentUserProfile && profileRole === 'admin' && (
          <InviteUser darkMode={isCurrentThemeDark} />
        )}
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