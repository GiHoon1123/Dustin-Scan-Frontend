import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  queryParams?: Record<string, string | number | undefined>;
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
  queryParams,
}: PaginationProps) {
  const pages = [];
  const maxPages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
  let endPage = Math.min(totalPages, startPage + maxPages - 1);

  if (endPage - startPage < maxPages - 1) {
    startPage = Math.max(1, endPage - maxPages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const buildHref = (page: number) => {
    const params = new URLSearchParams();

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value === undefined) return;
        params.set(key, String(value));
      });
    }

    params.set("page", String(page));
    const queryString = params.toString();

    return queryString ? `${basePath}?${queryString}` : `${basePath}`;
  };

  return (
    <div className="flex items-center justify-center flex-wrap gap-2 mt-6 md:mt-8">
      {/* Previous */}
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className="px-3 md:px-4 py-2 text-sm md:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition min-h-[44px] flex items-center justify-center"
        >
          ← Prev
        </Link>
      )}

      {/* Page Numbers */}
      {pages.map((page) => (
        <Link
          key={page}
          href={buildHref(page)}
          className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center ${
            page === currentPage
              ? "bg-blue-600 text-white"
              : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          {page}
        </Link>
      ))}

      {/* Next */}
      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1)}
          className="px-3 md:px-4 py-2 text-sm md:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition min-h-[44px] flex items-center justify-center"
        >
          Next →
        </Link>
      )}
    </div>
  );
}

