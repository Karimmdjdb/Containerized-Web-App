function getPaginationItems(currentPage, totalPages) {
  const safeTotal = Math.min(totalPages || 1, 500);

  if (safeTotal <= 7) {
    return Array.from({ length: safeTotal }, (_, index) => index + 1);
  }

  const pages = [1];

  if (currentPage > 4) {
    pages.push("...");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(safeTotal - 1, currentPage + 1);

  for (let page = start; page <= end; page++) {
    pages.push(page);
  }

  if (currentPage < safeTotal - 3) {
    pages.push("...");
  }

  pages.push(safeTotal);

  return pages;
}

function Pagination({ page, totalPages, onPageChange }) {
  const safeTotalPages = Math.min(totalPages || 1, 500);

  if (safeTotalPages <= 1) return null;

  const items = getPaginationItems(page, safeTotalPages);

  return (
    <nav className="pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Précédent
      </button>

      <div className="pagination-pages">
        {items.map((item, index) =>
          item === "..." ? (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis">
              ...
            </span>
          ) : (
            <button
              key={item}
              className={item === page ? "pagination-page active" : "pagination-page"}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          )
        )}
      </div>

      <button
        disabled={page >= safeTotalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Suivant
      </button>
    </nav>
  );
}

export default Pagination;