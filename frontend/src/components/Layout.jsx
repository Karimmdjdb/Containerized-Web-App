import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const TMDB_LOGO_URL =
  "https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_1-5bdc75aaebeb75dc7ae79426ddd9be3b2be1e342510f8202baf6bffa71d7f5c4.svg";

function Layout({ children }) {
  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="logo">
          <img src={logo} alt="Logo app" />
        </Link>

        <nav className="nav">
          <Link to="/">Accueil</Link>
          <Link to="/favorites">Favoris</Link>
        </nav>
      </header>

      <main className="main">{children}</main>

      <footer className="footer">
        <div className="tmdb-attribution">
          <img src={TMDB_LOGO_URL} alt="TMDB" />
          <p>Movie data provided by <a href="https://www.themoviedb.org/?language=fr" target="_blank">TMDB</a></p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;