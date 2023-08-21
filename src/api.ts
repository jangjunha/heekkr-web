import { ApiClient } from "@heekkr/heekkr/heekkr/api_grpc_web_pb";
import {
  GetLibrariesRequest,
  SearchEntity,
  SearchRequest,
} from "@heekkr/heekkr/heekkr/api_pb";
import { Library } from "@heekkr/heekkr/heekkr/library_pb";
import { Status, StatusCode } from "grpc-web";
import { nanoid } from "nanoid";
import { useEffect, useReducer } from "react";

export const client = new ApiClient("https://api-7i77a4bd4q-du.a.run.app");

export const getLibraries = (keyword?: string): Promise<Library[]> =>
  new Promise((resolve, reject) => {
    const request = new GetLibrariesRequest();
    if (keyword) request.setKeyword(keyword);
    client.getLibraries(request, {}, (err, response) => {
      if (err != null) {
        console.error(err);
        reject(err);
        return;
      }
      resolve(response.getLibrariesList());
    });
  });

type FetchState<T> =
  | { state: "loading" }
  | { state: "streaming"; result: T }
  | { state: "done"; result: T }
  | { state: "error"; error: Status };

interface SearchParams {
  keyword: string;
  libraryIds: string[];
}

export const useSearch = ({ keyword, libraryIds }: SearchParams) => {
  type State = FetchState<[string, SearchEntity][]>;
  type Action =
    | { type: "initialize" }
    | { type: "data"; data: SearchEntity[] }
    | { type: "done" }
    | { type: "error"; error: Status };

  const [state, dispatch] = useReducer(
    (prevState: State, action: Action): State => {
      const process = (
        existing: [string, SearchEntity][],
        incoming: SearchEntity[]
      ): [string, SearchEntity][] =>
        [
          ...existing,
          ...incoming.map((e): [string, SearchEntity] => [nanoid(), e]),
        ].sort(([, a], [, b]) => b.getScore() - a.getScore());

      switch (action.type) {
        case "initialize":
          return { state: "loading" };

        case "data":
          switch (prevState.state) {
            case "loading":
              return {
                state: "streaming",
                result: process([], action.data),
              };
            case "streaming":
              return {
                state: "streaming",
                result: process(prevState.result, action.data),
              };
            case "done":
            case "error":
              return prevState;
          }
          break;

        case "done":
          switch (prevState.state) {
            case "streaming":
            case "done":
              return { state: "done", result: prevState.result };
            case "loading":
              return { state: "done", result: [] };
            case "error":
              return prevState;
          }
          break;

        case "error":
          return { state: "error", error: action.error };
      }
    },
    {
      state: "done",
      result: [],
    }
  );

  useEffect(() => {
    if (keyword === "" || libraryIds.length === 0) {
      return;
    }

    dispatch({ type: "initialize" });

    const request = new SearchRequest();
    request.setTerm(keyword);
    request.setLibraryIdsList(libraryIds);

    const stream = client.search(request, {});
    stream.on("data", (response): void => {
      dispatch({ type: "data", data: response.getEntitiesList() });
    });
    stream.on("status", (status): void => {
      if (status.code === StatusCode.OK) {
        dispatch({ type: "done" });
        return;
      }
      console.error("error", status.code, status.details);
      dispatch({ type: "error", error: status });
    });

    return () => stream.cancel();
  }, [keyword, libraryIds]);

  return state;
};
