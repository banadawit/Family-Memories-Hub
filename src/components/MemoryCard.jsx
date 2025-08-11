import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const MemoryCard = ({ memory, onDelete }) => {
  const { user } = useAuth();
  const isImage = memory.media_type === "image";
  const [showThreeDots, setShowThreeDots] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isUploader = user && user.id === memory.uploaded_by;

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
      const fileName = memory.media_path.split("/").pop(); // Use the original file name
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      console.log("Download triggered for:", fileName);

    } catch (err) {
      console.error("Error downloading file:", err.message);
      // You could also add a user-facing error message here
    }
    setShowMenu(false);
  };

  return (
    <div
      className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition relative bg-white font-inter flex flex-col h-full"
      onMouseEnter={() => setShowThreeDots(true)}
      onMouseLeave={() => {
        setShowThreeDots(false);
        setShowMenu(false);
      }}
    >
      {isImage ? (
        <img
          src={memory.media_url}
          alt={memory.title || "Family Memory"}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
      ) : (
        <video controls className="w-full h-48 object-cover" preload="metadata">
          <source
            src={memory.media_url}
            type={`video/${memory.media_path.split(".").pop()}`}
          />
          Sorry, your browser does not support embedded videos.
        </video>
      )}

      {showThreeDots && (
        <div className="absolute top-2 right-2 flex flex-col items-end z-10">
          <button
            onClick={toggleMenu}
            className="text-white text-xl bg-gray-800 bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-700 transition"
          >
            &#8285;
          </button>
          {showMenu && (
            <div className="mt-1 bg-white rounded-md shadow-lg p-2 space-y-1">
              <button
                onClick={handleDownload}
                className="w-full text-left px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
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
              {isUploader && (
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
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <div className="p-4 flex-grow">
        <h3 className="text-lg font-semibold text-pink-700">{memory.title}</h3>
        <p className="text-gray-600 text-sm truncate">{memory.description}</p>
        <p className="text-xs mt-1 text-gray-400 italic">
          {new Date(memory.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default MemoryCard;