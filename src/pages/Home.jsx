import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import UploadModal from "../components/UploadModal";
import AlbumCard from "../components/AlbumCard";
import Navbar from "../components/Navbar";
import TimelineView from "../components/TimelineView"; // Import the new TimelineView component
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // State to toggle between 'grid' and 'timeline'
  const [groupedAlbums, setGroupedAlbums] = useState({}); // State to hold albums grouped by year/month

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
      .order("created_at", { ascending: false }); // Order by newest first for timeline

    if (error) {
      console.error("Error fetching albums:", error.message);
    } else {
      setAlbums(albumsData);

      // Process and group albums for the Timeline View
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const grouped = albumsData.reduce((acc, album) => {
        const date = new Date(album.created_at);
        const year = date.getFullYear();
        const month = months[date.getMonth()];

        acc[year] = acc[year] || {};
        acc[year][month] = acc[year][month] || [];
        acc[year][month].push(album);

        return acc;
      }, {});
      setGroupedAlbums(grouped); // Store the grouped data
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
      <Navbar />
      <div className="container mx-auto p-6 font-inter">
        {/* Stats */}
        <section className="mb-8">
          <p className="text-gray-700 text-lg">
            You have <span className="font-semibold">{albums.length}</span>{" "}
            albums saved.
          </p>

          {/* Toggle buttons for Grid and Timeline views */}
          <div className="mt-4 flex items-center space-x-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                viewMode === "grid"
                  ? "bg-pink-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                viewMode === "timeline"
                  ? "bg-pink-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Timeline View
            </button>
          </div>
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

        {/* Conditional rendering of views */}
        <section>
          {loading ? (
            <p className="text-center text-gray-500">Loading albums...</p>
          ) : albums.length === 0 ? (
            <p className="text-center text-gray-500">
              No albums yet. Create your first one!
            </p>
          ) : viewMode === "grid" ? ( // Render Grid View
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          ) : (
            // Render Timeline View
            <TimelineView groupedAlbums={groupedAlbums} />
          )}
        </section>

        {/* Upload Modal */}
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
