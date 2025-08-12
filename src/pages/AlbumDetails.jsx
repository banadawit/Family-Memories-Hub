import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import MemoryCard from "../components/MemoryCard";
import AddMoreToAlbumModal from "../components/AddMoreToAlbumModal";
import LightboxModal from "../components/LightboxModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import useDebounce from "../hooks/useDebounce";
import { useAuth } from "../context/AuthContext";

export default function AlbumDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [album, setAlbum] = useState(null);
  const [memories, setMemories] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true); // For initial album data and contributors
  const [memoriesLoading, setMemoriesLoading] = useState(false); // For memories section only
  const [error, setError] = useState(null);
  const [showAddMoreModal, setShowAddMoreModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  
  // This state will dynamically track the current theme from the document element
  const [isCurrentThemeDark, setIsCurrentThemeDark] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Effect to listen for changes in the 'dark' class on the document element
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsCurrentThemeDark(isDark);
      console.log("AlbumDetails: Detected theme change to dark mode?", isDark); // Debugging log
    });

    // Observe changes to the 'class' attribute of the <html> element
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Set initial state based on current class when component mounts
    setIsCurrentThemeDark(document.documentElement.classList.contains('dark'));

    // Cleanup the observer when the component unmounts
    return () => observer.disconnect();
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  const openDeleteModal = (memory) => {
    setMemoryToDelete(memory);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!memoryToDelete) return;

    try {
      const { error: dbError } = await supabase
        .from("memories")
        .delete()
        .eq("id", memoryToDelete.id);
      if (dbError) throw dbError;

      const { error: storageError } = await supabase.storage
        .from("family-memories")
        .remove([memoryToDelete.media_path]);
      if (storageError) throw storageError;

      setMemories(memories.filter((mem) => mem.id !== memoryToDelete.id));
      setShowDeleteModal(false);
      setMemoryToDelete(null);
    } catch (err) {
      console.error("Error deleting memory:", err.message);
    }
  };

  const handleMemoryClick = (memory) => {
    setSelectedMemory(memory);
    setShowLightbox(true);
  };
  
  // Function to fetch only memories based on filters
  const fetchMemories = useCallback(async () => {
    setMemoriesLoading(true);
    setError(null);

    let memoriesQuery = supabase
      .from("memories")
      .select(`id, title, description, media_path, media_type, created_at, uploaded_by`)
      .eq("album_id", id);
      
    if (debouncedSearchQuery.trim()) {
      memoriesQuery = memoriesQuery.ilike('title', `%${debouncedSearchQuery}%`);
    }

    if (selectedYear || selectedMonth || selectedDay) {
      const yearToFilter = selectedYear || new Date().getFullYear();
      let startOfPeriod, endOfPeriod;
      
      if (selectedDay && selectedMonth) {
        const monthIndex = new Date(Date.parse(selectedMonth + " 1, " + yearToFilter)).getMonth();
        const dayToFilter = parseInt(selectedDay, 10);
        startOfPeriod = new Date(yearToFilter, monthIndex, dayToFilter).toISOString();
        endOfPeriod = new Date(yearToFilter, monthIndex, dayToFilter, 23, 59, 59, 999).toISOString();
      } else if (selectedMonth) {
        const monthIndex = new Date(Date.parse(selectedMonth + " 1, " + yearToFilter)).getMonth();
        startOfPeriod = new Date(yearToFilter, monthIndex, 1).toISOString();
        endOfPeriod = new Date(yearToFilter, monthIndex + 1, 0, 23, 59, 59, 999).toISOString();
      } else if (selectedYear) {
        startOfPeriod = new Date(yearToFilter, 0, 1).toISOString();
        endOfPeriod = new Date(yearToFilter, 11, 31, 23, 59, 59, 999).toISOString();
      }
      memoriesQuery = memoriesQuery.gte('created_at', startOfPeriod).lte('created_at', endOfPeriod);
    }

    const { data: memoriesData, error: fetchError } = await memoriesQuery.order("created_at", { ascending: false });
    
    if (fetchError) {
      console.error("Error fetching memories:", fetchError.message);
      setMemories([]);
      setError(fetchError.message);
    } else {
      if (memoriesData && memoriesData.length > 0) {
        const signedMemories = await Promise.all(
          memoriesData.map(async (memory) => {
            const { data: signedData, error: signedUrlError } =
              await supabase.storage
                .from("family-memories")
                .createSignedUrl(memory.media_path, 60 * 60);

            if (signedUrlError) {
              console.error(`Error creating signed URL for ${memory.media_path}:`, signedUrlError);
              return { ...memory, media_url: null };
            }
            return { ...memory, media_url: signedData.signedUrl };
          })
        );
        setMemories(signedMemories);
      } else {
        setMemories([]);
      }
    }
    setMemoriesLoading(false);
  }, [id, debouncedSearchQuery, selectedMonth, selectedYear, selectedDay]); // Dependencies for useCallback

  // Function to fetch album details (runs once per album ID)
  const fetchAlbumDetails = useCallback(async () => {
    setLoading(true); // Keep this true until album details are fetched
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("albums")
      .select(`id, title, description, event_tag, created_at, uploaded_by`) // Select uploaded_by for canDelete logic
      .eq("id", id)
      .single();
    
    if (fetchError || !data) {
      setError(fetchError?.message || "Album not found.");
      navigate("/404"); // Navigate away if album not found
      setLoading(false); // Set loading to false even on error/not found
      return;
    }
    setAlbum(data);
    setLoading(false); // Set loading to false once album details are available
  }, [id, navigate]);

  // Function to fetch contributors (runs once per album ID)
  const fetchContributors = useCallback(async () => {
    if (!id) return;

    const { data: memoriesData, error } = await supabase
      .from("memories")
      .select("uploaded_by")
      .eq("album_id", id)
      .not("uploaded_by", "is", null);

    if (error) {
      console.error("Error fetching contributor IDs:", error);
      return;
    }

    const uniqueUserIds = [...new Set(memoriesData.map((m) => m.uploaded_by))];

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", uniqueUserIds);

    if (profilesError) {
      console.error("Error fetching contributors:", profilesError);
    } else {
      const signedContributors = await Promise.all(
        profilesData.map(async (profile) => {
          if (profile.avatar_url) {
            const { data: signedData, error: signedUrlError } =
              await supabase.storage
                .from("family-memories")
                .createSignedUrl(profile.avatar_url, 3600);

            if (signedUrlError) {
              console.error(`Error signing avatar URL for ${profile.full_name}:`, signedUrlError);
              return { ...profile, avatar_url: null };
            }
            return { ...profile, avatar_url: signedData.signedUrl };
          }
          return profile;
        })
      );
      setContributors(signedContributors);
    }
  }, [id]);

  // Effect for initial album details and contributors fetch
  useEffect(() => {
    if (id) {
      fetchAlbumDetails();
      fetchContributors();
    }
  }, [id, fetchAlbumDetails, fetchContributors]); // Run only when ID or fetch functions change

  // Effect for memories fetch (triggered by search/filter changes)
  useEffect(() => {
    if (id) {
      fetchMemories();
    }
  }, [id, fetchMemories]); // Run when ID or fetchMemories (due to its dependencies) changes

  // Handle initial loading and errors for the overall page structure
  if (loading)
    return (
      <div className={`min-h-screen flex items-center justify-center font-inter transition-colors duration-200 ${isCurrentThemeDark ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-gray-300' : 'bg-gradient-to-b from-pink-50 to-white text-gray-700'}`}>
        Loading album details...
      </div>
    );
  if (error)
    return (
      <div className={`min-h-screen flex items-center justify-center font-inter transition-colors duration-200 ${isCurrentThemeDark ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-red-400' : 'bg-gradient-to-b from-pink-50 to-white text-red-500'}`}>
        Error: {error}
      </div>
    );
  if (!album) // This case should ideally be caught by the error handling in fetchAlbumDetails
    return (
      <div className={`min-h-screen flex items-center justify-center font-inter transition-colors duration-200 ${isCurrentThemeDark ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-gray-400' : 'bg-gradient-to-b from-pink-50 to-white text-gray-500'}`}>
        Album not found.
      </div>
    );

  const months = [
    "January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December",
  ];
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const daysInMonth = (month, year) => {
    if (!month || !year) return [];
    return Array.from({ length: new Date(year, months.indexOf(month) + 1, 0).getDate() }, (_, i) => i + 1);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isCurrentThemeDark ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-pink-50 to-white'}`}>
      <Navbar />
      <div className="container mx-auto p-4 md:p-6 font-inter">
        {/* Debugging Theme Indicator */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Current Theme: <span className="font-semibold">{isCurrentThemeDark ? "Dark" : "Light"}</span>
        </p>

        <button
          onClick={() => navigate(-1)}
          className={`mb-4 px-4 py-2 rounded-lg transition-colors ${isCurrentThemeDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          &larr; Back
        </button>

        {/* Album Details (always visible after initial load) */}
        <h1 className={`text-4xl font-bold mb-2 ${isCurrentThemeDark ? 'text-pink-400' : 'text-pink-700'}`}>
          {album.title}
        </h1>
        {album.description && (
          <p className={`mt-2 text-lg mb-4 ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {album.description}
          </p>
        )}
        {album.event_tag && (
          <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full mb-4 ${isCurrentThemeDark ? 'bg-gray-700 text-pink-400' : 'bg-pink-100 text-pink-700'}`}>
            #{album.event_tag}
          </span>
        )}

        {contributors.length > 0 && (
          <div className="my-6">
            <h3 className={`text-lg font-semibold mb-2 ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-800'}`}>
              Contributors:
            </h3>
            <div className="flex flex-wrap gap-2">
              {contributors.map((contributor) => (
                <Link
                  to={`/profile/${contributor.id}`}
                  key={contributor.id}
                  className={`flex items-center space-x-2 p-2 rounded-full transition ${isCurrentThemeDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {contributor.avatar_url ? (
                    <img
                      src={contributor.avatar_url}
                      alt={contributor.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${isCurrentThemeDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-300 text-gray-600'}`}>
                      {contributor.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`text-sm font-medium ${isCurrentThemeDark ? 'text-pink-400' : 'text-pink-700'}`}>
                    {contributor.full_name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className={`text-sm italic mb-6 ${isCurrentThemeDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Created on {new Date(album.created_at).toLocaleDateString()}
        </p>

        {user && (
          <div className="mb-6">
            <button
              onClick={() => setShowAddMoreModal(true)}
              className={`px-5 py-3 rounded-lg shadow-lg transition-colors flex items-center gap-2 ${isCurrentThemeDark ? 'bg-pink-600 hover:bg-pink-700' : 'bg-pink-500 hover:bg-pink-600'} text-white`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add More Memories
            </button>
          </div>
        )}
        
        {/* Search and Filter Section */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`p-2 border rounded-lg focus:ring-2 ${isCurrentThemeDark ? 'bg-gray-700 border-gray-600 focus:ring-pink-500 text-white' : 'bg-white border-gray-300 focus:ring-pink-500'}`}
          />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className={`p-2 border rounded-lg focus:ring-2 ${isCurrentThemeDark ? 'bg-gray-700 border-gray-600 focus:ring-pink-500 text-white' : 'bg-white border-gray-300 focus:ring-pink-500'}`}
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={`p-2 border rounded-lg focus:ring-2 ${isCurrentThemeDark ? 'bg-gray-700 border-gray-600 focus:ring-pink-500 text-white' : 'bg-white border-gray-300 focus:ring-pink-500'}`}
          >
            <option value="">All Months</option>
            {months.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className={`p-2 border rounded-lg focus:ring-2 ${isCurrentThemeDark ? 'bg-gray-700 border-gray-600 focus:ring-pink-500 text-white' : 'bg-white border-gray-300 focus:ring-pink-500'}`}
          >
            <option value="">All Days</option>
            {daysInMonth(selectedMonth, selectedYear).map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>

        <h2 className={`text-2xl font-semibold mb-4 ${isCurrentThemeDark ? 'text-pink-400' : 'text-pink-700'}`}>
          Memories ({memories.length})
        </h2>
        {memoriesLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isCurrentThemeDark ? 'border-pink-400' : 'border-pink-500'}`}></div>
          </div>
        ) : memories.length === 0 ? (
          <div className={`text-center py-12 rounded-lg ${isCurrentThemeDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 mx-auto mb-4 ${isCurrentThemeDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className={`text-lg font-medium ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-500'}`}>No memories found</h3>
            {user && (
              <button
                onClick={() => setShowAddMoreModal(true)}
                className={`mt-4 px-4 py-2 rounded-lg text-sm ${isCurrentThemeDark ? 'bg-pink-600 hover:bg-pink-700' : 'bg-pink-500 hover:bg-pink-600'} text-white`}
              >
                Add First Memory
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {memories.map((memory) => (
              <div
                key={memory.id}
                onClick={() => handleMemoryClick(memory)}
                className="cursor-pointer"
              >
                <MemoryCard
                  memory={memory}
                  onDelete={() => openDeleteModal(memory)}
                  darkMode={isCurrentThemeDark}
                  canDelete={user && (user.id === memory.uploaded_by || user.id === album.uploaded_by)}
                />
              </div>
            ))}
          </div>
        )}

        {showAddMoreModal && (
          <AddMoreToAlbumModal
            albumId={album.id}
            onClose={() => setShowAddMoreModal(false)}
            onUpload={fetchMemories} // Call fetchMemories to refresh the list
            darkMode={isCurrentThemeDark}
          />
        )}

        {showLightbox && (
          <LightboxModal
            memory={selectedMemory}
            onClose={() => setShowLightbox(false)}
            darkMode={isCurrentThemeDark}
          />
        )}
        {showDeleteModal && (
          <DeleteConfirmationModal
            onConfirm={confirmDelete}
            onCancel={() => setShowDeleteModal(false)}
            darkMode={isCurrentThemeDark}
            itemName={memoryToDelete?.title || "this memory"}
          />
        )}
      </div>
    </div>
  );
}
