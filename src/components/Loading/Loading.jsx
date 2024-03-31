import React, { useState } from 'react';
import './Loading.scss';

const Loading = () => {
  const [loading, setLoading] = useState(true);
  setTimeout(() => {
    setLoading(false);
  }, 3000);

  return (
    <div className="loading-spinner-container">
      {loading && (
        <div className="spinner">
          <div className="bounce1"></div>
          <div className="bounce2"></div>
          <div className="bounce3"></div>
        </div>
      )}
      {!loading && <div>Loading completed!</div>}
    </div>
  );
};

export default Loading;
