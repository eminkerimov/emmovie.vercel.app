import axios from "axios";
import React, { useState } from "react";
import { BASE_URL } from "../helpers/baseURL";

const useFetchMovies = () => {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const headers = {
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlODZmMmJiZjFjOGVlMjE2MGU5MGRmMjM2ZmFlZDQ3OCIsInN1YiI6IjYxODA0OTUyM2ZhYmEwMDA2MjUwMjAxNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.0wAkmq7kBxCyd1UbBghyEwQVf5JDMa2RA8069-lRq-0',
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
