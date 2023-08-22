import { Library } from "@heekkr/heekkr/heekkr/library_pb";
import { useEffect, useMemo, useState } from "react";

import { maps } from "..";
import { getLibraries } from "../api";
import { useDebounce } from "usehooks-ts";
import { ArrowPathIcon } from "@heroicons/react/24/solid";

interface LibraryFilter {
  value?: string[];
  onChange?(value: string[]): void;
}

const LibraryFilter = ({
  value = [],
  onChange,
}: LibraryFilter): React.ReactElement => {
  const [spherical, setSpherical] =
    useState<typeof google.maps.geometry.spherical>();
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition>();

  const [keyword, setKeyword] = useState<string>("");
  const [libraries, setLibraries] = useState<Library[]>();

  useEffect(() => {
    const loadAsync = async () => {
      const { spherical } = (await maps.importLibrary(
        "geometry"
      )) as google.maps.GeometryLibrary;
      setSpherical(spherical);
    };
    loadAsync();

    window.navigator.geolocation.getCurrentPosition(setCurrentPosition);
  }, []);

  const debouncedKeyword = useDebounce(keyword, 200);
  useEffect(() => {
    const load = async () => {
      const libraries = await getLibraries(debouncedKeyword);
      setLibraries(libraries);
    };
    load();
  }, [debouncedKeyword]);

  const distances: [string, number][] = useMemo(() => {
    if (currentPosition == null || spherical == null) {
      return [];
    }
    return (libraries ?? [])
      .map((lib): [string, number] => {
        const coord = lib.getCoordinate();
        if (coord == null) {
          return [lib.getId(), Infinity];
        }
        return [
          lib.getId(),
          spherical.computeDistanceBetween(
            {
              lat: coord.getLatitude(),
              lng: coord.getLongitude(),
            },
            {
              lat: currentPosition.coords.latitude,
              lng: currentPosition.coords.longitude,
            }
          ),
        ];
      })
      .sort(([, a], [, b]) => a - b);
  }, [currentPosition, spherical, libraries]);

  const isKeywordEmpty = keyword.length === 0;
  const sortedLibraries = useMemo(
    () =>
      isKeywordEmpty
        ? libraries?.concat().sort((a, b) => {
            const distA =
              distances.findIndex(([id]) => id == a.getId()) ?? Infinity;
            const distB =
              distances.findIndex(([id]) => id == b.getId()) ?? Infinity;
            return distA - distB;
          })
        : libraries,
    [isKeywordEmpty, libraries, distances]
  );

  const selectByDistance = (distance: number): void => {
    const ids = distances
      .filter(([, dist]) => dist <= distance)
      .slice(0, 10)
      .map(([id]) => id);
    onChange?.(ids);
  };

  return (
    <section className="my-4 px-4 py-3 rounded-lg border border-slate-100 shadow-sm">
      <p className="text-slate-600 mb-2">
        <span className="font-bold ">도서관 선택</span>
        <span className="ml-4 text-sm">최대 10개</span>
      </p>
      <div className="mb-2 flex gap-x-4">
        <div>
          <input
            type="text"
            placeholder="도서관 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.currentTarget.value)}
            className="py-0 border-slate-100 shadow-sm rounded-md"
          />
        </div>
        {currentPosition && (
          <div className="flex items-center gap-2 [&>button]:bg-blue-600 [&>button]:px-2 [&>button]:rounded-md [&>button]:text-sm [&>button]:text-white">
            <button onClick={() => selectByDistance(500)}>500m</button>
            <button onClick={() => selectByDistance(1000)}>1km</button>
            <button onClick={() => selectByDistance(1500)}>1.5km</button>
            <button onClick={() => selectByDistance(3000)}>3km</button>
          </div>
        )}
      </div>
      {sortedLibraries == null ? (
        <div className="flex gap-2 justify-center items-center py-4 text-slate-500">
          <ArrowPathIcon className="animate-spin h-6 w-6" />
          <p>불러오는 중</p>
        </div>
      ) : (
        <ul
          role="list"
          className="grid lg:grid-cols-4 md:grid-cols-3 gap-x-4 max-h-[5.2em] overflow-scroll"
        >
          {sortedLibraries.map((lib) => (
            <li key={lib.getId()}>
              <label>
                <input
                  type="checkbox"
                  checked={value.includes(lib.getId())}
                  onChange={(e): void => {
                    if (e.currentTarget.checked) {
                      if (value.length >= 10) {
                        return;
                      }
                      onChange?.([...value, lib.getId()]);
                    } else {
                      onChange?.(value.filter((l) => l != lib.getId()));
                    }
                  }}
                  className="mr-1 border-slate-300 rounded-md"
                />
                {lib.getName()}
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
export default LibraryFilter;
