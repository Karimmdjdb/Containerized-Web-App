function GenreSidebar({ genres, selectedGenre, onSelectGenre }) {
  return (
    <aside className="sidebar">
      <h2>Genres</h2>

      <button
        className={!selectedGenre ? "genre-button active" : "genre-button"}
        onClick={() => onSelectGenre(null)}
      >
        Tous
      </button>

      {genres.map((genre) => (
        <button
          key={genre.id}
          className={selectedGenre === genre.id ? "genre-button active" : "genre-button"}
          onClick={() => onSelectGenre(genre.id)}
        >
          {genre.name}
        </button>
      ))}
    </aside>
  );
}

export default GenreSidebar;