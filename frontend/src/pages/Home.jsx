import { useEffect, useState } from "react";
import {
  getPopularMovies,
  searchMovies,
  getGenres,
  getMoviesByGenre
} from "../api";
import GenreSidebar from "../components/GenreSidebar";
import MovieSection from "../components/MovieSection";
import Pagination from "../components/Pagination";

function Home() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [title, setTitle] = useState("Films populaires du moment");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mode, setMode] = useState("popular");

  async function loadPopularMovies(newPage = 1) {
    try {
      setLoading(true);
      setError("");
      setMode("popular");

      const response = await getPopularMovies(newPage, 12);

      setMovies(response.data.results || []);
      setPage(response.data.page || newPage);
      setTotalPages(response.data.total_pages || 1);
      setTitle("Films populaires du moment");
    } catch {
      setError("Impossible de charger les films populaires.");
    } finally {
      setLoading(false);
    }
  }

  async function loadGenres() {
    try {
      const response = await getGenres();
      setGenres(response.data.genres || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSearch(event, newPage = 1) {
    if (event) event.preventDefault();

    const cleanedQuery = query.trim();

    if (!cleanedQuery) {
      setSelectedGenre(null);
      loadPopularMovies(1);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSelectedGenre(null);
      setMode("search");

      const response = await searchMovies(cleanedQuery, newPage, 12);

      setMovies(response.data.results || []);
      setPage(response.data.page || newPage);
      setTotalPages(response.data.total_pages || 1);
      setTitle(`Résultats pour "${cleanedQuery}"`);
    } catch {
      setError("Erreur pendant la recherche.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectGenre(genreId, newPage = 1) {
    setSelectedGenre(genreId);
    setQuery("");

    if (!genreId) {
      loadPopularMovies(1);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMode("genre");

      const response = await getMoviesByGenre(genreId, newPage, 12);

      setMovies(response.data.results || []);
      setPage(response.data.page || newPage);
      setTotalPages(response.data.total_pages || 1);

      const genre = genres.find((g) => g.id === genreId);
      setTitle(`Films du genre : ${genre?.name || ""}`);
    } catch {
      setError("Impossible de charger les films de ce genre.");
    } finally {
      setLoading(false);
    }
  }

  function changePage(newPage) {
    if (newPage < 1 || newPage > totalPages) return;

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (mode === "popular") loadPopularMovies(newPage);
    if (mode === "search") handleSearch(null, newPage);
    if (mode === "genre") handleSelectGenre(selectedGenre, newPage);
  }

  useEffect(() => {
    loadPopularMovies();
    loadGenres();
  }, []);

  return (
    <div className="home-layout">
      <GenreSidebar
        genres={genres}
        selectedGenre={selectedGenre}
        onSelectGenre={handleSelectGenre}
      />

      <section className="content">
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Rechercher un film..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <button type="submit">Rechercher</button>
        </form>

        {loading && <p className="info">Chargement...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <>
            <MovieSection title={title} movies={movies} />

            {movies.length === 0 && (
              <p className="empty-message">Aucun film trouvé.</p>
            )}

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={changePage}
            />
          </>
        )}
      </section>
    </div>
  );
}

export default Home;