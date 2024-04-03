import axios from "axios";
import React, { useState } from "react";
import { BASE_URL } from "../helpers/baseURL";

const useFetchMovies = () => {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const headers = {
    Authorization: `Bearer ${process.env.REACT_APP_BEARER_TOKEN}`,
    accept: 'application/json'
  };

  const fetchData = async (method, url, params) => {
    try {
      setLoading(true);
      const response = await axios({
        method: method,
        url: BASE_URL + url,
        params: params,
        headers: headers
      });
      setData(response);
    } catch (error) {
      setError(error);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchData};
};

export default useFetchMovies;
