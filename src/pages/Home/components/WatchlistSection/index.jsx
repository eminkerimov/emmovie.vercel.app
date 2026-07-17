import React from "react";

const WatchlistSection = ({
  watchlist,
  visibleWatchlist,
  showAllWatchlist,
  onToggleShowAll,
  onClear,
  renderMovieCard,
}) => {
  return (
    <section className="home-watchlist" id="watchlist">
      <div className="home-watchlist__header">
        <div>
          <span className="home-watchlist__label">Saved Movies</span>
          <h2>My Watchlist</h2>
          <p>{watchlist.length} movies saved locally</p>
        </div>

        {watchlist.length > 0 && (
          <div className="home-watchlist__actions">
            {watchlist.length > 4 && (
              <button type="button" onClick={onToggleShowAll}>
                {showAllWatchlist ? "Show Less" : "View All"}
              </button>
            )}

            <button type="button" onClick={onClear}>
              Clear All
            </button>
          </div>
        )}
      </div>

      {watchlist.length > 0 ? (
        <div className="movie-container">
          {visibleWatchlist.map(renderMovieCard)}
        </div>
      ) : (
        <div className="home-watchlist__empty">
          <i className="fa-regular fa-heart"></i>
          <h3>No saved movies yet</h3>
          <p>Add movies using the heart button on any movie card.</p>
        </div>
      )}
    </section>
  );
};

export default WatchlistSection;