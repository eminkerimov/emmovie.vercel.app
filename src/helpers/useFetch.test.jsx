import { act, renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import useFetch from "./useFetch";

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

const responseA = { data: { id: 1, title: "Movie A" }, status: 200 };
const responseB = { data: { id: 2, title: "Movie B" }, status: 200 };

describe("useFetch", () => {
  beforeEach(() => {
    axios.get.mockReset();
    axios.isCancel.mockReset();
    axios.isCancel.mockReturnValue(false);
  });

  it("does not expose data from URL A after changing to URL B", async () => {
    const requestA = createDeferred();
    const requestB = createDeferred();
    axios.get
      .mockImplementationOnce(() => requestA.promise)
      .mockImplementationOnce(() => requestB.promise);

    const { result, rerender } = renderHook(
      ({ url }) => useFetch(url),
      { initialProps: { url: "A" } }
    );

    const firstSignal = axios.get.mock.calls[0][1].signal;

    rerender({ url: "B" });

    expect(firstSignal.aborted).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);

    await act(async () => {
      requestA.resolve(responseA);
      await requestA.promise;
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);

    await act(async () => {
      requestB.resolve(responseB);
      await requestB.promise;
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toBe(responseB.data);
    expect(result.current.data).not.toBe(responseB);
    expect(result.current.error).toBe(false);
  });

  it("exposes an HTTP rejection without retaining response data", async () => {
    const failedRequest = createDeferred();
    const httpError = new Error("Request failed with status code 500");
    axios.get.mockImplementationOnce(() => failedRequest.promise);

    const { result } = renderHook(() => useFetch("550"));

    await act(async () => {
      failedRequest.reject(httpError);

      try {
        await failedRequest.promise;
      } catch {
        // The hook converts the rejected request into its public error state.
      }
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(httpError);
  });

  it("aborts the active request during effect cleanup", async () => {
    const pendingRequest = createDeferred();
    axios.get.mockImplementationOnce(() => pendingRequest.promise);

    const { unmount } = renderHook(() => useFetch("550"));
    const signal = axios.get.mock.calls[0][1].signal;

    expect(signal.aborted).toBe(false);

    unmount();

    expect(signal.aborted).toBe(true);

    await act(async () => {
      pendingRequest.resolve(responseA);
      await pendingRequest.promise;
    });
  });

  it("supports an alternate TMDB resource without changing existing callers", async () => {
    axios.get.mockResolvedValueOnce({
      data: { id: 42, name: "Series" },
      status: 200,
    });

    const { result } = renderHook(() => useFetch("42?language=en-US", "tv"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/tv/42?language=en-US"),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(result.current.data).toEqual({ id: 42, name: "Series" });
  });
});
