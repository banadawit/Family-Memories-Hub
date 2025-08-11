import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

export default function HeirloomHub() {
  const { user } = useAuth();
  const [heirlooms, setHeirlooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [uploadMessage, setUploadMessage] = useState({ text: '', type: '' });

  // New state for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [heirloomToDelete, setHeirloomToDelete] = useState(null);

  async function fetchHeirlooms() {
    setLoading(true);
    const { data, error } = await supabase
      .from("heirlooms")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching heirlooms:", error);
    } else {
      setHeirlooms(data);
    }
    setLoading(false);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file || !name) {
      setError("Please provide a name and select a file.");
      return;
    }
    setUploading(true);
    setError(null);
    setUploadMessage({ text: '', type: '' });

    try {
      const filePath = `heirlooms/${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("family-memories")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      let fileType = 'document';
      if (file.type.includes('image')) {
        fileType = 'image';
      } else if (file.type.includes('pdf')) {
        fileType = 'document';
      } else if (file.type.includes('video')) {
        fileType = 'video';
      }

      const { data, error: insertError } = await supabase
        .from("heirlooms")
        .insert([{
          title: name,
          description,
          file_path: filePath,
          file_type: fileType,
          uploaded_by: user.id
        }]);

      if (insertError) throw insertError;

      setUploadMessage({ text: 'Heirloom uploaded successfully!', type: 'success' });
      setFile(null);
      setName("");
      setDescription("");
      fetchHeirlooms();
    } catch (err) {
      setUploadMessage({ text: `Error uploading heirloom: ${err.message}`, type: 'error' });
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(filePath) {
    try {
      const { data: signedData, error: signedError } = await supabase.storage
        .from("family-memories")
        .createSignedUrl(filePath, 600);

      if (signedError) throw signedError;

      window.open(signedData.signedUrl, '_blank');
    } catch (err) {
      console.error("Error downloading heirloom:", err.message);
    }
  }

  // New functions for deletion
  const openDeleteModal = (heirloom) => {
    setHeirloomToDelete(heirloom);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!heirloomToDelete) return;

    try {
      // Delete the file from storage
      const { error: storageError } = await supabase.storage
        .from("family-memories")
        .remove([heirloomToDelete.file_path]);

      if (storageError) console.error("Error deleting file from storage:", storageError.message);

      // Delete the heirloom record from the database
      const { error: dbError } = await supabase
        .from("heirlooms")
        .delete()
        .eq("id", heirloomToDelete.id);

      if (dbError) throw dbError;

      // Update the UI optimistically
      setHeirlooms(heirlooms.filter(h => h.id !== heirloomToDelete.id));

      setShowDeleteModal(false);
      setHeirloomToDelete(null);
    } catch (err) {
      console.error("Error deleting heirloom:", err.message);
    }
  };

  useEffect(() => {
    fetchHeirlooms();
  }, []);

  return (
    <div className="min-h-screen bg-pink-50">
      <Navbar />
      <div className="container mx-auto p-6 font-inter">
        <h1 className="text-4xl font-bold text-pink-700 mb-4 text-center">Heirloom Hub</h1>
        <p className="text-gray-600 mb-8 text-center">
          A secure place for important family documents and recipes.
        </p>

        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-pink-700 mb-4">Upload a New Heirloom</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <input
              type="text"
              placeholder="Heirloom Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border rounded-lg resize-none"
              rows="3"
            />
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full p-2 border rounded-lg"
              required
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              type="submit"
              className="w-full bg-pink-600 text-white p-3 rounded-lg shadow-md hover:bg-pink-700 disabled:opacity-50"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Heirloom'}
            </button>
          </form>
          {uploadMessage.text && (
            <div className={`mt-4 p-3 rounded-lg text-center ${uploadMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {uploadMessage.text}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-pink-700 mb-4">All Heirlooms</h2>
          {loading ? (
            <p className="text-center text-gray-500">Loading heirlooms...</p>
          ) : heirlooms.length === 0 ? (
            <p className="text-center text-gray-500">No heirlooms have been added yet.</p>
          ) : (
            <div className="space-y-4">
              {heirlooms.map((heirloom) => (
                <div key={heirloom.id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50">
                  <div>
                    <h3 className="font-semibold text-gray-800">{heirloom.title}</h3>
                    <p className="text-sm text-gray-600">{heirloom.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{heirloom.file_type}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload(heirloom.file_path)}
                      className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-700 transition"
                    >
                      Download
                    </button>
                    {user && user.id === heirloom.uploaded_by && (
                      <button
                        onClick={() => openDeleteModal(heirloom)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showDeleteModal && (
        <DeleteConfirmationModal
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}