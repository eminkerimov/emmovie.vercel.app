import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_URL } from "../helpers/baseURL";

const useFetchMovies = () => {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async (method, url, params) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setData(undefined);
    setLoading(true);
    setError(false);

    try {
      const response = await axios({
        method,
        url: BASE_URL + url,
        params,
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_BEARER_TOKEN}`,
          accept: "application/json",
        },
        signal: controller.signal,
      });

      if (
        requestId !== requestIdRef.current ||
        controller.signal.aborted
      ) {
        return undefined;
      }

      setData(response);
      return response;
    } catch (error) {
      if (
        requestId === requestIdRef.current &&
        !controller.signal.aborted &&
        !axios.isCancel(error)
      ) {
        setError(error);
      }

      return undefined;
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);

        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  return { data, loading, error, fetchData };
};

export default useFetchMovies;
