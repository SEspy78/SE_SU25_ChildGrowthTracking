import React from "react";

type PaginationProps = {
  pageIndex: number;
  setPageIndex: (page: number) => void;
  hasNextPage: boolean;
};

const Pagination: React.FC<PaginationProps> = ({ pageIndex, setPageIndex, hasNextPage }) => {
  return (
    <div className="flex justify-center items-center mt-6 space-x-2">
      {/* Nút Previous */}
      <button
        onClick={() => setPageIndex(pageIndex - 1)}
        disabled={pageIndex === 1}
        className={`px-3 py-1 rounded-md border text-sm font-medium transition-colors 
          ${pageIndex === 1
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-white hover:bg-indigo-50 text-gray-700 border-gray-300 hover:border-indigo-400'}`}
      >
        Previous
      </button>

      {/* Số trang */}
      {Array.from({ length: 3 }, (_, i) => pageIndex - 1 + i)
        .filter(page => page > 0)
        .map(page => (
          <button
            key={page}
            onClick={() => setPageIndex(page)}
            className={`px-3 py-1 rounded-md border text-sm font-medium transition-colors
              ${page === pageIndex
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-400'}`}
          >
            {page}
          </button>
        ))
      }

      {/* Nút Next */}
      <button
        onClick={() => setPageIndex(pageIndex + 1)}
        disabled={!hasNextPage}
        className={`px-3 py-1 rounded-md border text-sm font-medium transition-colors 
          ${!hasNextPage
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-white hover:bg-indigo-50 text-gray-700 border-gray-300 hover:border-indigo-400'}`}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
