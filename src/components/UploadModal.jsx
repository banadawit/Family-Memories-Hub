import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function UploadModal({ onClose, onUpload, darkMode }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventTag, setEventTag] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file types and sizes
    const validFiles = selectedFiles.filter(file => {
      const isValidType = file.type.startsWith("image/") || file.type.startsWith("video/");
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isValidType) {
        setError(`Invalid file type: ${file.name}. Only images and videos are allowed.`);
      } else if (!isValidSize) {
        setError(`File too large: ${file.name}. Maximum size is 50MB.`);
      }
      
      return isValidType && isValidSize;
    });
    
    setFiles(validFiles);
    if (validFiles.length !== selectedFiles.length) {
      // If some files were invalid, keep the error message and don't clear it
      // if valid files were also selected, the error will be for the invalid ones.
      return; 
    }
    setError(null); // Clear error if all selected files are valid
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0 || !title.trim()) {
      setError("Please provide a title and select at least one file.");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // 1. Create a new album entry first
      const { data: albumData, error: albumError } = await supabase
        .from("albums")
        .insert([{
          title,
          description,
          event_tag: eventTag,
          uploaded_by: user.id,
        }])
        .select();

      if (albumError) throw albumError;

      const albumId = albumData[0].id;
      const memoriesToInsert = [];
      let coverPhotoPath = null;

      // 2. Upload files with progress tracking
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = `${user.id}/${albumId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const fileType = file.type.startsWith("video") ? "video" : "image";

        // Upload file with progress tracking
        const { error: uploadError } = await supabase.storage
          .from("family-memories")
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (progressEvent) => {
              const currentFileProgress = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              );
              // Calculate overall progress
              const overallProgress = Math.round(
                ((i * 100 + currentFileProgress) / (files.length * 100)) * 100
              );
              setProgress(overallProgress);
            }
          });

        if (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError);
          setError(`Failed to upload ${file.name}: ${uploadError.message}`); // Show specific file error
          continue; // Try to upload other files
        }

        // Set the first image as the cover photo
        if (i === 0 && fileType === "image") {
          coverPhotoPath = filePath;
        }

        memoriesToInsert.push({
          title: file.name.split('.')[0], // Remove extension
          description: `Uploaded by ${user.email}`,
          media_path: filePath,
          media_type: fileType,
          uploaded_by: user.id,
          album_id: albumId,
        });
      }

      // 3. Insert all memories into the database at once
      if (memoriesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("memories")
          .insert(memoriesToInsert);
        if (insertError) throw insertError;
      } else {
        // If no valid files were uploaded, delete the created album
        await supabase.from("albums").delete().eq("id", albumId);
        setError("No valid files were uploaded to create memories.");
        setLoading(false);
        setProgress(0);
        return;
      }

      // 4. Update the album with the cover photo path if available
      if (coverPhotoPath) {
        await supabase
          .from("albums")
          .update({ cover_photo_path: coverPhotoPath })
          .eq("id", albumId);
      }

      // 5. Reset state and close the modal
      resetForm();
      onUpload(); // Notify parent to refresh album list
      onClose(); // Close the modal
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "An unexpected error occurred during upload.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEventTag("");
    setFiles([]);
    setError(null);
  };

  const handleCancel = () => {
    if (!loading) { // Only allow cancel if not currently uploading
      resetForm();
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 font-inter ${darkMode ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-40'}`}
      onClick={handleCancel} // Close modal when clicking outside, if not loading
      role="dialog" // Added for accessibility
      aria-modal="true" // Added for accessibility
      aria-label="Create New Album" // Added for accessibility
    >
      <div 
        className={`relative rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} // Added max-h and overflow
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <button
          onClick={handleCancel}
          className={`absolute top-4 right-4 p-1 rounded-full transition ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
          disabled={loading} // Disable button during upload
          aria-label="Close modal" // Added for accessibility
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-pink-400' : 'text-pink-700'}`}>
            Create New Album
          </h2>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label htmlFor="album-title" className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="album-title"
                type="text"
                placeholder="Family Vacation 2024"
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:border-transparent ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-pink-500' : 'bg-white border-gray-300 focus:ring-pink-500'}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="album-description" className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Description (optional)
              </label>
              <textarea
                id="album-description"
                placeholder="Describe this album..."
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:border-transparent ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-pink-500' : 'bg-white border-gray-300 focus:ring-pink-500'}`}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="album-event-tag" className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Event Tag (optional)
              </label>
              <input
                id="album-event-tag"
                type="text"
                placeholder="e.g. Christmas, Birthday, Vacation"
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:border-transparent ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-pink-500' : 'bg-white border-gray-300 focus:ring-pink-500'}`}
                value={eventTag}
                onChange={(e) => setEventTag(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="file-upload" className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Files <span className="text-red-500">*</span>
              </label>
              <div className={`border-2 border-dashed rounded-lg p-6 text-center ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                  aria-label="Select image or video files" // Added for accessibility
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer flex flex-col items-center justify-center space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="font-medium">Click to select files or drag and drop</p>
                  <p className="text-sm">Supports images and videos (max 50MB each)</p>
                </label>
              </div>
              {files.length > 0 && (
                <div className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Selected: {files.length} file{files.length !== 1 ? 's' : ''}
                  {files.length > 0 && files.some(file => !file.type.startsWith("image/") && !file.type.startsWith("video/") || file.size > 50 * 1024 * 1024) && (
                    <span className="text-red-500 ml-2"> (Some files were invalid and not selected)</span>
                  )}
                </div>
              )}
            </div>

            {/* Progress bar */}
            {loading && (
              <div className="pt-2">
                <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div
                    className={`h-full rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-pink-500'}`}
                    style={{ width: `${progress}%` }}
                    role="progressbar" // Added for accessibility
                    aria-valuenow={progress} // Added for accessibility
                    aria-valuemin="0" // Added for accessibility
                    aria-valuemax="100" // Added for accessibility
                  ></div>
                </div>
                <p className={`text-right text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {progress}% complete
                </p>
              </div>
            )}

            {error && (
              <div className={`p-3 rounded-lg text-sm ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'}`} role="alert"> {/* Added role="alert" */}
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                disabled={loading}
                aria-label="Cancel upload" // Added for accessibility
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-5 py-2.5 rounded-lg font-medium text-white ${loading ? 'bg-pink-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'}`} // Added cursor-not-allowed
                disabled={loading}
                aria-label="Create album" // Added for accessibility
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : 'Create Album'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
