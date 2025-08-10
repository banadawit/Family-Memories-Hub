// src/components/TimelineView.jsx
import AlbumCard from "./AlbumCard";

export default function TimelineView({ groupedAlbums }) {
  const years = Object.keys(groupedAlbums).sort((a, b) => b - a);

  return (
    <div className="space-y-12">
      {years.map((year) => (
        <div key={year}>
          <h2 className="text-4xl font-bold text-pink-800 border-b-2 border-pink-700 pb-2 mb-6">
            {year}
          </h2>
          {Object.keys(groupedAlbums[year])
            .sort(
              (a, b) =>
                new Date(`${year}-${b}-01`) - new Date(`${year}-${a}-01`)
            )
            .map((month) => (
              <div
                key={`${year}-${month}`}
                className="ml-8 relative border-l-2 border-gray-200 pl-4 py-4"
              >
                <div className="absolute -left-2 top-6 w-4 h-4 bg-pink-600 rounded-full border-2 border-white" />
                <h3 className="text-xl font-semibold text-pink-700 mb-4">
                  {month}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {groupedAlbums[year][month].map((album) => (
                    <AlbumCard key={album.id} album={album} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
