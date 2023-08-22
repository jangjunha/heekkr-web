import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { useState } from "react";

import LibraryFilter from "./components/LibraryFilter";
import Search from "./components/Search";
import { SearchParams, useSearch } from "./api";

const App = (): React.ReactElement => {
  const [keyword, setKeyword] = useState("");
  const [libraryIds, setLibraryIds] = useState<string[]>([]);

  const [searchParams, setSearchParams] = useState<SearchParams>({
    keyword: "",
    libraryIds: [],
  });
  const handleSearch = (): void => {
    setSearchParams({ keyword, libraryIds });
  };

  const state = useSearch(searchParams);

  return (
    <>
      <header className="flex items-baseline text-2xl sm:text-3xl">
        <p className="mr-3 text-gray-400">도서관 통합검색</p>
        <h1 className="font-bold text-gray-900">heek.kr</h1>
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
            {state.state === "loading" || state.state === "streaming" ? (
              <ArrowPathIcon className="animate-spin h-6 w-6 text-white" />
            ) : (
              "검색"
            )}
          </button>
        </div>
        <Search state={state} />
      </section>
    </>
  );
};

export default App;
