import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext"; // Import useAuth to get user role

const AlbumCard = ({ album, onDeleteAlbum }) => {
  const { user } = useAuth(); // Get the current user
  const memoryCount = album.memories?.[0]?.count || 0;
  const [coverUrl, setCoverUrl] = useState(
    "https://placehold.co/600x400/FCE7F3/BE185D?text=No+Cover"
  );
  const [showThreeDots, setShowThreeDots] = useState(false); // State for hover
  const [showMenu, setShowMenu] = useState(false); // State for menu dropdown

  // Check if the current user is an admin
  const isAdmin = user && user.id === album.uploaded_by; // For simplicity, album uploader is admin for now
  // In a full role-based system, you'd check user.profile.role === 'admin'

  useEffect(() => {
    const fetchCover = async () => {
      if (album.cover_photo_path) {
        const { data: signedData, error: signedError } = await supabase.storage
          .from("family-memories")
          .createSignedUrl(album.cover_photo_path, 60 * 60);

        if (signedError) {
          console.error("Error fetching cover photo signed URL:", signedError);
          setCoverUrl(
            "https://placehold.co/600x400/FCE7F3/BE185D?text=No+Cover"
          );
        } else {
          setCoverUrl(signedData.signedUrl);
        }
      }
    };
    fetchCover();
  }, [album.cover_photo_path]);

  const toggleMenu = (e) => {
    e.stopPropagation(); // Prevent navigating to album details
    setShowMenu(!showMenu);
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent navigating to album details
    onDeleteAlbum(album); // Pass the entire album object for deletion
    setShowMenu(false); // Close the menu
  };

  return (
    <div
      className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer bg-white relative"
      onMouseEnter={() => setShowThreeDots(true)}
      onMouseLeave={() => {
        setShowThreeDots(false);
        setShowMenu(false);
      }}
    >
      <Link to={`/album/${album.id}`}>
        {" "}
        {/* Link wraps the entire card content except the menu */}
        <img
          src={coverUrl}
          alt={album.title || "Family Album"}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 bg-pink-600 text-white text-xs px-2 py-1 rounded-full shadow">
          {memoryCount} {memoryCount === 1 ? "memory" : "memories"}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-pink-700">{album.title}</h3>
          <p className="text-gray-600 text-sm truncate">{album.description}</p>
          <p className="text-xs mt-1 text-gray-400 italic">
            Created: {new Date(album.created_at).toLocaleDateString()}
          </p>
        </div>
      </Link>

      {/* Three-dot menu button - appears on hover */}
      {showThreeDots &&
        isAdmin && ( // Only show three dots if admin
          <div className="absolute top-2 right-2 flex flex-col items-end z-10">
            <button
              onClick={toggleMenu}
              className="text-white text-xl bg-gray-800 bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-700 transition"
            >
              &#8285; {/* Three vertical dots */}
            </button>
            {showMenu && (
              <div className="mt-1 bg-white rounded-md shadow-lg p-2 space-y-1">
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-1 text-sm text-red-600 hover:bg-red-100 rounded-md flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete Album
                </button>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default AlbumCard;
