import { Link } from '@inertiajs/react';

export default function TableHeading({
  name,
  sortable = false,
  sort_field = null,
  sort_direction = null,
  sortChange = () => {},
  children,
}) {
  return (
    <th className="px-3 py-2 text-gray-400">
      {sortable ? (
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            sortChange(name);
          }}
          className="group inline-flex items-center hover:text-cyan-400 transition-colors duration-200"
        >
          {children}
          <span className="ml-1">
            {sort_field === name && sort_direction === 'asc' && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
              </svg>
            )}
            {sort_field === name && sort_direction === 'desc' && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </span>
        </Link>
      ) : (
        children
      )}
    </th>
  );
}
