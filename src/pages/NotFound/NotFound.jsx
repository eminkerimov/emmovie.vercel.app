import React from "react";
import { Link } from "react-router-dom";
import "./NotFound.scss";

const NotFound = () => {
  return (
    <main className="not-found">
      <div className="page-container not-found__content">
        <span aria-hidden="true">404</span>
        <h1>Page not found</h1>
        <p>The page you requested does not exist or has been moved.</p>
        <Link to="/">Return home</Link>
      </div>
    </main>
  );
};

export default NotFound;
