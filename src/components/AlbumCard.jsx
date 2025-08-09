// src/components/AlbumCard.jsx
import { Link } from "react-router-dom"; // You'll need react-router-dom

const AlbumCard = ({ album }) => {
  // Assuming the `memories` field contains a count from the Supabase query
  const memoryCount = album.memories?.[0]?.count || 0;

  // You would fetch a cover photo for the album here
  // For now, we'll use a placeholder
  const coverUrl = "https://placehold.co/600x400/E5E7EB/6B7280?text=Album";

  return (
    <Link to={`/album/${album.id}`}>
      <div className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer bg-white relative">
        <img
          src={coverUrl}
          alt={album.title}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 bg-pink-600 text-white text-xs px-2 py-1 rounded-full">
          {memoryCount} memories
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-pink-700">{album.title}</h3>
          <p className="text-gray-600 text-sm truncate">{album.description}</p>
        </div>
      </div>
    </Link>
  );
};

export default AlbumCard;
