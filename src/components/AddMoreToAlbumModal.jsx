// src/components/AddMoreToAlbumModal.jsx
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function AddMoreToAlbumModal({ albumId, onClose, onUpload }) {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError("Please select at least one file to add.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const memoriesToInsert = [];

      for (const file of files) {
        const filePath = `${user.id}/${albumId}/${Date.now()}_${file.name}`; // Use existing albumId
        
        const { error: uploadError } = await supabase.storage
          .from("family-memories")
          .upload(filePath, file);

        if (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError);
          continue;
        }

        memoriesToInsert.push({
          title: file.name,
          media_path: filePath,
          media_type: file.type.startsWith("video") ? "video" : "image",
          uploaded_by: user.id,
          album_id: albumId // Link to the existing album
        });
      }

      if (memoriesToInsert.length > 0) {
        const { error: insertError } = await supabase.from("memories").insert(memoriesToInsert);
        if (insertError) throw insertError;
      }

      setFiles([]);
      onUpload(); // Refresh the album details page
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <form
        onSubmit={handleUpload}
        className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full space-y-4 font-inter"
      >
        <h2 className="text-xl font-semibold text-pink-700">Add More to Album</h2>

        <label htmlFor="files" className="block text-gray-700 text-sm font-bold mb-1">
            Select Photos/Videos (multiple allowed):
        </label>
        <input
          id="files"
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          className="w-full text-gray-700 border border-gray-300 rounded-lg p-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
          required
        />
        
        {files.length > 0 && (
          <div className="text-sm text-gray-500 mt-2">
            Selected: <span className="font-semibold">{files.length}</span> file(s)
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-end space-x-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-pink-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-pink-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add to Album"}
          </button>
        </div>
      </form>
    </div>
  );
}