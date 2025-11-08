import React from 'react';

export default function Filters({
  searchTerm,
  setSearchTerm,
  projectFilter,
  setProjectFilter,
  statusFilter,
  setStatusFilter,
  timeRange,
  handleTimeRangeChange,
  projects
}) {
  // Check if any filter is active
  const isAnyFilterActive = searchTerm || projectFilter !== 'all' || statusFilter !== 'all' || timeRange !== 'all';

  // Reset all filters
  const handleReset = () => {
    setSearchTerm('');
    setProjectFilter('all');
    setStatusFilter('all');
    handleTimeRangeChange('all');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative group">
          <input
            type="text"
            placeholder="Rechercher ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 group-hover:border-cyan-500/50"
          />
          <svg className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-500/50 cursor-pointer"
        >
          <option value="all">Toutes les Machines</option>
          {projects.map(project => (
            <option key={project} value={project}>{project}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-500/50 cursor-pointer"
        >
          <option value="all">Tous les Statuts</option>
          <option value="pending">En Attente</option>
          <option value="in-progress">En Cours</option>
          <option value="completed">Terminé</option>
        </select>

        <select
          value={timeRange}
          onChange={(e) => handleTimeRangeChange(e.target.value)}
          className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-500/50 cursor-pointer"
        >
          <option value="all">Toute la période</option>
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="quarter">Ce trimestre</option>
          <option value="year">Cette année</option>
        </select>
      </div>

      {/* Reset Filters Button */}
      {isAnyFilterActive && (
        <div className="flex justify-end">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/40"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}