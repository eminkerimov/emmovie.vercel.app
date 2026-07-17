import React from "react";

const DiscoverSection = ({
  genreOptions,
  discoverMode,
  discoverResults,
  discoverFilters,
  discoverLoading,
  onFilterChange,
  onSubmit,
  onClear,
  renderMovieCard,
}) => {
  return (
    <section className="home-discover">
      <div className="home-discover__header">
        <div>
          <span className="home-discover__label">Find Your Movie</span>
          <h2>Discover Movies</h2>
          <p>Filter movies by genre, year, rating and popularity.</p>
        </div>

        {discoverMode && (
          <button type="button" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      <form className="home-discover__form" onSubmit={onSubmit}>
        <select
          name="genre"
          value={discoverFilters.genre}
          onChange={onFilterChange}
        >
          <option value="">Any genre</option>

          {genreOptions.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>

        <input
          name="year"
          type="number"
          placeholder="Year"
          min="1900"
          max="2030"
          value={discoverFilters.year}
          onChange={onFilterChange}
        />

        <select
          name="rating"
          value={discoverFilters.rating}
          onChange={onFilterChange}
        >
          <option value="">Any rating</option>
          <option value="6">6+</option>
          <option value="7">7+</option>
          <option value="8">8+</option>
        </select>

        <select
          name="sort"
          value={discoverFilters.sort}
          onChange={onFilterChange}
        >
          <option value="popularity.desc">Most Popular</option>
          <option value="vote_average.desc">Top Rated</option>
          <option value="primary_release_date.desc">Newest</option>
          <option value="revenue.desc">Highest Revenue</option>
        </select>

        <button type="submit">
          {discoverLoading ? "Loading..." : "Discover"}
        </button>
      </form>

      {discoverMode && (
        <div className="home-discover__results">
          <h3 className="home-discover__title">Discovery Results</h3>

          {discoverResults.length > 0 ? (
            <div className="movie-container">
              {discoverResults.slice(0, 8).map(renderMovieCard)}
            </div>
          ) : (
            <div className="home-discover__empty">
              No movies found for these filters.
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default DiscoverSection;