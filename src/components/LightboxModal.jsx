// src/components/LightboxModal.jsx
import React from "react";
import ReactionButtons from "./ReactionButtons"; // Import reactions
import CommentSection from "./CommentSection"; // Import comments

export default function LightboxModal({ memory, onClose }) {
  if (!memory) return null;

  const isImage = memory.media_type === "image";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 font-inter"
      onClick={onClose}
    >
      <div
        className="relative max-h-full max-w-full flex flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media Container */}
        <div className="flex-shrink-0 md:w-3/4 max-h-[90vh] flex items-center justify-center bg-black">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 md:hidden text-white text-3xl font-bold bg-gray-800 bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center z-10 hover:bg-gray-700 transition"
          >
            &times;
          </button>
          {isImage ? (
            <img
              src={memory.media_url}
              alt={memory.title}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <video
              src={memory.media_url}
              controls
              autoPlay
              className="max-h-full max-w-full"
            >
              Sorry, your browser does not support this video.
            </video>
          )}
        </div>

        {/* Sidebar for details, comments, and reactions */}
        <div className="flex-shrink-0 md:w-1/4 p-4 overflow-y-auto max-h-[90vh] flex flex-col">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 hidden md:block text-gray-800 text-3xl font-bold rounded-full w-8 h-8 flex items-center justify-center z-10 hover:bg-gray-200 transition"
          >
            &times;
          </button>

          {/* Memory Details */}
          <h3 className="text-xl font-semibold text-pink-700 mb-2">
            {memory.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4">{memory.description}</p>

          {/* Reactions */}
          <div className="mb-4">
            <ReactionButtons memoryId={memory.id} />
          </div>

          {/* Comments Section */}
          <div className="flex-grow">
            <CommentSection memoryId={memory.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
