import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import UploadModal from "../components/UploadModal";
import AlbumCard from "../components/AlbumCard";
import Navbar from "../components/Navbar"; // Import the Navbar component

export default function Home() {
  const { user } = useAuth(); // signOut is now handled by Navbar
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchAlbums = async () => {
    setLoading(true);

    const { data: albumsData, error } = await supabase
      .from("albums")
      .select(
        `
        *,
        memories(count)
        `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching albums:", error.message);
    } else {
      setAlbums(albumsData);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchAlbums();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-pink-50 text-pink-700 font-inter">
        <p>Please log in to view family memories.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Navbar /> {/* Replaced the header with the Navbar component */}
      <div className="container mx-auto p-6 font-inter">
        {/* Stats */}
        <section className="mb-8">
          <p className="text-gray-700 text-lg">
            You have <span className="font-semibold">{albums.length}</span> albums
            saved.
          </p>
        </section>

        {/* Create New Album Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-3 rounded-lg shadow-lg transition-colors duration-200"
          >
            + Create New Album
          </button>
        </div>

        {/* Albums Grid */}
        <section>
          {loading ? (
            <p className="text-center text-gray-500">Loading albums...</p>
          ) : albums.length === 0 ? (
            <p className="text-center text-gray-500">
              No albums yet. Create your first one!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </section>

        {/* Upload Modal (for new album creation) */}
        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onUpload={fetchAlbums} // Refresh albums after upload
          />
        )}
      </div>
    </div>
  );
}