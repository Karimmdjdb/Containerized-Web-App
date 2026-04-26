from flask import Flask, request
from flask_cors import CORS
import os
import json
import logging
import redis
import tmdbsimple as tmdb
from dotenv import load_dotenv

load_dotenv()

# -----------------------------
# Logger custom
# -----------------------------

logger = logging.getLogger("movie-api")
logger.setLevel(logging.INFO)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

formatter = logging.Formatter(
    "[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

console_handler.setFormatter(formatter)

if not logger.handlers:
    logger.addHandler(console_handler)

logging.getLogger("werkzeug").disabled = True
logging.getLogger("werkzeug").setLevel(logging.ERROR)

# -----------------------------
# App Flask
# -----------------------------

app = Flask("Netflop API")
app.logger.disabled = True

CORS(app, resources={r"/*": {"origins": "*"}})

tmdb.API_KEY = os.getenv("TMDB_API_KEY")

if not tmdb.API_KEY:
    logger.error("TMDB_API_KEY is missing in .env")
    raise RuntimeError("TMDB_API_KEY is missing in .env")

# -----------------------------
# Redis
# -----------------------------

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_TTL = int(os.getenv("REDIS_TTL", 3600))

redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=True
)

try:
    redis_client.ping()
    logger.info(f"Redis connected successfully on {REDIS_HOST}:{REDIS_PORT}")
except redis.exceptions.ConnectionError:
    logger.error(f"Unable to connect to Redis on {REDIS_HOST}:{REDIS_PORT}")
    raise

logger.info("Movie API started successfully")
logger.info("TMDB API key loaded")


# -----------------------------
# Helpers
# -----------------------------

def success(data, status=200):
    return {"data": data}, status


def error(message, status=500):
    logger.error(message)
    return {"error": message}, status


def log_tmdb_request(endpoint, **params):
    logger.info(
        f"[TMDB] Request sent to TMDB API | endpoint={endpoint} | params={params}"
    )


def get_cache_key(prefix, **params):
    parts = [prefix]

    for key in sorted(params.keys()):
        value = params[key]
        if value is not None:
            parts.append(f"{key}={value}")

    return "tmdb:" + ":".join(parts)


def get_or_set_cache(cache_key, fetch_function):
    cached_data = redis_client.get(cache_key)

    if cached_data:
        logger.info(f"[CACHE] HIT | key={cache_key}")
        logger.info("[RESPONSE] Served from Redis cache")

        return json.loads(cached_data)

    logger.info(f"[CACHE] MISS | key={cache_key}")

    data = fetch_function()

    logger.info("[RESPONSE] Fetched from TMDB API")

    redis_client.setex(
        cache_key,
        REDIS_TTL,
        json.dumps(data)
    )

    logger.info(f"[CACHE] SET | key={cache_key} | ttl={REDIS_TTL}s")

    return data


# -----------------------------
# Routes
# -----------------------------

@app.route("/")
def home():
    logger.info("[API] GET /")

    return success({
        "message": "Movie API is running",
        "cache": {
            "provider": "Redis",
            "host": REDIS_HOST,
            "port": REDIS_PORT,
            "ttl_seconds": REDIS_TTL
        },
        "endpoints": [
            "/movies/popular",
            "/movies/search?query=batman",
            "/movies/<movie_id>",
            "/movies/<movie_id>/recommendations",
            "/genres",
            "/movies/discover?genre_id=28",
            "/movies/discover?genre_id=28&year=2024&sort_by=popularity.desc",
            "/movies/top-rated",
            "/movies/now-playing",
            "/movies/upcoming"
        ]
    })


@app.route("/movies/popular")
def popular_movies():
    try:
        page = request.args.get("page", 1, type=int)

        logger.info(f"[API] GET /movies/popular | page={page}")

        cache_key = get_cache_key("popular", page=page, language="fr-FR")

        def fetch_from_tmdb():
            log_tmdb_request("/movie/popular", language="fr-FR", page=page)
            movie = tmdb.Movies()
            return movie.popular(language="fr-FR", page=page)

        response = get_or_set_cache(cache_key, fetch_from_tmdb)
        return success(response)

    except Exception as e:
        return error(f"Failed to fetch popular movies: {e}")


@app.route("/movies/search")
def search_movies():
    try:
        query = request.args.get("query")

        if not query:
            return error("Missing query parameter", 400)

        page = request.args.get("page", 1, type=int)
        clean_query = query.strip().lower()

        logger.info(f"[API] GET /movies/search | query={clean_query} | page={page}")

        cache_key = get_cache_key(
            "search",
            query=clean_query,
            page=page,
            language="fr-FR"
        )

        def fetch_from_tmdb():
            log_tmdb_request(
                "/search/movie",
                query=clean_query,
                language="fr-FR",
                page=page
            )

            search = tmdb.Search()
            return search.movie(
                query=clean_query,
                language="fr-FR",
                page=page
            )

        response = get_or_set_cache(cache_key, fetch_from_tmdb)
        return success(response)

    except Exception as e:
        return error(f"Failed to search movies: {e}")


@app.route("/movies/<int:movie_id>")
def movie_details(movie_id):
    try:
        logger.info(f"[API] GET /movies/{movie_id}")

        cache_key = get_cache_key(
            "movie-details",
            movie_id=movie_id,
            language="fr-FR"
        )

        def fetch_from_tmdb():
            log_tmdb_request(
                f"/movie/{movie_id}",
                language="fr-FR",
                append_to_response="credits,videos,images"
            )

            movie = tmdb.Movies(movie_id)
            return movie.info(
                language="fr-FR",
                append_to_response="credits,videos,images"
            )

        response = get_or_set_cache(cache_key, fetch_from_tmdb)
        return success(response)

    except Exception as e:
        return error(f"Failed to fetch movie details: {e}")


