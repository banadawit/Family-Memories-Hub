import React, { useEffect, useState } from "react";
import ReactionButtons from "./ReactionButtons";
import CommentSection from "./CommentSection";
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom"; // <-- Make sure to import Link

export default function LightboxModal({ memory, onClose, darkMode }) { // Added darkMode prop
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
      // Re-fetch tags to get the full_name for the newly added tag
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
      role="dialog" // Added for accessibility
      aria-modal="true" // Added for accessibility
      aria-label="Memory details lightbox" // Added for accessibility
    >
      <div
        // Main modal content container: now explicitly defines height and uses flex for its children
        className={`relative w-full max-w-full max-h-[95vh] h-[95vh] flex flex-col md:flex-row rounded-lg shadow-lg overflow-hidden
                   ${darkMode ? 'bg-gray-800' : 'bg-white'}`} // Dynamic background
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media Display Section */}
        <div 
          // On mobile (default), take 2/3 of the height; on medium screens and up, take 3/4 width and full height
          className="flex-shrink-0 w-full h-2/3 md:w-3/4 md:h-full flex items-center justify-center bg-black"
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 md:hidden text-white text-3xl font-bold bg-gray-800 bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center z-10 hover:bg-gray-700 transition"
            aria-label="Close modal" // Added for accessibility
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

        {/* Details and Interactions Section */}
        <div 
          // On mobile (default), take 1/3 of the height and be scrollable; on medium screens and up, take 1/4 width and full height
          className={`flex-shrink-0 w-full h-1/3 md:w-1/4 md:h-full p-4 flex flex-col overflow-y-auto
                       ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}> {/* Dynamic background and text */}
          <button
            onClick={onClose}
            className={`absolute top-2 right-2 hidden md:flex text-3xl font-bold rounded-full w-8 h-8 items-center justify-center z-10 transition
                       ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-200'}`} // Dynamic button style
            aria-label="Close modal" // Added for accessibility
          >
            &times;
          </button>

          <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-pink-400' : 'text-pink-700'}`}> {/* Dynamic text color */}
            {memory.title}
          </h3>
          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{memory.description}</p> {/* Dynamic text color */}

          {/* Tagging Section */}
          <div className="mb-4">
            <h4 className={`font-semibold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Tagged:</h4> {/* Dynamic text color */}
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No one is tagged yet.</p> // Dynamic text color
              ) : (
                tags.map((tag) => (
                  <Link // <-- Use Link instead of span
                    to={`/person/${tag.profile_id}`}
                    key={tag.profile_id}
                    className={`text-xs font-semibold px-2 py-1 rounded-full transition
                               ${darkMode ? 'bg-gray-700 text-pink-400 hover:bg-gray-600' : 'bg-pink-100 text-pink-700 hover:bg-pink-200'}`} // Dynamic tag style
                    onClick={onClose} // Close the modal when clicking a tag
                    aria-label={`View memories with ${tag.profiles?.full_name}`} // Added for accessibility
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
                  className={`text-sm px-3 py-1 rounded-full transition
                             ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} // Dynamic button style
                  aria-label="Toggle tagging menu" // Added for accessibility
                >
                  Add Tag
                </button>
                {showTaggingMenu && (
                  <div className={`absolute z-20 mt-1 w-full rounded-md shadow-lg p-2 max-h-48 overflow-y-auto border
                                 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}> {/* Dynamic menu background and border */}
                    {allProfiles.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => {
                          handleAddTag(profile.id);
                          setShowTaggingMenu(false);
                        }}
                        disabled={isTagged(profile.id)}
                        className={`w-full text-left px-2 py-1 text-sm rounded-md transition
                                   ${isTagged(profile.id)
                                     ? 'text-gray-400 cursor-not-allowed'
                                     : `${darkMode ? 'text-gray-100 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'}` // Dynamic text and hover
                                   }`}
                        aria-label={`Tag ${profile.full_name}`} // Added for accessibility
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
            <ReactionButtons memoryId={memory.id} darkMode={darkMode} /> {/* Pass darkMode prop */}
          </div>

          <div className="flex-grow mt-4">
            <CommentSection memoryId={memory.id} darkMode={darkMode} /> {/* Pass darkMode prop */}
          </div>
        </div>
      </div>
    </div>
  );
}
