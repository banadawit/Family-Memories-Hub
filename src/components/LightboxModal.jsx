// src/components/LightboxModal.jsx
import React from "react";

export default function LightboxModal({ memory, onClose }) {
  if (!memory) return null; // Don't render if no memory is selected

  const isImage = memory.media_type === "image";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 font-inter"
      onClick={onClose} // Close the modal when clicking the backdrop
    >
      <div
        className="relative max-h-full max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-3xl font-bold bg-gray-800 bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center z-10 hover:bg-gray-700 transition"
        >
          &times;
        </button>
        {isImage ? (
          <img
            src={memory.media_url}
            alt={memory.title}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-lg"
          />
        ) : (
          <video
            src={memory.media_url}
            controls
            autoPlay
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg"
          >
            Sorry, your browser does not support this video.
          </video>
        )}
      </div>
    </div>
  );
}
