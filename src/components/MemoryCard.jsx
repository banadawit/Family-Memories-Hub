import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const MemoryCard = ({ memory, onDelete, darkMode, canDelete }) => {
  const { user } = useAuth();
  const isImage = memory.media_type === "image";
  const [showThreeDots, setShowThreeDots] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete();
    setShowMenu(false);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (!memory.media_path) {
      console.error("No media path available for download.");
      return;
    }

    try {
      // Create a signed URL that is valid for 10 minutes
      const { data: signedData, error: signedError } = await supabase.storage
        .from("family-memories")
        .createSignedUrl(memory.media_path, 600); // 600 seconds = 10 minutes

      if (signedError) {
        console.error("Error creating signed URL:", signedError.message);
        throw signedError;
      }

      const downloadLink = document.createElement("a");
      downloadLink.href = signedData.signedUrl;
      const fileName = memory.media_path.split("/").pop();
      downloadLink.download = fileName || `memory-${memory.id}`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

    } catch (err) {
      console.error("Error downloading file:", err.message);
    }
    setShowMenu(false);
  };

  return (
    <div
      className={`rounded-lg overflow-hidden shadow-md hover:shadow-lg transition relative flex flex-col h-full ${
        darkMode ? "bg-gray-800" : "bg-white"
      }`}
      onMouseEnter={() => {
        setShowThreeDots(true);
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setShowThreeDots(false);
        setShowMenu(false);
        setIsHovered(false);
      }}
    >
      {/* Media Container */}
      <div className="relative w-full aspect-square overflow-hidden">
        {isImage ? (
          <img
            src={memory.media_url}
            alt={memory.title || "Family Memory"}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isHovered ? "scale-105" : "scale-100"
            }`}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.target.src = darkMode
                ? "https://placehold.co/600x400/1F2937/9CA3AF?text=Image+Not+Available"
                : "https://placehold.co/600x400/FCE7F3/BE185D?text=Image+Not+Available";
            }}
          />
        ) : (
          <video
            controls
            className="w-full h-full object-cover"
            preload="metadata"
            poster={
              darkMode
                ? "https://placehold.co/600x400/1F2937/9CA3AF?text=Video+Preview"
                : "https://placehold.co/600x400/FCE7F3/BE185D?text=Video+Preview"
            }
          >
            <source
              src={memory.media_url}
              type={`video/${memory.media_path?.split(".").pop() || 'mp4'}`}
            />
            Your browser does not support the video tag.
          </video>
        )}

        {/* Date Badge */}
        <div
          className={`absolute bottom-2 left-2 text-xs px-2 py-1 rounded-full ${
            darkMode
              ? "bg-gray-700 text-gray-200"
              : "bg-white text-gray-700"
          }`}
        >
          {new Date(memory.created_at).toLocaleDateString()}
        </div>

        {/* Action Menu */}
        {showThreeDots && (
          <div className="absolute top-2 right-2 flex flex-col items-end z-10">
            <button
              onClick={toggleMenu}
              className={`text-xl rounded-full w-8 h-8 flex items-center justify-center transition ${
                darkMode
                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              } shadow-md`}
              aria-label="Memory options"
            >
              &#8285;
            </button>
            {showMenu && (
              <div
                className={`mt-1 rounded-md shadow-lg p-2 min-w-[120px] ${
                  darkMode ? "bg-gray-700" : "bg-white"
                }`}
              >
                <button
                  onClick={handleDownload}
                  className={`w-full text-left px-3 py-1 text-sm rounded-md flex items-center ${
                    darkMode
                      ? "text-gray-200 hover:bg-gray-600"
                      : "text-gray-700 hover:bg-gray-100"
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </button>
                {canDelete && (
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
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Text Content */}
      <div className="p-4 flex-grow">
        <h3
          className={`text-lg font-semibold ${
            darkMode ? "text-pink-400" : "text-pink-700"
          }`}
        >
          {memory.title}
        </h3>
        <p
          className={`text-sm ${
            darkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {memory.description}
        </p>
      </div>
    </div>
  );
};

export default MemoryCard;