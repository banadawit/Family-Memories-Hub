import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import UploadModal from "../components/UploadModal";
import MemoryCard from "../components/MemoryCard";

export default function Home() {
  const { user, signOut } = useAuth();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchMemories();
  }, []);

  async function fetchMemories() {
    setLoading(true);
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      console.error("Error fetching memories:", error.message);
    } else {
      setMemories(data);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-pink-700">
          Welcome, {user.email.split("@")[0]} ❤️
        </h1>
        <button
          onClick={() => signOut()}
          className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 transition"
        >
          Logout
        </button>
      </header>

      {/* Stats */}
      <section className="mb-8">
        <p className="text-gray-700 text-lg">
          You have <span className="font-semibold">{memories.length}</span>{" "}
          memories saved.
        </p>
      </section>

      {/* Upload Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowUpload(true)}
          className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-3 rounded shadow-lg transition"
        >
          + Add New Memory
        </button>
      </div>

      {/* Memories Grid */}
      <section>
        {loading ? (
          <p className="text-center text-gray-500">Loading memories...</p>
        ) : memories.length === 0 ? (
          <p className="text-center text-gray-500">
            No memories yet. Add your first one!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {memories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        )}
      </section>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUpload={fetchMemories}
        />
      )}
    </div>
  );
}
