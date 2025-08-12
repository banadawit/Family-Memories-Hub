import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import UploadModal from "../components/UploadModal";
import AlbumCard from "../components/AlbumCard";
import Navbar from "../components/Navbar";
import TimelineView from "../components/TimelineView";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../context/SearchContext";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    searchQuery,
    selectedMonth,
    selectedYear,
    selectedDay,
    setSelectedYear,
    setSelectedMonth,
    setSelectedDay,
  } = useSearch();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [groupedAlbums, setGroupedAlbums] = useState({});

  // This state will dynamically track the current theme from the document element
  const [isCurrentThemeDark, setIsCurrentThemeDark] = useState(false);

  // Effect to listen for changes in the 'dark' class on the document element
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsCurrentThemeDark(isDark);
      console.log("Home: Detected theme change to dark mode?", isDark); // Debugging log
    });

    // Observe changes to the 'class' attribute of the <html> element
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Set initial state based on current class when component mounts
    setIsCurrentThemeDark(document.documentElement.classList.contains("dark"));

    // Cleanup the observer when the component unmounts
    return () => observer.disconnect();
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  // States for album deletion
  const [showDeleteAlbumModal, setShowDeleteAlbumModal] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState(null);

  const openDeleteAlbumModal = (album) => {
    setAlbumToDelete(album);
    setShowDeleteAlbumModal(true);
  };

  const confirmDeleteAlbum = async () => {
    if (!albumToDelete) return;

    try {
      // 1. Fetch all memories associated with the album to get their media_paths
      const { data: memoriesData, error: memoriesError } = await supabase
        .from("memories")
        .select("media_path")
        .eq("album_id", albumToDelete.id);

      if (memoriesError) throw memoriesError;

      // 2. Delete files from storage
      if (memoriesData.length > 0) {
        const filePathsToDelete = memoriesData.map((m) => m.media_path);
        const { error: storageError } = await supabase.storage
          .from("family-memories")
          .remove(filePathsToDelete);
        if (storageError)
          console.error(
            "Error deleting album files from storage:",
            storageError.message
          );
      }

      // 3. Delete the album record
      const { error: albumError } = await supabase
        .from("albums")
        .delete()
        .eq("id", albumToDelete.id);

      if (albumError) throw albumError;

      // Update UI
      setAlbums(albums.filter((alb) => alb.id !== albumToDelete.id));
      setShowDeleteAlbumModal(false);
      setAlbumToDelete(null);
    } catch (err) {
      console.error("Error deleting album:", err.message);
    }
  };

  const fetchAlbums = async () => {
    setLoading(true);

    let query = supabase
      .from("albums")
      .select(
        `
        *,
        memories(count)
        `
      )
      .order("created_at", { ascending: false });

    if (searchQuery.trim()) {
      query = query.ilike("title", `%${searchQuery}%`);
    }

    if (selectedYear || selectedMonth || selectedDay) {
      const yearToFilter = selectedYear || new Date().getFullYear();
      let startOfPeriod, endOfPeriod;

      if (selectedDay && selectedMonth) {
        const monthIndex = new Date(
          Date.parse(selectedMonth + " 1, " + yearToFilter)
        ).getMonth();
        const dayToFilter = parseInt(selectedDay, 10);
        startOfPeriod = new Date(
          yearToFilter,
          monthIndex,
          dayToFilter
        ).toISOString();
        endOfPeriod = new Date(
          yearToFilter,
          monthIndex,
          dayToFilter,
          23,
          59,
          59,
          999
        ).toISOString();
      } else if (selectedMonth) {
        const monthIndex = new Date(
          Date.parse(selectedMonth + " 1, " + yearToFilter)
        ).getMonth();
        startOfPeriod = new Date(yearToFilter, monthIndex, 1).toISOString();
        endOfPeriod = new Date(
          yearToFilter,
          monthIndex + 1,
          0,
          23,
          59,
          59,
          999
        ).toISOString();
      } else if (selectedYear) {
        startOfPeriod = new Date(yearToFilter, 0, 1).toISOString();
        endOfPeriod = new Date(
          yearToFilter,
          11,
          31,
          23,
          59,
          59,
          999
        ).toISOString();
      }

      query = query
        .gte("created_at", startOfPeriod)
        .lte("created_at", endOfPeriod);
    }

    const { data: albumsData, error } = await query;

    if (error) {
      console.error("Error fetching albums:", error.message);
    } else {
      setAlbums(albumsData);

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
      setGroupedAlbums(grouped);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchAlbums();
    }
  }, [user, searchQuery, selectedMonth, selectedYear, selectedDay]);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-pink-50 dark:bg-gray-900 text-pink-700 dark:text-pink-400 font-inter">
        <p>Please log in to view family memories.</p>
      </div>
    );
  }

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
  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - i
  );
  const daysInMonth = (month, year) => {
    if (!month || !year) return [];
    return Array.from(
      { length: new Date(year, months.indexOf(month) + 1, 0).getDate() },
      (_, i) => i + 1
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <Navbar /> {/* Navbar controls the global 'dark' class */}
      <div className="container mx-auto p-4 md:p-6 font-inter">
        {/* Debugging Theme Indicator - useful for verifying the state change */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Current Theme:{" "}
          <span className="font-semibold">
            {isCurrentThemeDark ? "Dark" : "Light"}
          </span>
        </p>

        {/* Stats and Filters */}
        <section className="mb-8">
          <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
            You have{" "}
            <span className="font-semibold text-pink-600 dark:text-pink-400">
              {albums.length}
            </span>{" "}
            albums saved.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="p-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="p-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Months</option>
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>

              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="p-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Days</option>
                {daysInMonth(selectedMonth, selectedYear).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 ${
                  viewMode === "grid"
                    ? "bg-pink-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                Grid
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 ${
                  viewMode === "timeline"
                    ? "bg-pink-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Timeline
              </button>
            </div>
          </div>
        </section>

        {/* Create Album Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white px-5 py-3 rounded-lg shadow-lg transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Create New Album
          </button>
        </div>

        {/* Content Area */}
        <section>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 dark:border-pink-400"></div>
            </div>
          ) : albums.length === 0 ? (
            <div className="text-center py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
                No albums found
              </h3>
              <p className="mt-1 text-gray-400 dark:text-gray-500">
                Create your first album to get started
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Create Album
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {albums.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  onDeleteAlbum={openDeleteAlbumModal}
                  darkMode={isCurrentThemeDark} // Pass the dynamically updated dark mode state
                />
              ))}
            </div>
          ) : (
            <TimelineView
              groupedAlbums={groupedAlbums}
              darkMode={isCurrentThemeDark}
            />
          )}
        </section>

        {/* Modals */}
        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onUpload={fetchAlbums}
            darkMode={isCurrentThemeDark}
          />
        )}

        {showDeleteAlbumModal && (
          <DeleteConfirmationModal
            onConfirm={confirmDeleteAlbum}
            onCancel={() => setShowDeleteAlbumModal(false)}
            darkMode={isCurrentThemeDark}
            itemName={albumToDelete?.title || "this album"}
          />
        )}
      </div>
    </div>
  );
}
