import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "./baseURL";

const createRequestState = (url) => ({
  url,
  data: null,
  loading: true,
  error: false,
});

const useFetch = (url) => {
  const [requestState, setRequestState] = useState(() =>
    createRequestState(url)
  );

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const fetchData = async () => {
      setRequestState(createRequestState(url));

      try {
        const response = await axios.get(BASE_URL + "/movie/" + url, {
          signal: controller.signal,
        });

        if (!isActive || controller.signal.aborted) return;

        setRequestState({
          url,
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
          url,
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
  }, [url]);

  const isCurrentRequest = requestState.url === url;

  return {
    data: isCurrentRequest ? requestState.data : null,
    loading: isCurrentRequest ? requestState.loading : true,
    error: isCurrentRequest ? requestState.error : false,
  };
};

export default useFetch;
