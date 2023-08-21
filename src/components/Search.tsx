import { useEffect, useState } from "react";
import { getLibraries, useSearch } from "../api";
import { HoldingStatus } from "@heekkr/heekkr/heekkr/holding_pb";
import { Library } from "@heekkr/heekkr/heekkr/library_pb";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import classNames from "classnames";

export interface SearchProps {
  keyword: string;
  libraryIds: string[];
}

const Status = ({
  status,
}: {
  status: HoldingStatus | undefined;
}): React.ReactElement => {
  if (status === undefined) {
    return <></>;
  }
  const common = classNames("ml-2 px-2 rounded-md text-white");
  switch (status.getStateOneofCase()) {
    case HoldingStatus.StateOneofCase.STATE_ONEOF_NOT_SET:
      return <></>;
    case HoldingStatus.StateOneofCase.AVAILABLE: {
      const detail = status.getAvailable()?.getDetail();
      const detailElem = detail && (
        <span className="ml-1 text-sm">({detail})</span>
      );
      return (
        <p className={classNames("bg-blue-600", common)}>
          대출가능{detailElem}
        </p>
      );
    }
    case HoldingStatus.StateOneofCase.ON_LOAN: {
      const due = status.getOnLoan()?.getDue()?.getDate();
      const dueElem =
        due != null ? (
          <span className="ml-1 text-sm">
            ..(
            {[
              due.getYear(),
              due.getMonth().toString().padStart(2, "0"),
              due.getDay().toString().padStart(2, "0"),
            ].join("-")}
            )
          </span>
        ) : (
          false
        );
      return (
        <p className={classNames("bg-orange-600", common)}>대출중{dueElem}</p>
      );
    }
    case HoldingStatus.StateOneofCase.UNAVAILABLE: {
      const detail = status.getUnavailable()?.getDetail();
      const detailElem = detail && (
        <span className="ml-1 text-sm">({detail})</span>
      );
      return (
        <p className={classNames("bg-slate-600", common)}>
          대출불가{detailElem}
        </p>
      );
    }
  }
};

const Search = ({ keyword, libraryIds }: SearchProps): React.ReactElement => {
  const state = useSearch({ keyword, libraryIds });
  const [libraries, setLibraries] = useState<Library[]>([]);

  useEffect(() => {
    const load = async () => {
      const libraries = await getLibraries();
      setLibraries(libraries);
    };
    load();
  }, []);

  if (state.state === "error") {
    return <p>에러가 발생했습니다.</p>;
  }
  if (state.state === "loading") {
    return <p>로딩 중...</p>;
  }

  const result = state.result;

  const maxScore = Math.max(0.0001, ...result.map(([, e]) => e.getScore()));
  const opacity = (score: number): number => score / maxScore;

  return (
    <ul role="list" className="divide-y divide-gray-100">
      {result.flatMap(([id, entity]) => {
        const book = entity.getBook();
        if (book == null) {
          return;
        }
        const title = book.getTitle() ?? "";
        const author = book.getAuthor();
        const publisher = book.getPublisher();
        const publishDate = book.getPublishDate();
        return (
          <li key={id}>
            <a
              href={entity.getUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-between gap-x-6 py-5"
            >
              <div className="flex min-w-0 gap-x-4">
                <div
                  className="bg-slate-900 w-1 h-full rounded-md"
                  style={{ opacity: opacity(entity.getScore()) }}
                />
                <div>
                  <h3 dangerouslySetInnerHTML={{ __html: title }} />
                  <p dangerouslySetInnerHTML={{ __html: author }} />
                  <p>
                    <span dangerouslySetInnerHTML={{ __html: publisher }} />
                    {publishDate && (
                      <span className="ml-1">{`(${publishDate.getYear()})`}</span>
                    )}
                  </p>
                  <ul role="list">
                    {entity.getHoldingSummariesList().map((holding) => (
                      <li
                        key={[
                          holding.getLibraryId(),
                          holding.getLocation(),
                        ].join("/")}
                        className="flex flex-row gap-x-2"
                      >
                        <p>
                          {libraries
                            .filter((l) => l.getId() === holding.getLibraryId())
                            .map((l) => l.getName())
                            .join(" ")}
                        </p>
                        <p>{holding.getLocation()}</p>
                        <p>{holding.getCallNumber()}</p>
                        <Status status={holding.getStatus()} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex flex-col items-end justify-center">
                <ChevronRightIcon className="h-6 w-6 text-slate-300" />
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
};
export default Search;
