import React from "react";
import { Link } from "react-router-dom";
import "./Footer.scss";

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="page-container app-footer__inner">
        <div className="app-footer__brand">
          <Link to="/" aria-label="M-movie home">
            <i className="fa-solid fa-film" aria-hidden="true"></i>
            <span>M-movie</span>
          </Link>
          <p>A cinematic movie discovery portfolio experience.</p>
        </div>

        <div className="app-footer__meta">
          <p>
            This product uses the TMDB API but is not endorsed or certified by
            TMDB.
          </p>
          <small>Frontend portfolio project built with React.</small>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
