import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function Pagination({ links, onPageChange }) {
    if (!links || links.length <= 3) {
        return null;
    }

    const handlePageChange = (url) => {
        if (onPageChange) {
            onPageChange(url);
        }
    };

    return (
        <div className="flex items-center justify-between bg-gradient-to-br from-slate-900/60 via-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 shadow-lg">
            <div className="flex-1 flex justify-between sm:hidden">
                {links[0] && links[0].url ? (
                    <Link
                        href={links[0].url}
                        className="relative inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-white bg-black/40 hover:bg-black/60 transition-all duration-300 backdrop-blur-lg"
                        onClick={onPageChange ? (e) => {
                            e.preventDefault();
                            handlePageChange(links[0].url);
                        } : undefined}
                    >
                        Précédent
                    </Link>
                ) : (
                    <span className="relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-lg text-gray-500 bg-slate-800/50 cursor-not-allowed">
                        Précédent
                    </span>
                )}
                {links[links.length - 1] && links[links.length - 1].url ? (
                    <Link
                        href={links[links.length - 1].url}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-white bg-black/40 hover:bg-black/60 transition-all duration-300 backdrop-blur-lg"
                        onClick={onPageChange ? (e) => {
                            e.preventDefault();
                            handlePageChange(links[links.length - 1].url);
                        } : undefined}
                    >
                        Suivant
                    </Link>
                ) : (
                    <span className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-lg text-gray-500 bg-slate-800/50 cursor-not-allowed">
                        Suivant
                    </span>
                )}
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-400">
                        Affichage de{' '}
                        <span className="font-medium text-white">
                            {links[1]?.label || 1}
                        </span>{' '}
                        à{' '}
                        <span className="font-medium text-white">
                            {links[links.length - 2]?.label || 1}
                        </span>{' '}
                        sur{' '}
                        <span className="font-medium text-white">
                            {links[links.length - 1]?.label || 1}
                        </span>{' '}
                        résultats
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-xl shadow-lg -space-x-px backdrop-blur-lg" aria-label="Pagination">
                        {/* Previous Page */}
                        {links[0] && links[0].url ? (
                            <Link
                                href={links[0].url}
                                className="relative inline-flex items-center px-3 py-2 rounded-l-xl border border-white/20 bg-black/40 text-sm font-medium text-white hover:bg-black/60 transition-all duration-300"
                                onClick={onPageChange ? (e) => {
                                    e.preventDefault();
                                    handlePageChange(links[0].url);
                                } : undefined}
                            >
                                <span className="sr-only">Précédent</span>
                                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                            </Link>
                        ) : (
                            <span className="relative inline-flex items-center px-3 py-2 rounded-l-xl border border-slate-600 bg-slate-800/50 text-sm font-medium text-gray-500 cursor-not-allowed">
                                <span className="sr-only">Précédent</span>
                                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                        )}

                        {/* Page Numbers */}
                        {links.slice(1, -1).map((link, index) => {
                            const pageNumber = link.label;
                            const isCurrentPage = link.active;

                            // If the link doesn't have a URL, render a disabled span instead
                            if (!link.url) {
                                return (
                                    <span
                                        key={index}
                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-300 ${
                                            isCurrentPage
                                                ? 'z-10 bg-gradient-to-r from-cyan-500 to-blue-500 border-cyan-500 text-white shadow-lg'
                                                : 'bg-slate-800/50 border-slate-600 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {pageNumber}
                                    </span>
                                );
                            }

                            return (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-300 ${
                                        isCurrentPage
                                            ? 'z-10 bg-gradient-to-r from-cyan-500 to-blue-500 border-cyan-500 text-white shadow-lg'
                                            : 'bg-black/40 border-white/20 text-white hover:bg-black/60 hover:shadow-lg'
                                    }`}
                                    onClick={onPageChange ? (e) => {
                                        e.preventDefault();
                                        if (link.url) {
                                            handlePageChange(link.url);
                                        }
                                    } : undefined}
                                >
                                    {pageNumber}
                                </Link>
                            );
                        })}

                        {/* Next Page */}
                        {links[links.length - 1] && links[links.length - 1].url ? (
                            <Link
                                href={links[links.length - 1].url}
                                className="relative inline-flex items-center px-3 py-2 rounded-r-xl border border-white/20 bg-black/40 text-sm font-medium text-white hover:bg-black/60 transition-all duration-300"
                                onClick={onPageChange ? (e) => {
                                    e.preventDefault();
                                    handlePageChange(links[links.length - 1].url);
                                } : undefined}
                            >
                                <span className="sr-only">Suivant</span>
                                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                            </Link>
                        ) : (
                            <span className="relative inline-flex items-center px-3 py-2 rounded-r-xl border border-slate-600 bg-slate-800/50 text-sm font-medium text-gray-500 cursor-not-allowed">
                                <span className="sr-only">Suivant</span>
                                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                        )}
                    </nav>
                </div>
            </div>
        </div>
    );
}
