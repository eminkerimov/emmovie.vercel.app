import { useEffect, useState } from "react";
import axios from "axios";
import { API_KEY, BASE_URL } from "../../helpers/baseURL";

const createRequestState = (collectionId) => ({
  collectionId,
  data: null,
  loading: Boolean(collectionId),
  error: false,
});

const useMovieCollection = (collectionId) => {
  const [requestState, setRequestState] = useState(() =>
    createRequestState(collectionId)
  );

  useEffect(() => {
    if (!collectionId) {
      setRequestState(createRequestState(null));
      return undefined;
    }

    const controller = new AbortController();
    let isActive = true;

    setRequestState(createRequestState(collectionId));

    axios
      .get(
        `${BASE_URL}/collection/${collectionId}?${API_KEY}&language=en-US`,
        { signal: controller.signal }
      )
      .then((response) => {
        if (!isActive || controller.signal.aborted) return;

        setRequestState({
          collectionId,
          data: response.data,
          loading: false,
          error: false,
        });
      })
      .catch((error) => {
        if (
          !isActive ||
          controller.signal.aborted ||
          axios.isCancel(error)
        ) {
          return;
        }

        setRequestState({
          collectionId,
          data: null,
          loading: false,
          error,
        });
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [collectionId]);

  const isCurrentRequest = requestState.collectionId === collectionId;

  return {
    data: isCurrentRequest ? requestState.data : null,
    loading: isCurrentRequest ? requestState.loading : Boolean(collectionId),
    error: isCurrentRequest ? requestState.error : false,
  };
};

export default useMovieCollection;
