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

  // This state will dynamically track the current theme from the document element
  const [isCurrentThemeDark, setIsCurrentThemeDark] = useState(false);

  // New state for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [heirloomToDelete, setHeirloomToDelete] = useState(null);

  // Effect to listen for changes in the 'dark' class on the document element
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsCurrentThemeDark(isDark);
      console.log("HeirloomHub: Detected theme change to dark mode?", isDark); // Debugging log
    });

    // Observe changes to the 'class' attribute of the <html> element
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Set initial state based on current class when component mounts
    setIsCurrentThemeDark(document.documentElement.classList.contains('dark'));

    // Cleanup the observer when the component unmounts
    return () => observer.disconnect();
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  async function fetchHeirlooms() {
    setLoading(true);
    const { data, error } = await supabase
      .from("heirlooms")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching heirlooms:", error);
      setError(error.message);
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
      const filePath = `heirlooms/${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`; // Sanitize filename
      const { error: uploadError } = await supabase.storage
        .from("family-memories")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      let fileType = 'document'; // Default
      if (file.type.includes('image')) {
        fileType = 'image';
      } else if (file.type.includes('pdf')) {
        fileType = 'document'; // PDF is a type of document
      } else if (file.type.includes('video')) {
        fileType = 'video';
      } else if (file.type.includes('audio')) { // Added audio type
        fileType = 'audio';
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
      fetchHeirlooms(); // Refresh the list of heirlooms
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
        .createSignedUrl(filePath, 600); // Signed URL valid for 10 minutes

      if (signedError) throw signedError;

      window.open(signedData.signedUrl, '_blank');
    } catch (err) {
      console.error("Error downloading heirloom:", err.message);
      setUploadMessage({ text: `Error downloading heirloom: ${err.message}`, type: 'error' });
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
      setUploadMessage({ text: 'Heirloom deleted successfully!', type: 'success' });

      setShowDeleteModal(false);
      setHeirloomToDelete(null);
    } catch (err) {
      console.error("Error deleting heirloom:", err.message);
      setUploadMessage({ text: `Error deleting heirloom: ${err.message}`, type: 'error' });
    }
  };

  useEffect(() => {
    if (user) { // Only fetch if user is logged in
      fetchHeirlooms();
    }
  }, [user]); // Depend on user to re-fetch if user state changes

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isCurrentThemeDark ? 'bg-gray-900 text-gray-300' : 'bg-pink-50 text-pink-700'} font-inter`}>
        <p>Please log in to view the Heirloom Hub.</p>
      </div>
    );
  }

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${isCurrentThemeDark ? 'bg-gray-900 text-gray-300' : 'bg-pink-50 text-pink-700'} font-inter`}>
      <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isCurrentThemeDark ? 'border-pink-400' : 'border-pink-600'}`}></div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isCurrentThemeDark ? 'bg-gray-900' : 'bg-pink-50'}`}>
      <Navbar />
      <div className="container mx-auto p-4 md:p-6 font-inter">
        <h1 className={`text-4xl font-bold mb-4 text-center ${isCurrentThemeDark ? 'text-pink-400' : 'text-pink-700'}`}>Heirloom Hub</h1>
        <p className={`text-lg mb-8 text-center ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-600'}`}>
          A secure place for important family documents, recipes, and cherished artifacts.
        </p>

        <div className={`p-6 rounded-lg shadow-lg mb-8 ${isCurrentThemeDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-semibold mb-4 ${isCurrentThemeDark ? 'text-pink-400' : 'text-pink-700'}`}>Upload a New Heirloom</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label htmlFor="heirloom-name" className={`block mb-1 text-sm font-medium ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Heirloom Name <span className="text-red-500">*</span>
              </label>
              <input
                id="heirloom-name"
                type="text"
                placeholder="Grandma's Recipe Book"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:border-transparent ${isCurrentThemeDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-pink-500' : 'bg-white border-gray-300 focus:ring-pink-500'}`}
                required
                disabled={uploading}
              />
            </div>
            <div>
              <label htmlFor="heirloom-description" className={`block mb-1 text-sm font-medium ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Description (optional)
              </label>
              <textarea
                id="heirloom-description"
                placeholder="Details about this heirloom..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full p-3 rounded-lg border resize-none focus:ring-2 focus:border-transparent ${isCurrentThemeDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-pink-500' : 'bg-white border-gray-300 focus:ring-pink-500'}`}
                rows="3"
                disabled={uploading}
              />
            </div>
            <div>
              <label htmlFor="heirloom-file" className={`block mb-1 text-sm font-medium ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Select File <span className="text-red-500">*</span>
              </label>
              <input
                id="heirloom-file"
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className={`w-full p-2 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${isCurrentThemeDark ? 'file:bg-gray-700 file:text-pink-400 hover:file:bg-gray-600 text-white' : 'file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 text-gray-700'}`}
                required
                disabled={uploading}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" // Expanded accepted file types
              />
            </div>
            {error && <p className={`text-red-500 text-sm mt-2 ${isCurrentThemeDark ? 'text-red-400' : ''}`} role="alert">{error}</p>}
            <button
              type="submit"
              className={`w-full p-3 rounded-lg shadow-md transition ${uploading ? 'bg-pink-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'} text-white disabled:opacity-50`}
              disabled={uploading}
              aria-label="Upload heirloom"
            >
              {uploading ? 'Uploading...' : 'Upload Heirloom'}
            </button>
          </form>
          {uploadMessage.text && (
            <div className={`mt-4 p-3 rounded-lg text-center ${uploadMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`} role="alert">
              {uploadMessage.text}
            </div>
          )}
        </div>

        <div className={`p-6 rounded-lg shadow-lg ${isCurrentThemeDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-semibold mb-4 ${isCurrentThemeDark ? 'text-pink-400' : 'text-pink-700'}`}>All Heirlooms</h2>
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <div className={`animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 ${isCurrentThemeDark ? 'border-pink-400' : 'border-pink-500'}`}></div>
            </div>
          ) : heirlooms.length === 0 ? (
            <p className={`text-center ${isCurrentThemeDark ? 'text-gray-400' : 'text-gray-500'}`}>No heirlooms have been added yet.</p>
          ) : (
            <div className="space-y-4">
              {heirlooms.map((heirloom) => (
                <div key={heirloom.id} className={`p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center transition-colors duration-200 ${isCurrentThemeDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="mb-2 sm:mb-0 sm:mr-4">
                    <h3 className={`font-semibold ${isCurrentThemeDark ? 'text-gray-100' : 'text-gray-800'}`}>{heirloom.title}</h3>
                    <p className={`text-sm ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-600'}`}>{heirloom.description}</p>
                    <p className={`text-xs mt-1 ${isCurrentThemeDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Type: {heirloom.file_type.charAt(0).toUpperCase() + heirloom.file_type.slice(1)}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleDownload(heirloom.file_path)}
                      className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm transition ${isCurrentThemeDark ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-pink-600 text-white hover:bg-pink-700'}`}
                      aria-label={`Download ${heirloom.title}`}
                    >
                      Download
                    </button>
                    {user && user.id === heirloom.uploaded_by && (
                      <button
                        onClick={() => openDeleteModal(heirloom)}
                        className={`w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition`}
                        aria-label={`Delete ${heirloom.title}`}
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
          darkMode={isCurrentThemeDark} // Pass darkMode prop
          itemName={heirloomToDelete?.title || "this heirloom"}
        />
      )}
    </div>
  );
}
