const MemoryCard = ({ memory }) => {
  const isImage = memory.media_type === 'image';

  return (
    <div className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer bg-white">
      {isImage ? (
        <img
          src={memory.media_url}
          alt={memory.title}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
      ) : (
        <video controls className="w-full h-48 object-cover" preload="metadata">
          <source src={memory.media_url} type="video/mp4" />
          Sorry, your browser does not support embedded videos.
        </video>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-pink-700">{memory.title}</h3>
        <p className="text-gray-600 text-sm truncate">{memory.description}</p>
        <p className="text-xs mt-1 text-gray-400 italic">{new Date(memory.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
export default MemoryCard;