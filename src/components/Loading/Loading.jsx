import React from "react";
import "./Loading.scss";

const Loading = () => {
  return (
    <div className="loading-spinner-container" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true">
        <span className="bounce1"></span>
        <span className="bounce2"></span>
        <span className="bounce3"></span>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
};

export default Loading;
