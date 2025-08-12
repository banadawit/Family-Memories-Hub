import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

const AlbumCard = ({ album, onDeleteAlbum, darkMode }) => {
  const { user } = useAuth();
  const memoryCount = album.memories?.[0]?.count || 0;
  const [coverUrl, setCoverUrl] = useState(
    darkMode 
      ? "https://placehold.co/600x400/1F2937/9CA3AF?text=No+Cover" 
      : "https://placehold.co/600x400/FCE7F3/BE185D?text=No+Cover"
  );
  const [showThreeDots, setShowThreeDots] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isAdmin = user && user.id === album.uploaded_by;

  useEffect(() => {
    const fetchCover = async () => {
      if (album.cover_photo_path) {
        const { data: signedData, error: signedError } = await supabase.storage
          .from("family-memories")
          .createSignedUrl(album.cover_photo_path, 60 * 60);

        if (signedError) {
          console.error("Error fetching cover photo signed URL:", signedError);
          setCoverUrl(
            darkMode 
              ? "https://placehold.co/600x400/1F2937/9CA3AF?text=No+Cover" 
              : "https://placehold.co/600x400/FCE7F3/BE185D?text=No+Cover"
          );
        } else {
          setCoverUrl(signedData.signedUrl);
        }
      }
    };
    fetchCover();
  }, [album.cover_photo_path, darkMode]);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDeleteAlbum(album);
    setShowMenu(false);
  };

  return (
    <div
      className={`rounded-lg overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer ${
        darkMode ? "bg-gray-800" : "bg-white"
      } relative group`}
      onMouseEnter={() => setShowThreeDots(true)}
      onMouseLeave={() => {
        setShowThreeDots(false);
        setShowMenu(false);
      }}
    >
      <Link to={`/album/${album.id}`}>
        <img
          src={coverUrl}
          alt={album.title || "Family Album"}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        <div className={`absolute top-2 right-2 ${
          darkMode ? "bg-pink-500" : "bg-pink-600"
        } text-white text-xs px-2 py-1 rounded-full shadow`}>
          {memoryCount} {memoryCount === 1 ? "memory" : "memories"}
        </div>
        <div className="p-4">
          <h3 className={`text-lg font-semibold ${
            darkMode ? "text-pink-400" : "text-pink-700"
          }`}>
            {album.title}
          </h3>
          <p className={`text-sm truncate ${
            darkMode ? "text-gray-300" : "text-gray-600"
          }`}>
            {album.description}
          </p>
          <p className={`text-xs mt-1 italic ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}>
            Created: {new Date(album.created_at).toLocaleDateString()}
          </p>
        </div>
      </Link>

      {showThreeDots && isAdmin && (
        <div className="absolute top-2 right-2 flex flex-col items-end z-10">
          <button
            onClick={toggleMenu}
            className={`text-xl rounded-full w-8 h-8 flex items-center justify-center transition ${
              darkMode 
                ? "bg-gray-700 bg-opacity-80 text-gray-200 hover:bg-gray-600" 
                : "bg-gray-200 bg-opacity-80 text-gray-700 hover:bg-gray-300"
            }`}
          >
            &#8285;
          </button>
          {showMenu && (
            <div className={`mt-1 rounded-md shadow-lg p-2 space-y-1 ${
              darkMode ? "bg-gray-700" : "bg-white"
            }`}>
              <button
                onClick={handleDelete}
                className={`w-full text-left px-3 py-1 text-sm rounded-md flex items-center ${
                  darkMode 
                    ? "text-red-400 hover:bg-gray-600" 
                    : "text-red-600 hover:bg-red-100"
                }`}
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