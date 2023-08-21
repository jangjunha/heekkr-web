import { useState } from "react";

import LibraryFilter from "./components/LibraryFilter";
import Search, { SearchProps } from "./components/Search";

const App = (): React.ReactElement => {
  const [keyword, setKeyword] = useState("");
  const [libraryIds, setLibraryIds] = useState<string[]>([]);

  const [searchParams, setSearchParams] = useState<SearchProps>({
    keyword: "",
    libraryIds: [],
  });
  const handleSearch = (): void => {
    setSearchParams({ keyword, libraryIds });
  };

  return (
    <>
      <header className="flex items-baseline">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">힉</h1>
        <p className="ml-3 text-gray-700">도서관 통합검색</p>
      </header>
      <LibraryFilter value={libraryIds} onChange={setLibraryIds} />
      <section>
        <div className="flex">
          <input
            type="text"
            placeholder="검색어를 입력하세요"
            value={keyword}
            onChange={(e): void => setKeyword(e.currentTarget.value)}
            onKeyDown={(e): void => {
              if (e.key == "Enter") {
                handleSearch();
              }
            }}
            className="border-slate-100 rounded-md flex-1 shadow-sm"
          />
          <button
            type="submit"
            onClick={handleSearch}
            disabled={libraryIds.length === 0}
            className="ml-2 px-4 bg-blue-700 [&:disabled]:bg-slate-200 text-white shadow-sm rounded-md"
          >
            검색
          </button>
        </div>
        <Search {...searchParams} />
      </section>
    </>
  );
};

export default App;
