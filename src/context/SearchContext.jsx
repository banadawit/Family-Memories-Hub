import { createContext, useContext, useState } from "react";

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState(null); // Can be a Date object

  return (
    <SearchContext.Provider
      value={{ searchQuery, setSearchQuery, filterDate, setFilterDate }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => useContext(SearchContext);
