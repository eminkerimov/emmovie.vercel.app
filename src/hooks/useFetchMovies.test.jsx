import { act, renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import useFetchMovies from "./useFetchMovies";

jest.mock("axios");

const createDeferred = () => {
  let resolve;
  let reject;

  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
};

const responseA = {
  data: { results: [{ id: 1, title: "Movie A" }] },
  status: 200,
};
const responseB = {
  data: { results: [{ id: 2, title: "Movie B" }] },
  status: 200,
};

describe("useFetchMovies", () => {
  beforeEach(() => {
    axios.mockReset();
    axios.isCancel.mockReset();
    axios.isCancel.mockReturnValue(false);
  });

  it("keeps response B when the older response A resolves last", async () => {
    const requestA = createDeferred();
    const requestB = createDeferred();
    axios
      .mockImplementationOnce(() => requestA.promise)
      .mockImplementationOnce(() => requestB.promise);

    const { result } = renderHook(() => useFetchMovies());
    let fetchA;
    let fetchB;

    act(() => {
      fetchA = result.current.fetchData("GET", "/movie/A", { page: 1 });
    });
    act(() => {
      fetchB = result.current.fetchData("GET", "/movie/B", { page: 1 });
    });

    await act(async () => {
      requestB.resolve(responseB);
      await fetchB;
    });

    expect(result.current.data).toBe(responseB);
    expect(result.current.loading).toBe(false);

    await act(async () => {
      requestA.resolve(responseA);
      await fetchA;
    });

    expect(result.current.data).toBe(responseB);
    expect(result.current.error).toBe(false);
  });

  it("aborts the previous request before starting the next one", async () => {
    const requestA = createDeferred();
    const requestB = createDeferred();
    axios
      .mockImplementationOnce(() => requestA.promise)
      .mockImplementationOnce(() => requestB.promise);

    const { result } = renderHook(() => useFetchMovies());
    let fetchA;
    let fetchB;

    act(() => {
      fetchA = result.current.fetchData("GET", "/movie/A");
    });

    const firstSignal = axios.mock.calls[0][0].signal;
    expect(firstSignal.aborted).toBe(false);

    act(() => {
      fetchB = result.current.fetchData("GET", "/movie/B");
    });

    const secondSignal = axios.mock.calls[1][0].signal;
    expect(firstSignal.aborted).toBe(true);
    expect(secondSignal.aborted).toBe(false);

    await act(async () => {
      requestA.resolve(responseA);
      requestB.resolve(responseB);
      await Promise.all([fetchA, fetchB]);
    });
  });

  it("clears an earlier error when retrying and preserves AxiosResponse", async () => {
    const failedRequest = createDeferred();
    const retryRequest = createDeferred();
    const networkError = new Error("Network unavailable");
    axios
      .mockImplementationOnce(() => failedRequest.promise)
      .mockImplementationOnce(() => retryRequest.promise);

    const { result } = renderHook(() => useFetchMovies());
    let firstFetch;

    act(() => {
      firstFetch = result.current.fetchData("GET", "/search/movie", {
        query: "Dune",
      });
    });

    await act(async () => {
      failedRequest.reject(networkError);
      await firstFetch;
    });

    expect(result.current.error).toBe(networkError);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();

    let retryFetch;
    act(() => {
      retryFetch = result.current.fetchData("GET", "/search/movie", {
        query: "Dune",
      });
    });

    expect(result.current.error).toBe(false);
    expect(result.current.loading).toBe(true);

    await act(async () => {
      retryRequest.resolve(responseB);
      await retryFetch;
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe(false);
    expect(result.current.data).toBe(responseB);
  });

  it("aborts its active request when the consumer unmounts", async () => {
    const pendingRequest = createDeferred();
    axios.mockImplementationOnce(() => pendingRequest.promise);

    const { result, unmount } = renderHook(() => useFetchMovies());
    let fetchPromise;

    act(() => {
      fetchPromise = result.current.fetchData("GET", "/movie/550");
    });

    const signal = axios.mock.calls[0][0].signal;
    expect(signal.aborted).toBe(false);

    unmount();

    expect(signal.aborted).toBe(true);

    await act(async () => {
      pendingRequest.resolve(responseA);
      await fetchPromise;
    });
  });
});
