import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function UploadModal({ onClose, onUpload }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventTag, setEventTag] = useState("");
  const [files, setFiles] = useState([]); // State now holds an array of files
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    // Allows multiple files to be selected
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0 || !title.trim()) {
      setError("Please provide a title and select at least one file.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create a new album entry first
      const { data: albumData, error: albumError } = await supabase
        .from("albums")
        .insert([
          {
            title,
            description,
            event_tag: eventTag,
            uploaded_by: user.id,
          },
        ])
        .select();

      if (albumError) throw albumError;

      const albumId = albumData[0].id;
      const memoriesToInsert = [];

      // 2. Loop through each file and upload it
      for (const file of files) {
        const filePath = `${user.id}/${albumId}/${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("family-memories")
          .upload(filePath, file);

        if (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError);
          continue; // Skip to the next file
        }

        memoriesToInsert.push({
          title: file.name, // Use file name as title, or let user edit later
          media_path: filePath,
          media_type: file.type.startsWith("video") ? "video" : "image",
          uploaded_by: user.id,
          album_id: albumId, // Link to the new album
        });
      }

      // 3. Insert all memories into the database at once
      if (memoriesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("memories")
          .insert(memoriesToInsert);
        if (insertError) throw insertError;
      }

      // 4. Reset state and close the modal
      setTitle("");
      setDescription("");
      setEventTag("");
      setFiles([]);
      onUpload();
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
        className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full space-y-4"
      >
        <h2 className="text-xl font-semibold text-pink-700">
          Create New Album
        </h2>

        <input
          type="text"
          placeholder="Title"
          className="w-full border p-2 rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="Description (optional)"
          className="w-full border p-2 rounded resize-none"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="text"
          placeholder="Event Tag (e.g. Christmas 2024)"
          className="w-full border p-2 rounded"
          value={eventTag}
          onChange={(e) => setEventTag(e.target.value)}
        />

        <input
          type="file"
          accept="image/*,video/*"
          multiple // Crucial for multi-file selection
          onChange={handleFileChange}
          required
        />

        {/* Display selected file names */}
        {files.length > 0 && (
          <div className="text-sm text-gray-500">
            Selected files: {files.length}
          </div>
        )}

        {error && <p className="text-red-500">{error}</p>}

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </form>
    </div>
  );
}
