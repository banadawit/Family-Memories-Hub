// src/components/ReactionButtons.jsx
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";

export default function ReactionButtons({ memoryId }) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState({}); // Use an object for easier access
  const [loading, setLoading] = useState(false);

  const fetchReactions = async () => {
    setLoading(true);
    // Fetch ALL reactions for this memory, without grouping at the API level
    const { data, error } = await supabase
      .from("reactions")
      .select("reaction_type")
      .eq("memory_id", memoryId);

    if (error) {
      console.error("Error fetching reactions:", error.message);
    } else {
      // Group and count the reactions on the client side
      const reactionsMap = data.reduce((acc, current) => {
        const type = current.reaction_type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      setReactions(reactionsMap);
    }
    setLoading(false);
  };

  const handleReaction = async (reactionType) => {
    if (!user || !memoryId) return;

    try {
      const { data: existingReaction } = await supabase
        .from("reactions")
        .select("*")
        .eq("memory_id", memoryId)
        .eq("user_id", user.id)
        .single();

      if (existingReaction) {
        await supabase.from("reactions").delete().eq("id", existingReaction.id);
      } else {
        await supabase
          .from("reactions")
          .insert([
            {
              memory_id: memoryId,
              user_id: user.id,
              reaction_type: reactionType,
            },
          ]);
      }

      fetchReactions();
    } catch (error) {
      console.error("Error handling reaction:", error.message);
    }
  };

  useEffect(() => {
    if (memoryId) {
      fetchReactions();
    }
  }, [memoryId]);

  return (
    <div className="flex space-x-2">
      {loading ? (
        <span className="text-gray-500 text-sm">Loading reactions...</span>
      ) : (
        <>
          <button
            onClick={() => handleReaction("heart")}
            className="flex items-center space-x-1 px-3 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
          >
            <span>❤️</span>
            <span className="text-sm">{reactions.heart || 0}</span>
          </button>
          <button
            onClick={() => handleReaction("laugh")}
            className="flex items-center space-x-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
          >
            <span>😂</span>
            <span className="text-sm">{reactions.laugh || 0}</span>
          </button>
          <button
            onClick={() => handleReaction("wow")}
            className="flex items-center space-x-1 px-3 py-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
          >
            <span>😲</span>
            <span className="text-sm">{reactions.wow || 0}</span>
          </button>
        </>
      )}
    </div>
  );
}
