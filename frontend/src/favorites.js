const FAVORITES_KEY = "movie_app_favorites";

export function getFavorites() {
  const rawFavorites = localStorage.getItem(FAVORITES_KEY);

  if (!rawFavorites) {
    return [];
  }

  try {
    return JSON.parse(rawFavorites);
  } catch {
    return [];
  }
}

export function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function isFavorite(movieId) {
  const favorites = getFavorites();
  return favorites.some((movie) => movie.id === Number(movieId));
}

export function addFavorite(movie) {
  const favorites = getFavorites();

  if (favorites.some((favorite) => favorite.id === movie.id)) {
    return;
  }

  const movieToSave = {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average
  };

  saveFavorites([...favorites, movieToSave]);
}

export function removeFavorite(movieId) {
  const favorites = getFavorites();
  const updatedFavorites = favorites.filter(
    (movie) => movie.id !== Number(movieId)
  );

  saveFavorites(updatedFavorites);
}

export function toggleFavorite(movie) {
  if (isFavorite(movie.id)) {
    removeFavorite(movie.id);
    return false;
  }

  addFavorite(movie);
  return true;
}