@app.route("/movies/<int:movie_id>/recommendations")
def movie_recommendations(movie_id):
    try:
        page = request.args.get("page", 1, type=int)

        logger.info(f"[API] GET /movies/{movie_id}/recommendations | page={page}")

        cache_key = get_cache_key(
            "recommendations",
            movie_id=movie_id,
            page=page,
            language="fr-FR"
        )

        def fetch_from_tmdb():
            log_tmdb_request(
                f"/movie/{movie_id}/recommendations",
                language="fr-FR",
                page=page
            )

            movie = tmdb.Movies(movie_id)
            return movie.recommendations(
                language="fr-FR",
                page=page
            )

        response = get_or_set_cache(cache_key, fetch_from_tmdb)
        return success(response)

    except Exception as e:
        return error(f"Failed to fetch movie recommendations: {e}")


@app.route("/movies/<int:movie_id>/similar")
def similar_movies(movie_id):
    try:
        page = request.args.get("page", 1, type=int)

        logger.info(f"[API] GET /movies/{movie_id}/similar | page={page}")

        cache_key = get_cache_key(
            "similar",
            movie_id=movie_id,
            page=page,
            language="fr-FR"
        )

        def fetch_from_tmdb():
            log_tmdb_request(
                f"/movie/{movie_id}/similar",
                language="fr-FR",
                page=page
            )

            movie = tmdb.Movies(movie_id)
            return movie.similar_movies(
                language="fr-FR",
                page=page
            )

        response = get_or_set_cache(cache_key, fetch_from_tmdb)
        return success(response)

    except Exception as e:
        return error(f"Failed to fetch similar movies: {e}")


@app.route("/genres")
def movie_genres():
    try:
        logger.info("[API] GET /genres")

        cache_key = get_cache_key("genres", language="fr-FR")

        def fetch_from_tmdb():
            log_tmdb_request("/genre/movie/list", language="fr-FR")

            genres = tmdb.Genres()
            return genres.movie_list(language="fr-FR")

        response = get_or_set_cache(cache_key, fetch_from_tmdb)
        return success(response)

    except Exception as e:
        return error(f"Failed to fetch genres: {e}")


@app.route("/movies/discover")
def discover_movies():
    try:
        genre_id = request.args.get("genre_id")
        year = request.args.get("year")
        sort_by = request.args.get("sort_by", "popularity.desc")
        page = request.args.get("page", 1, type=int)

        params = {
            "language": "fr-FR",
            "sort_by": sort_by,
            "page": page
        }

        if genre_id:
            params["with_genres"] = genre_id

        if year:
            params["primary_release_year"] = year

        logger.info(
            f"[API] GET /movies/discover | genre_id={genre_id} | "
            f"year={year} | sort_by={sort_by} | page={page}"
        )

        cache_key = get_cache_key(
            "discover",
            genre_id=genre_id,
            year=year,
            sort_by=sort_by,
            page=page,
            language="fr-FR"
        )

        def fetch_from_tmdb():
            log_tmdb_request("/discover/movie", **params)

            discover = tmdb.Discover()
            return discover.movie(**params)

        response = get_or_set_cache(cache_key, fetch_from_tmdb)
        return success(response)

    except Exception as e:
        return error(f"Failed to discover movies: {e}")


@app.route("/movies/top-rated")
def top_rated_movies():
    try:
        page = request.args.get("page", 1, type=int)

        logger.info(f"[API] GET /movies/top-rated | page={page}")

        cache_key = get_cache_key("top-rated", page=page, language="fr-FR")

        def fetch_from_tmdb():
            log_tmdb_request("/movie/top_rated", language="fr-FR", page=page)

            movie = tmdb.Movies()
            return movie.top_rated(language="fr-FR", page=page)

        response = get_or_set_cache(cache_key, fetch_from_tmdb)
        return success(response)

    except Exception as e:
        return error(f"Failed to fetch top rated movies: {e}")


@app.route("/movies/now-playing")
def now_playing_movies():
    try:
        page = request.args.get("page", 1, type=int)

        logger.info(f"[API] GET /movies/now-playing | page={page}")

        cache_key = get_cache_key("now-playing", page=page, language="fr-FR")

        def fetch_from_tmdb():
            log_tmdb_request("/movie/now_playing", language="fr-FR", page=page)

            movie = tmdb.Movies()
            return movie.now_playing(language="fr-FR", page=page)

        response = get_or_set_cache(cache_key, fetch_from_tmdb)
        return success(response)

    except Exception as e:
        return error(f"Failed to fetch now playing movies: {e}")


@app.route("/movies/upcoming")
def upcoming_movies():
    try:
        page = request.args.get("page", 1, type=int)

        logger.info(f"[API] GET /movies/upcoming | page={page}")

        cache_key = get_cache_key("upcoming", page=page, language="fr-FR")

        def fetch_from_tmdb():
            log_tmdb_request("/movie/upcoming", language="fr-FR", page=page)

            movie = tmdb.Movies()
            return movie.upcoming(language="fr-FR", page=page)

        response = get_or_set_cache(cache_key, fetch_from_tmdb)
        return success(response)

    except Exception as e:
        return error(f"Failed to fetch upcoming movies: {e}")
