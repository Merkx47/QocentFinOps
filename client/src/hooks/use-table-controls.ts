import { useState, useMemo, useEffect } from 'react';

interface UseTableControlsOptions {
  pageSize?: number;
}

export function useTableControls<T>(
  data: T[],
  options: UseTableControlsOptions = {}
) {
  const { pageSize = 10 } = options;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  // Reset to page 1 when data changes (e.g. filters applied)
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    paginatedData,
    totalItems: data.length,
  };
}
