import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function UploadModal({ onClose, onUpload }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventTag, setEventTag] = useState("");
  const [file, setFile] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setMediaType(selected.type.startsWith("video") ? "video" : "image");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError("Please provide a title and select a file.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create a secure file path based on the user ID and timestamp
      const filePath = `${user.id}/${Date.now()}_${file.name}`;

      // 2. Upload the file to the 'family-memories' bucket
      const { error: uploadError } = await supabase.storage
        .from("family-memories")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Instead of getting a public URL, we save the file path to the database.
      // This path will be used later to generate a secure, temporary signed URL.
      const { error: insertError } = await supabase.from("memories").insert([
        {
          title,
          description,
          event_tag: eventTag,
          media_path: filePath, // Use the new column
          media_type: mediaType,
          uploaded_by: user.id,
        },
      ]);

      if (insertError) throw insertError;

      // 4. Reset state and close the modal
      setTitle("");
      setDescription("");
      setEventTag("");
      setFile(null);

      onUpload(); // Calls the parent function to refresh the memories list
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
        <h2 className="text-xl font-semibold text-pink-700">Add New Memory</h2>

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
          onChange={handleFileChange}
          required
        />

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
