import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import AlbumCard from "../components/AlbumCard";
import MessageModal from "../components/MessageModal";
import InviteUser from "../components/InviteUser";

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
  
  // New state for custom messages
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState({ text: '', type: '' });
  
  // Restored: State to hold the user's role
  const [profileRole, setProfileRole] = useState('member'); 

  const showCustomMessage = (text, type) => {
    setMessageContent({ text, type });
    setShowMessageModal(true);
  };

  useEffect(() => {
    async function getProfileAndAlbums() {
      if (!profileId) return;

      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`full_name, avatar_url, role`) // Correct: Fetch the role
        .eq("id", profileId)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        showCustomMessage(`Error fetching profile: ${profileError.message}`, 'error');
      } else if (profileData) {
        setFullName(profileData.full_name);
        setAvatarPath(profileData.avatar_url);
        setProfileRole(profileData.role); // Correct: Set the role
        
        if (profileData.avatar_url) {
          const { data: signedData, error: signedUrlError } = await supabase.storage
            .from("family-memories")
            .createSignedUrl(profileData.avatar_url, 3600);

          if (signedUrlError) {
            console.error("Error creating signed URL:", signedUrlError);
            setAvatarUrl(null);
          } else {
            setAvatarUrl(signedData.signedUrl);
          }
        } else {
          setAvatarUrl(null);
        }
      }

      const { data: albumsData, error: albumsError } = await supabase
        .from("albums")
        .select(`
          *,
          memories(count)
        `)
        .eq("uploaded_by", profileId)
        .order("created_at", { ascending: false });

      if (albumsError) {
        console.error("Error fetching user albums:", albumsError);
      } else {
        setAlbums(albumsData);
      }

      setLoading(false);
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

      if (error) {
        throw error;
      }
      showCustomMessage('Profile updated successfully!', 'success');
    } catch (error) {
      console.error("Error updating profile:", error.message);
      showCustomMessage(`Error updating profile: ${error.message}`, 'error');
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
      
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("family-memories")
        .createSignedUrl(filePath, 3600);

      if (signedUrlError) {
        throw signedUrlError;
      }

      setAvatarPath(filePath);
      setAvatarUrl(signedUrlData.signedUrl);

      showCustomMessage('Avatar uploaded successfully! Click "Update Profile" to save your changes.', 'success');
    } catch (error) {
      console.error("Error uploading avatar:", error.message);
      showCustomMessage(`Error uploading avatar: ${error.message}`, 'error');
    } finally {
      setUploading(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 text-pink-700 font-inter">
      Loading profile...
    </div>
  );
  if (!profileId) return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 text-red-500 font-inter">
      No profile found.
    </div>
  );

  return (
    <div className="min-h-screen bg-pink-50">
      <Navbar />
      <div className="container mx-auto p-6 font-inter">
        <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <button
            onClick={() => navigate("/")}
            className="mb-4 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200"
          >
            &larr; Back to Home
          </button>
          
          {isCurrentUserProfile ? (
            <h2 className="text-3xl font-bold text-pink-700 mb-6 text-center">My Profile</h2>
          ) : (
            <h2 className="text-3xl font-bold text-pink-700 mb-6 text-center">
              {fullName}'s Profile
            </h2>
          )}

          <div className="flex flex-col items-center space-y-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-pink-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-6xl border-4 border-pink-200">
                ?
              </div>
            )}
            {isCurrentUserProfile && (
              <div>
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer bg-pink-100 text-pink-700 font-semibold py-2 px-4 rounded-full hover:bg-pink-200 transition"
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
            <form onSubmit={updateProfile} className="space-y-6 mt-6">
              <div>
                <label htmlFor="full-name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  id="full-name"
                  type="text"
                  value={fullName || ""}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="text"
                  value={user?.email || ""}
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                  disabled
                />
              </div>
              <button
                type="submit"
                className="w-full bg-pink-600 text-white p-3 rounded-lg shadow-md hover:bg-pink-700 transition-colors duration-200 disabled:opacity-50"
                disabled={loading || uploading}
              >
                {loading ? "Saving..." : "Update Profile"}
              </button>
            </form>
          ) : (
            <div className="space-y-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <p className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm bg-gray-100">{fullName}</p>
              </div>
              <div>
                <p className="text-lg text-pink-700 font-semibold text-center mt-8">
                  {fullName} has uploaded {albums.length} albums.
                </p>
                {albums.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {albums.map((album) => (
                      <Link to={`/album/${album.id}`} key={album.id}>
                        <AlbumCard album={album} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {isCurrentUserProfile && profileRole === 'admin' && (
          <InviteUser />
        )}
      </div>
      {showMessageModal && (
        <MessageModal
          message={messageContent.text}
          type={messageContent.type}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </div>
  );
}