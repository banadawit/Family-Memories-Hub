import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import MemoryCard from "../components/MemoryCard";
import AddMoreToAlbumModal from "../components/AddMoreToAlbumModal";
import LightboxModal from "../components/LightboxModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

export default function AlbumDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddMoreModal, setShowAddMoreModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState(null);

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

  const fetchAlbumData = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("albums")
      .select(`*, memories(*)`)
      .eq("id", id)
      .single();

    if (fetchError || !data) {
      console.error("Error fetching album:", fetchError);
      setError(fetchError?.message || "Album not found.");
      setLoading(false);
      navigate("/404");
      return;
    }
    setAlbum(data);
    const signedMemories = await Promise.all(
      data.memories.map(async (memory) => {
        const { data: signedData, error: signedUrlError } = await supabase.storage
          .from("family-memories")
          .createSignedUrl(memory.media_path, 60 * 60);

        if (signedUrlError) {
          console.error(
            `Error creating signed URL for ${memory.media_path}:`,
            signedUrlError
          );
          return { ...memory, media_url: null };
        }
        return { ...memory, media_url: signedData.signedUrl };
      })
    );
    setMemories(
      signedMemories.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )
    );
    setLoading(false);
  };

  useEffect(() => {
    if (id) {
      fetchAlbumData();
    }
  }, [id]);

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

  return (
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

      <h2 className="text-2xl font-semibold text-pink-700 mb-4">
        Memories in this Album ({memories.length})
      </h2>
      {memories.length === 0 ? (
        <p className="text-center text-gray-500">
          No memories in this album yet. Add some!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {memories.map((memory) => (
            <div key={memory.id} onClick={() => handleMemoryClick(memory)} className="cursor-pointer">
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
  );
}