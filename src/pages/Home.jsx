import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import UploadModal from "../components/UploadModal";
import AlbumCard from "../components/AlbumCard";
import Navbar from "../components/Navbar";
import TimelineView from "../components/TimelineView";
import { useNavigate } from "react-router-dom";
import { useSearch } from '../context/SearchContext';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { searchQuery } = useSearch();
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [groupedAlbums, setGroupedAlbums] = useState({});

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
      query = query.ilike('title', `%${searchQuery}%`);
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

      query = query.gte('created_at', startOfPeriod).lte('created_at', endOfPeriod);
    }

    const { data: albumsData, error } = await query;

    if (error) {
      console.error("Error fetching albums:", error.message);
    } else {
      setAlbums(albumsData);

      const months = [
        "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December",
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
      <div className="flex justify-center items-center h-screen bg-pink-50 text-pink-700 font-inter">
        <p>Please log in to view family memories.</p>
      </div>
    );
  }

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
      <div className="container mx-auto p-6 font-inter">
        <section className="mb-8">
          <p className="text-gray-700 text-lg">
            You have <span className="font-semibold">{albums.length}</span> albums saved.
          </p>

          <div className="mt-4 flex items-center space-x-4">
            {/* Year filter dropdown */}
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
            
            {/* Month filter dropdown */}
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
            
            {/* Day filter dropdown */}
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
            
            <div className="flex items-center space-x-2">
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
          </div>
        </section>

        <div className="mb-6">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-3 rounded-lg shadow-lg transition-colors duration-200"
          >
            + Create New Album
          </button>
        </div>

        <section>
          {loading ? (
            <p className="text-center text-gray-500">Loading albums...</p>
          ) : albums.length === 0 ? (
            <p className="text-center text-gray-500">
              No albums found.
            </p>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          ) : (
            <TimelineView groupedAlbums={groupedAlbums} />
          )}
        </section>

        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onUpload={fetchAlbums}
          />
        )}
      </div>
    </div>
  );
}