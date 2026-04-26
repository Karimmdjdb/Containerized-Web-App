import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getMovieDetails,
  getMovieRecommendations
} from "../api";
import MovieSection from "../components/MovieSection";
import {
  isFavorite,
  toggleFavorite
} from "../favorites";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

function MovieDetails() {
  const { id } = useParams();

  const [movie, setMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function handleToggleFavorite() {
    const newFavoriteState = toggleFavorite(movie);
    setFavorite(newFavoriteState);
  }

  useEffect(() => {
    async function loadMovie() {
      try {
        setLoading(true);
        setError("");

        const detailsResponse = await getMovieDetails(id);
        const recommendationsResponse = await getMovieRecommendations(id, 12);

        setMovie(detailsResponse.data);
        setRecommendations(recommendationsResponse.data.results || []);
        setFavorite(isFavorite(id));
      } catch {
        setError("Impossible de charger les détails du film.");
      } finally {
        setLoading(false);
      }
    }

    loadMovie();
  }, [id]);

  if (loading) return <p className="info">Chargement...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!movie) return <p className="error">Film introuvable.</p>;

  const poster = movie.poster_path
    ? `${IMAGE_BASE_URL}${movie.poster_path}`
    : null;

  return (
    <div className="details-page">
      <section className="movie-details">
        {poster ? (
          <img src={poster} alt={movie.title} className="details-poster" />
        ) : (
          <div className="details-poster placeholder">Pas d’image</div>
        )}

        <div className="details-content">
          <h1>{movie.title}</h1>

          {movie.tagline && <p className="tagline">{movie.tagline}</p>}

          <p>{movie.overview || "Aucune description disponible."}</p>

          <div className="details-meta">
            <span>Sortie : {movie.release_date || "Inconnue"}</span>
            <span>
              Durée : {movie.runtime ? `${movie.runtime} min` : "Inconnue"}
            </span>
            <span>Note : {movie.vote_average ?? "N/A"}</span>
          </div>

          <div className="genre-list">
            {movie.genres?.map((genre) => (
              <span key={genre.id}>{genre.name}</span>
            ))}
          </div>

          <button className="favorite-button" onClick={handleToggleFavorite}>
            {favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          </button>
        </div>
      </section>

      <MovieSection
        title="Films recommandés"
        movies={recommendations}
        horizontal={true}
      />
    </div>
  );
}

export default MovieDetails;