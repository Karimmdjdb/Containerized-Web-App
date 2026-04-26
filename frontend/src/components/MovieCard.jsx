import { Link } from "react-router-dom";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

function MovieCard({ movie }) {
  const poster = movie.poster_path
    ? `${IMAGE_BASE_URL}${movie.poster_path}`
    : null;

  return (
    <Link to={`/movies/${movie.id}`} className="movie-card">
      {poster ? (
        <img src={poster} alt={movie.title} />
      ) : (
        <div className="poster-placeholder">Pas d’image</div>
      )}

      <div className="movie-card-content">
        <h3>{movie.title}</h3>
        <p>{movie.release_date || "Date inconnue"}</p>
        <span>Note : {movie.vote_average ?? "N/A"}</span>
      </div>
    </Link>
  );
}

export default MovieCard;