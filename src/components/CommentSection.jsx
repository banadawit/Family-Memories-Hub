// src/components/CommentSection.jsx
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // <-- Make sure to import Link

export default function CommentSection({ memoryId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (full_name, id) // <-- Make sure to select the user's ID
      `)
      .eq('memory_id', memoryId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error.message);
    } else {
      setComments(data);
    }
    setLoading(false);
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !memoryId) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          memory_id: memoryId,
          user_id: user.id,
          comment_text: newComment.trim()
        }]);

      if (error) throw error;
      
      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Error posting comment:", error.message);
    }
  };

  useEffect(() => {
    if (memoryId) {
      fetchComments();
    }
  }, [memoryId]);

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-pink-700 mb-4">Comments ({comments.length})</h3>
      
      <form onSubmit={handlePostComment} className="flex mb-6">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-grow border p-2 rounded-l-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          disabled={!user}
        />
        <button
          type="submit"
          className="bg-pink-600 text-white px-4 py-2 rounded-r-lg hover:bg-pink-700 transition"
          disabled={!user || !newComment.trim()}
        >
          Post
        </button>
      </form>
      
      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-500 text-center">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 text-center">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Link to={`/profile/${comment.profiles?.id}`} className="font-semibold text-pink-700 hover:underline">
                  {comment.profiles?.full_name || "Anonymous"}
                </Link>
                <span className="text-xs text-gray-400">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-800">{comment.comment_text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}