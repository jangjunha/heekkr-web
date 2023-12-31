import { useEffect, useState } from "react";
import { SearchEntity } from "@heekkr/heekkr/heekkr/api_pb";
import { HoldingStatus } from "@heekkr/heekkr/heekkr/holding_pb";
import { Library } from "@heekkr/heekkr/heekkr/library_pb";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import classNames from "classnames";

import { FetchState, getLibraries } from "../api";

export interface SearchProps {
  state: FetchState<[string, SearchEntity][]>;
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
            ..
            {[
              due.getYear(),
              due.getMonth().toString().padStart(2, "0"),
              due.getDay().toString().padStart(2, "0"),
            ].join("-")}
          </span>
        ) : (
          false
        );
      const requestsAvailable = status.getRequestsAvailable() && (
        <span className="ml-1 text-sm">(예약가능)</span>
      );
      return (
        <p className={classNames("bg-orange-600", common)}>
          대출중
          {dueElem}
          {requestsAvailable}
        </p>
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

const Search = ({ state }: SearchProps): React.ReactElement => {
  const [libraries, setLibraries] = useState<Library[]>([]);
  useEffect(() => {
    const load = async () => {
      const libraries = await getLibraries();
      setLibraries(libraries);
    };
    load();
  }, []);

  if (state.state === "error") {
    return <p className="my-4 text-slate-900">오류가 발생했습니다.</p>;
  }
  if (state.state === "loading") {
    return <p className="my-4 text-slate-900">로딩 중...</p>;
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
        const Inner = ({
          children,
        }: {
          children?: React.ReactNode;
        }): React.ReactElement =>
          entity.getUrl() != null ? (
            <a
              href={entity.getUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-between flex-1 gap-x-6"
            >
              {children}
              <div className="flex flex-col items-end justify-center">
                <ChevronRightIcon className="h-6 w-6 text-slate-300" />
              </div>
            </a>
          ) : (
            <>{children}</>
          );
        return (
          <li key={id} className="flex py-5">
            <Inner>
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
            </Inner>
          </li>
        );
      })}
    </ul>
  );
};
export default Search;
