import { useEffect, useState } from "react";
import MovieSection from "../components/MovieSection";
import { getFavorites, removeFavorite } from "../favorites";

function Favorites() {
  const [favorites, setFavorites] = useState([]);

  function loadFavorites() {
    setFavorites(getFavorites());
  }

  function handleRemoveFavorite(movieId) {
    removeFavorite(movieId);
    loadFavorites();
  }

  useEffect(() => {
    loadFavorites();
  }, []);

  return (
    <section className="content">
      <h1>Mes favoris</h1>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <p>Aucun film ajouté aux favoris pour l’instant.</p>
          <p>
            Va sur la page d’un film, puis clique sur “Ajouter aux favoris”.
          </p>
        </div>
      ) : (
        <>
          <MovieSection title="Films favoris" movies={favorites} />

          <div className="favorites-list">
            {favorites.map((movie) => (
              <button
                key={movie.id}
                className="remove-favorite-button"
                onClick={() => handleRemoveFavorite(movie.id)}
              >
                Retirer {movie.title}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default Favorites;