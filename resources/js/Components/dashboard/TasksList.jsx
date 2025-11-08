import React, { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import ErrorBoundary from '@/Components/dashboard/ErrorBoundary';

const STATUS_GRADIENTS = {
  pending: 'from-amber-500/20 to-orange-500/20 text-amber-400',
  'in-progress': 'from-blue-500/20 to-cyan-500/20 text-blue-400',
  completed: 'from-emerald-500/20 to-green-500/20 text-emerald-400'
};

const PRIORITY_GRADIENTS = {
  high: 'from-rose-500/20 to-red-500/20 text-rose-400',
  medium: 'from-amber-500/20 to-orange-500/20 text-amber-400',
  low: 'from-emerald-500/20 to-green-500/20 text-emerald-400'
};

const TASK_STATUS_TEXT_MAP = {
  pending: 'En Attente',
  'in-progress': 'En Cours',
  completed: 'Terminé'
};

const TASK_PRIORITY_TEXT_MAP = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse'
};

const getTimeRangeLabel = (timeRange) => {
  switch (timeRange) {
    case 'today':
      return "Aujourd'hui";
    case 'yesterday':
      return 'Hier';
    case 'this-week':
      return 'Cette semaine';
    case 'this-month':
      return 'Ce mois';
    case 'last-month':
      return 'Mois dernier';
    case 'this-year':
      return 'Cette année';
    default:
      return 'Tout';
  }
};

const isWithinTimeRange = (date, timeRange) => {
  // If timeRange is 'all' or no date/timeRange provided, return true to show all data
  if (timeRange === 'all' || !timeRange || !date) {
    return true;
  }
  
  const taskDate = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - today.getDay());
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisYearStart = new Date(now.getFullYear(), 0, 1);

  switch (timeRange) {
    case 'today':
      return taskDate >= today;
    case 'yesterday':
      return taskDate >= yesterday && taskDate < today;
    case 'this-week':
      return taskDate >= thisWeekStart;
    case 'this-month':
      return taskDate >= thisMonthStart;
    case 'last-month':
      return taskDate >= lastMonthStart && taskDate < thisMonthStart;
    case 'this-year':
      return taskDate >= thisYearStart;
    default:
      return true;
  }
};

const TaskStatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'in-progress':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'pending':
        return 'En Attente';
      case 'in-progress':
        return 'En Cours';
      case 'completed':
        return 'Terminé';
      default:
        return 'Inconnu';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}>
      {getStatusLabel()}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'low':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getPriorityLabel = () => {
    switch (priority) {
      case 'high':
        return 'Haute';
      case 'medium':
        return 'Moyenne';
      case 'low':
        return 'Basse';
      default:
        return 'Normal';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor()}`}>
      {getPriorityLabel()}
    </span>
  );
};

const LoadingRow = () => (
  <tr className="animate-pulse">
    <td className="py-4 px-6">
      <div className="h-6 bg-gray-700/50 rounded w-48"></div>
      <div className="h-4 bg-gray-700/30 rounded w-32 mt-2"></div>
    </td>
    <td className="py-4 px-6">
      <div className="h-6 bg-gray-700/50 rounded w-32"></div>
    </td>
    <td className="py-4 px-6">
      <div className="h-6 bg-gray-700/50 rounded w-24"></div>
    </td>
    <td className="py-4 px-6">
      <div className="h-6 bg-gray-700/50 rounded w-20"></div>
    </td>
    <td className="py-4 px-6">
      <div className="h-6 bg-gray-700/50 rounded w-28"></div>
    </td>
    <td className="py-4 px-6 text-right">
      <div className="h-6 bg-gray-700/50 rounded w-24 ml-auto"></div>
    </td>
  </tr>
);

export default function TasksList({
  tableFilteredTasks,
  searchTerm,
  statusFilter,
  projectFilter,
  timeRange = 'all'
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter tasks based on time range
  const timeFilteredTasks = useMemo(() => {
    try {
      if (!Array.isArray(tableFilteredTasks)) {
        console.warn('tableFilteredTasks is not an array:', tableFilteredTasks);
        return [];
      }

      return tableFilteredTasks
        .filter(task => {
          // Validate task object
          if (!task || typeof task !== 'object') {
            console.warn('Invalid task object:', task);
            return false;
          }

          // Check required fields
          const hasRequiredFields = 
            'id' in task &&
            'name' in task &&
            'status' in task &&
            'priority' in task &&
            'created_at' in task;

          if (!hasRequiredFields) {
            console.warn('Task missing required fields:', task);
            return false;
          }

          // Apply time range filter
          return isWithinTimeRange(task.created_at, timeRange);
        })
        .map(task => ({
          ...task,
          // Ensure all required fields have fallback values
          name: task.name || 'Sans nom',
          description: task.description || '',
          status: task.status || 'pending',
          priority: task.priority || 'low',
          created_at: task.created_at || new Date().toISOString(),
          products: Array.isArray(task.products) ? task.products : [],
          project: task.products?.[0]?.project || null
        }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort by creation date
    } catch (error) {
      console.error('Error processing tasks:', error);
      setError('Une erreur est survenue lors du traitement des tâches.');
      return [];
    }
  }, [tableFilteredTasks, timeRange]);

  const hasData = timeFilteredTasks.length > 0;

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-800/30 via-gray-900/20 to-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-red-500/50">
        <div className="flex items-center gap-2 text-red-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Une erreur est survenue lors du chargement des tâches.</span>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="bg-gradient-to-br from-gray-800/30 via-gray-900/20 to-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-lg hover:shadow-cyan-500/5 transition-all duration-300">
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Liste des Tâches
                  {searchTerm && <span className="text-sm text-gray-400 ml-2">(Filtré: "{searchTerm}")</span>}
                </h3>
                <p className="text-sm text-gray-400">
                  Vue détaillée des tâches
                  {timeRange !== 'all' && (
                    <span className="text-blue-400 ml-2">• {getTimeRangeLabel(timeRange)}</span>
                  )}
                </p>
              </div>
            </div>
            {hasData && (
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{timeFilteredTasks.length}</div>
                <div className="text-sm text-gray-400">Total des tâches</div>
              </div>
            )}
          </div>
        </div>

        {!hasData ? (
          <div className="p-6 text-center">
            <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 21a9 9 0 110-18 9 9 0 010 18z" />
            </svg>
            <p className="text-gray-400 text-lg font-medium mb-1">Aucune tâche disponible</p>
            <p className="text-sm text-gray-500">
              {searchTerm 
                ? "Aucun résultat trouvé pour votre recherche"
                : timeRange !== 'all'
                ? `Aucune tâche pour ${getTimeRangeLabel(timeRange).toLowerCase()}`
                : "Ajoutez des tâches pour les voir ici"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Tâche</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Machine</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Priorité</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="text-right py-3 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {isLoading ? (
                  <>
                    <LoadingRow />
                    <LoadingRow />
                    <LoadingRow />
                  </>
                ) : (
                  timeFilteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="hover:bg-gray-800/30 transition-colors duration-200"
                    >
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <Link
                            href={route('task.show', task.id)}
                            className="text-white font-medium hover:text-blue-400 transition-colors"
                          >
                            {task.name}
                          </Link>
                          {task.description && (
                            <span className="text-gray-400 text-sm truncate max-w-md mt-1">
                              {task.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {task.project?.id ? (
                          <Link
                            href={route('projects.show', task.project.id)}
                            className="text-gray-300 hover:text-blue-400 transition-colors"
                          >
                            {task.project.name}
                          </Link>
                        ) : (
                          <span className="text-gray-300">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <TaskStatusBadge status={task.computed_status || task.status} />
                      </td>
                      <td className="py-4 px-6">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-gray-300">
                            {new Date(task.created_at).toLocaleDateString()}
                          </span>
                          {task.due_date && (
                            <span className="text-sm text-gray-400 mt-1">
                              Date limite: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={route('task.show', task.id)}
                          className="text-blue-500 hover:text-blue-400 font-medium text-sm inline-flex items-center gap-1 group"
                        >
                          Voir détails
                          <svg 
                            className="w-4 h-4 transform transition-transform group-hover:translate-x-1" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}