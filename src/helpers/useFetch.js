import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "./baseURL";

const createRequestState = (requestKey) => ({
  requestKey,
  data: null,
  loading: true,
  error: false,
});

const useFetch = (url, resource = "movie") => {
  const requestKey = `${resource}/${url}`;
  const [requestState, setRequestState] = useState(() =>
    createRequestState(requestKey)
  );

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const fetchData = async () => {
      setRequestState(createRequestState(requestKey));

      try {
        const response = await axios.get(`${BASE_URL}/${resource}/${url}`, {
          signal: controller.signal,
        });

        if (!isActive || controller.signal.aborted) return;

        setRequestState({
          requestKey,
          data: response.data,
          loading: false,
          error: false,
        });
      } catch (error) {
        if (
          !isActive ||
          controller.signal.aborted ||
          axios.isCancel(error)
        ) {
          return;
        }

        setRequestState({
          requestKey,
          data: null,
          loading: false,
          error,
        });
      }
    };

    fetchData();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [requestKey, resource, url]);

  const isCurrentRequest = requestState.requestKey === requestKey;

  return {
    data: isCurrentRequest ? requestState.data : null,
    loading: isCurrentRequest ? requestState.loading : true,
    error: isCurrentRequest ? requestState.error : false,
  };
};

export default useFetch;
