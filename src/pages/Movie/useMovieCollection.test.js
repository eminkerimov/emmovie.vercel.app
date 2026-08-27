import { act, renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import useMovieCollection from "./useMovieCollection";

jest.mock("axios");

const createDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
};

describe("useMovieCollection", () => {
  beforeEach(() => {
    axios.get.mockReset();
    axios.isCancel.mockReset();
    axios.isCancel.mockReturnValue(false);
  });

  it("does not request a collection when the movie has none", () => {
    const { result } = renderHook(() => useMovieCollection(null));

    expect(axios.get).not.toHaveBeenCalled();
    expect(result.current).toEqual({
      data: null,
      error: false,
      loading: false,
    });
  });

  it("aborts stale collection requests and exposes only current data", async () => {
    const firstRequest = createDeferred();
    const secondRequest = createDeferred();
    axios.get
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise);

    const { result, rerender } = renderHook(
      ({ collectionId }) => useMovieCollection(collectionId),
      { initialProps: { collectionId: 1 } }
    );
    const firstSignal = axios.get.mock.calls[0][1].signal;

    rerender({ collectionId: 2 });

    expect(firstSignal.aborted).toBe(true);
    expect(result.current.loading).toBe(true);

    await act(async () => {
      firstRequest.resolve({ data: { id: 1 } });
      secondRequest.resolve({ data: { id: 2 } });
      await Promise.all([firstRequest.promise, secondRequest.promise]);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ id: 2 });
  });

  it("keeps collection errors local to the optional request", async () => {
    const request = createDeferred();
    axios.get.mockImplementationOnce(() => request.promise);
    const { result } = renderHook(() => useMovieCollection(10));

    await act(async () => {
      request.reject(new Error("Collection unavailable"));

      try {
        await request.promise;
      } catch {
        // The hook converts the rejection into its public error state.
      }
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
