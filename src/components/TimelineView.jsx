import AlbumCard from "./AlbumCard";

export default function TimelineView({ groupedAlbums, darkMode }) { // Added darkMode prop
  const years = Object.keys(groupedAlbums).sort((a, b) => b - a);

  return (
    <div className="space-y-12">
      {years.map((year) => (
        <div key={year}>
          <h2 className={`text-4xl font-bold pb-2 mb-6
                         ${darkMode ? 'text-pink-400 border-pink-600' : 'text-pink-800 border-pink-700'}
                         border-b-2`}> {/* Dynamic text and border colors */}
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
                className={`ml-8 relative border-l-2 pl-4 py-4
                           ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} 
              >
                <div className={`absolute -left-2 top-6 w-4 h-4 rounded-full border-2
                                 ${darkMode ? 'bg-pink-600 border-gray-800' : 'bg-pink-600 border-white'}`} /> {/* Dynamic border color */}
                <h3 className={`text-xl font-semibold mb-4
                               ${darkMode ? 'text-pink-400' : 'text-pink-700'}`}> {/* Dynamic text color */}
                  {month}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {groupedAlbums[year][month].map((album) => (
                    <AlbumCard key={album.id} album={album} darkMode={darkMode} /> 
                  ))}
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
