import React, { lazy, Suspense, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import Footer from "./components/Footer/Footer";
import Loading from "./components/Loading/Loading";
import Navbar from "./components/Navbar/Navbar";
import { NotificationProvider } from "./context/NotificationContext";
import { WatchlistProvider } from "./context/WatchlistContext";
import ScrollToTop from "./helpers/ScrollToTop";

const Home = lazy(() => import("./pages/Home/Home"));
const Movie = lazy(() => import("./pages/Movie/Movie"));
const Movies = lazy(() => import("./pages/Movies/Movies"));
const Person = lazy(() => import("./pages/Person/Person"));
const Search = lazy(() => import("./pages/Search/Search"));
const Discover = lazy(() => import("./pages/Discover"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Collection = lazy(() => import("./pages/Collection"));
const Company = lazy(() => import("./pages/Company"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound"));

const getPageTitle = (pathname) => {
  if (pathname === "/") return "M-movie";
  if (pathname === "/discover") return "Discover | M-movie";
  if (pathname === "/watchlist") return "Watchlist | M-movie";
  if (pathname === "/calendar") return "Release Calendar | M-movie";
  if (pathname === "/search") return "Search | M-movie";
  if (pathname === "/movies") return "Movies | M-movie";
  if (pathname.startsWith("/movie/")) return "Movie Details | M-movie";
  if (pathname.startsWith("/person/")) return "Person Details | M-movie";
  if (pathname.startsWith("/collection/")) return "Collection | M-movie";
  if (pathname.startsWith("/company/")) return "Production Company | M-movie";

  return "Page Not Found | M-movie";
};

const AppContent = () => {
  const location = useLocation();
  const routeRef = useRef(null);
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    document.title = getPageTitle(location.pathname);

    if (previousPathRef.current !== location.pathname) {
      const frameId = window.requestAnimationFrame(() => {
        routeRef.current?.focus({ preventScroll: true });
      });

      previousPathRef.current = location.pathname;

      return () => window.cancelAnimationFrame(frameId);
    }

    return undefined;
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <ScrollToTop />
      <Navbar />

      <div className="app-shell__content">
        <ErrorBoundary resetKey={location.pathname}>
          <div
            ref={routeRef}
            className="app-route"
            key={location.pathname}
            tabIndex="-1"
          >
            <Suspense fallback={<Loading />}>
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/search" element={<Search />} />
                <Route path="/movies" element={<Movies />} />
                <Route path="/movie/:id" element={<Movie />} />
                <Route path="/person/:id" element={<Person />} />
                <Route path="/collection/:id" element={<Collection />} />
                <Route path="/company/:id" element={<Company />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </ErrorBoundary>
      </div>

      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <NotificationProvider>
        <WatchlistProvider>
          <AppContent />
        </WatchlistProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;
