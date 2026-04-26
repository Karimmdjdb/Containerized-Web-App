const API_URL = window.env?.API_URL;

async function request(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error("Erreur lors de l'appel API");
  }

  return response.json();
}

export async function getPopularMovies(page = 1, limit = 12) {
  return request(`/movies/popular?page=${page}&limit=${limit}`);
}

export async function searchMovies(query, page = 1, limit = 12) {
  return request(`/movies/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
}

export async function getGenres() {
  return request("/genres");
}

export async function getMoviesByGenre(genreId, page = 1, limit = 12) {
  return request(`/movies/discover?genre_id=${genreId}&page=${page}&limit=${limit}`);
}

export async function getMovieDetails(movieId) {
  return request(`/movies/${movieId}`);
}

export async function getMovieRecommendations(movieId, limit = 10) {
  return request(`/movies/${movieId}/recommendations?limit=${limit}`);
}

export async function getSimilarMovies(movieId, limit = 10) {
  return request(`/movies/${movieId}/similar?limit=${limit}`);
}