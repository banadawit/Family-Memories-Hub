import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import MemoryCard from "../components/MemoryCard";
import AddMoreToAlbumModal from "../components/AddMoreToAlbumModal";
import LightboxModal from "../components/LightboxModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import Navbar from "../components/Navbar";
import AlbumCard from "../components/AlbumCard";
import { Link } from "react-router-dom";
import useDebounce from "../hooks/useDebounce";

export default function AlbumDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [memories, setMemories] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memoriesLoading, setMemoriesLoading] = useState(false); // New loading state
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

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

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
  
  // New function to handle fetching just the memories
  const fetchMemories = async () => {
    setMemoriesLoading(true);

    let query = supabase
      .from("albums")
      .select(`id, memories(*)`)
      .eq("id", id);
      
    if (debouncedSearchQuery.trim()) {
      query = supabase
        .from("albums")
        .select(`
          id,
          memories!inner(id, title, description, media_path, media_type, created_at)
        `)
        .eq("id", id)
        .ilike('memories.title', `%${debouncedSearchQuery}%`);
    }

    // Add filtering by date
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

      query = query.gte('memories.created_at', startOfPeriod).lte('memories.created_at', endOfPeriod);
    }

    const { data, error: fetchError } = await query.single();
    
    if (fetchError || !data) {
        setMemories([]);
    } else if (data.memories && data.memories.length > 0) {
      const signedMemories = await Promise.all(
        data.memories.map(async (memory) => {
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
      setMemories(signedMemories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } else {
      setMemories([]);
    }
    setMemoriesLoading(false);
  };
  
  const fetchContributors = async () => {
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
  };

  const fetchAlbumDetails = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("albums")
      .select(`id, title, description, event_tag, created_at, memories(*)`)
      .eq("id", id)
      .single();
    if (fetchError || !data) {
      setError(fetchError?.message || "Album not found.");
      setLoading(false);
      navigate("/404");
      return;
    }
    setAlbum(data);
    setLoading(false);
  };

  useEffect(() => {
    if (id) {
      fetchAlbumDetails(); // Fetch album details once
      fetchContributors(); // Fetch contributors once
    }
  }, [id]);
  
  useEffect(() => {
    if (id) {
      fetchMemories(); // Re-fetch memories on filter change
    }
  }, [id, debouncedSearchQuery, selectedMonth, selectedYear, selectedDay]);


  if (loading)
    return (
      <div className="text-center p-8 font-inter text-gray-700">
        Loading album...
      </div>
    );
  if (error)
    return (
      <div className="text-center p-8 font-inter text-red-500">
        Error: {error}
      </div>
    );
  if (!album)
    return (
      <div className="text-center p-8 font-inter text-gray-500">
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
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Navbar />
      <div className="container mx-auto p-4 font-inter">
        <button
          onClick={() => navigate("/")}
          className="mb-4 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200"
        >
          &larr; Back to Albums
        </button>

        <h1 className="text-4xl font-bold text-pink-700 mb-2">{album.title}</h1>
        {album.description && (
          <p className="text-gray-600 mt-2 text-lg mb-4">{album.description}</p>
        )}
        {album.event_tag && (
          <span className="inline-block bg-pink-100 text-pink-700 text-sm font-semibold px-3 py-1 rounded-full mb-4">
            #{album.event_tag}
          </span>
        )}

        {contributors.length > 0 && (
          <div className="my-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Contributors:
            </h3>
            <div className="flex flex-wrap items-center space-x-2">
              {contributors.map((contributor) => (
                <Link
                  to={`/profile/${contributor.id}`}
                  key={contributor.id}
                  className="flex items-center space-x-2 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                >
                  {contributor.avatar_url ? (
                    <img
                      src={contributor.avatar_url}
                      alt={contributor.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                      {contributor.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-pink-700">
                    {contributor.full_name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="text-gray-500 text-sm italic mb-6">
          Created on {new Date(album.created_at).toLocaleDateString()}
        </p>

        <div className="mb-6">
          <button
            onClick={() => setShowAddMoreModal(true)}
            className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-3 rounded-lg shadow-lg transition-colors duration-200"
          >
            + Add More Memories to Album
          </button>
        </div>
        
        {/* Search and Filter Section */}
        <div className="mb-6 flex space-x-4 items-center">
          <input
            type="text"
            placeholder="Search memories in this album..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow p-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
          />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
          >
            <option value="">All Months</option>
            {months.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
          >
            <option value="">All Days</option>
            {daysInMonth(selectedMonth, selectedYear).map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>


        <h2 className="text-2xl font-semibold text-pink-700 mb-4">
          Memories in this Album ({memories.length})
        </h2>
        {memoriesLoading ? (
          <p className="text-center p-8 font-inter text-gray-700">
            Loading memories...
          </p>
        ) : memories.length === 0 ? (
          <p className="text-center text-gray-500">
            No memories found in this album.
          </p>
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
                />
              </div>
            ))}
          </div>
        )}

        {showAddMoreModal && (
          <AddMoreToAlbumModal
            albumId={album.id}
            onClose={() => setShowAddMoreModal(false)}
            onUpload={fetchAlbumData}
          />
        )}

        {showLightbox && (
          <LightboxModal
            memory={selectedMemory}
            onClose={() => setShowLightbox(false)}
          />
        )}
        {showDeleteModal && (
          <DeleteConfirmationModal
            onConfirm={confirmDelete}
            onCancel={() => setShowDeleteModal(false)}
          />
        )}
      </div>
    </div>
  );
}