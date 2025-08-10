// src/components/LightboxModal.jsx
import React, { useEffect, useState } from "react";
import ReactionButtons from "./ReactionButtons";
import CommentSection from "./CommentSection";
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom"; // <-- Make sure to import Link

export default function LightboxModal({ memory, onClose }) {
  if (!memory) return null;

  const isImage = memory.media_type === "image";
  const [tags, setTags] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [showTaggingMenu, setShowTaggingMenu] = useState(false);

  useEffect(() => {
    async function fetchTagsAndProfiles() {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name");
      if (!profilesError) {
        setAllProfiles(profilesData);
      }

      const { data: tagsData, error: tagsError } = await supabase
        .from("tags")
        .select(
          `
          profile_id,
          profiles (full_name)
          `
        )
        .eq("memory_id", memory.id);
      if (!tagsError) {
        setTags(tagsData);
      }
    }
    fetchTagsAndProfiles();
  }, [memory.id]);

  const handleAddTag = async (profileId) => {
    const { error } = await supabase
      .from("tags")
      .insert([{ memory_id: memory.id, profile_id: profileId }]);
    if (error) {
      console.error("Error adding tag:", error);
    } else {
      const { data: newTagsData } = await supabase
        .from("tags")
        .select(`profile_id, profiles (full_name)`)
        .eq("memory_id", memory.id);
      setTags(newTagsData);
    }
  };

  const isTagged = (profileId) => {
    return tags.some((tag) => tag.profile_id === profileId);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 font-inter"
      onClick={onClose}
    >
      <div
        className="relative max-h-full max-w-full flex flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 md:w-3/4 max-h-[90vh] flex items-center justify-center bg-black">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 md:hidden text-white text-3xl font-bold bg-gray-800 bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center z-10 hover:bg-gray-700 transition"
          >
            &times;
          </button>
          {isImage ? (
            <img
              src={memory.media_url}
              alt={memory.title}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <video
              src={memory.media_url}
              controls
              autoPlay
              className="max-h-full max-w-full"
            >
              Sorry, your browser does not support this video.
            </video>
          )}
        </div>

        <div className="flex-shrink-0 md:w-1/4 p-4 overflow-y-auto max-h-[90vh] flex flex-col">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 md:block text-gray-800 text-3xl font-bold rounded-full w-8 h-8 flex items-center justify-center z-10 hover:bg-gray-200 transition"
          >
            &times;
          </button>

          <h3 className="text-xl font-semibold text-pink-700 mb-2">
            {memory.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4">{memory.description}</p>

          {/* Tagging Section */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 mb-2">Tagged:</h4>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.length === 0 ? (
                <p className="text-sm text-gray-500">No one is tagged yet.</p>
              ) : (
                tags.map((tag) => (
                  <Link // <-- Use Link instead of span
                    to={`/person/${tag.profile_id}`}
                    key={tag.profile_id}
                    className="bg-pink-100 text-pink-700 text-xs font-semibold px-2 py-1 rounded-full hover:bg-pink-200 transition"
                    onClick={onClose} // Close the modal when clicking a tag
                  >
                    {tag.profiles?.full_name}
                  </Link>
                ))
              )}
            </div>
            {allProfiles.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowTaggingMenu(!showTaggingMenu)}
                  className="bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded-full hover:bg-gray-300 transition"
                >
                  Add Tag
                </button>
                {showTaggingMenu && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg p-2 max-h-48 overflow-y-auto">
                    {allProfiles.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => {
                          handleAddTag(profile.id);
                          setShowTaggingMenu(false);
                        }}
                        disabled={isTagged(profile.id)}
                        className={`w-full text-left px-2 py-1 text-sm rounded-md transition ${
                          isTagged(profile.id)
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {profile.full_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-grow">
            <ReactionButtons memoryId={memory.id} />
          </div>

          <div className="flex-grow mt-4">
            <CommentSection memoryId={memory.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
