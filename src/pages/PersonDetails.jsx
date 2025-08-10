// src/pages/PersonDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar";
import MemoryCard from "../components/MemoryCard";

export default function PersonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPersonData() {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);

      // Step 1: Fetch the person's profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`full_name`)
        .eq("id", id)
        .single();

      if (profileError) {
        setError("Error fetching person's profile.");
        setLoading(false);
        return;
      }
      setPerson(profileData);

      // Step 2: Fetch all memories where this person is tagged
      const { data: tagsData, error: tagsError } = await supabase
        .from("tags")
        .select(
          `
          memory_id,
          memories (*)
        `
        )
        .eq("profile_id", id);

      if (tagsError) {
        setError("Error fetching tagged memories.");
        setLoading(false);
        return;
      }

      // Step 3: Extract and prepare the memories
      const taggedMemories = tagsData.map((tag) => tag.memories);
      const signedMemories = await Promise.all(
        taggedMemories.map(async (memory) => {
          const { data: signedData, error: signedUrlError } =
            await supabase.storage
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
    }
    fetchPersonData();
  }, [id]);

  if (loading)
    return (
      <div className="text-center p-8 font-inter text-gray-700">
        Loading memories...
      </div>
    );
  if (error)
    return (
      <div className="text-center p-8 font-inter text-red-500">
        Error: {error}
      </div>
    );
  if (!person)
    return (
      <div className="text-center p-8 font-inter text-gray-500">
        Person not found.
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Navbar />
      <div className="container mx-auto p-6 font-inter">
        <button
          onClick={() => navigate(-1)} // Go back to the previous page
          className="mb-4 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200"
        >
          &larr; Back
        </button>

        <h1 className="text-4xl font-bold text-pink-700 mb-2">
          Memories with {person.full_name}
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Showing all memories where {person.full_name} is tagged.
        </p>

        {memories.length === 0 ? (
          <p className="text-center text-gray-500">
            No memories found for {person.full_name}.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {memories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
