import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, CartesianGrid } from 'recharts';
import { Link } from '@inertiajs/react';

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316'  // Orange
];

const STATUS_BAR_COLORS = ['#FFD600', '#2196F3', '#43A047'];

const STATUS_COLORS = {
  pending: '#FFD600',    // Yellow for pending
  'in-progress': '#2196F3', // Blue for in progress
  completed: '#43A047'    // Green for completed
};

const STATUS_LABELS = {
  pending: 'En Attente',
  'in-progress': 'En Cours',
  completed: 'Terminé'
};

// Time filter helper functions
const isWithinTimeRange = (date, timeRange) => {
  if (!date || !timeRange || timeRange === 'all') return true;
  
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

const CustomTooltip = ({ active, payload, totalTasks }) => {
  if (active && payload && payload.length) {
    const { project, tasks } = payload[0].payload;
    const percent = totalTasks > 0 ? ((tasks / totalTasks) * 100).toFixed(1) : 0;
    return (
      <div className="bg-gray-900/95 px-4 py-3 rounded-lg border border-gray-700/50 shadow-xl backdrop-blur-xl">
        <div className="text-gray-300 font-medium mb-1">{project}</div>
        <div className="text-white font-bold text-lg flex items-center gap-2">
          {tasks} Ticket
          <span className="text-sm font-normal text-blue-400">({percent}%)</span>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700/50">
          <div className="text-gray-400 text-sm">
            {percent}% du total des Tickets
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const NoDataDisplay = ({ searchTerm, timeRange }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="text-center p-6 rounded-lg bg-gray-800/50 border border-gray-700/30">
      <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 21a9 9 0 110-18 9 9 0 010 18z" />
      </svg>
      <p className="text-gray-400 text-lg font-medium mb-1">Aucune donnée disponible</p>
      <p className="text-sm text-gray-500">
        {searchTerm 
          ? "Aucun résultat trouvé pour votre recherche"
          : timeRange !== 'all'
          ? `Aucun Ticket pour ${getTimeRangeLabel(timeRange).toLowerCase()}`
          : "Ajoutez des Tickets pour voir les statistiques"}
      </p>
    </div>
  </div>
);

// Add DefaultProductDistribution component
const DefaultProductDistribution = () => (
  <div className="mt-8 pt-8 border-t border-gray-700/50">
    <div className="flex items-center gap-2 mb-6">
      <div className="p-2 bg-purple-500/10 rounded-lg">
        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      </div>
      <div>
        <h4 className="text-lg font-semibold text-white">Distribution par Produit</h4>
        <p className="text-sm text-gray-400">Sélectionnez une Machine pour voir la répartition des Tickets par produit</p>
      </div>
    </div>

    <div className="bg-gray-800/50 rounded-lg border border-gray-700/30 p-8">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="bg-purple-500/10 p-4 rounded-full mb-4">
          <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">Aucun Machine sélectionné</h3>
        <p className="text-gray-500 max-w-sm">
          Pour voir la distribution des Tickets par produit, veuillez sélectionner une Machine spécifique dans les filtres ci-dessus.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-4 w-full max-w-lg">
          {['pending', 'in-progress', 'completed'].map((status) => (
            <div key={status} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/30 border border-gray-700/20">
              <div className={`w-3 h-3 rounded-full bg-${status === 'pending' ? 'yellow' : status === 'in-progress' ? 'blue' : 'green'}-500`} />
              <span className="text-sm text-gray-400">{STATUS_LABELS[status]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Add ProductLevelChart component
const ProductLevelChart = ({ tasks, projectFilter }) => {
  // Group tasks by product and status
  const productData = useMemo(() => {
    if (!tasks || !projectFilter || projectFilter === 'all') return [];

    const productStats = {};

    tasks.forEach(task => {
      // Only process tasks for the selected project
      const taskProject = task.products?.[0]?.project;
      if (taskProject?.name !== projectFilter) return;

      // Process each product in the task
      task.products?.forEach(product => {
        if (!productStats[product.name]) {
          productStats[product.name] = {
            productName: product.name,
            pending: 0,
            'in-progress': 0,
            completed: 0,
            total: 0
          };
        }

        const status = task.computed_status || task.status;
        productStats[product.name][status]++;
        productStats[product.name].total++;
      });
    });

    return Object.values(productStats).sort((a, b) => b.total - a.total);
  }, [tasks, projectFilter]);

  if (!productData.length) return null;

  return (
    <div className="mt-8 pt-8 border-t border-gray-700/50">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-purple-500/10 rounded-lg">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white">Distribution par Produit</h4>
          <p className="text-sm text-gray-400">Répartition des Tickets par produit et statut</p>
        </div>
      </div>

      <div className="relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={productData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis
              dataKey="productName"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-gray-900/95 px-4 py-3 rounded-lg border border-gray-700/50 shadow-xl backdrop-blur-xl">
                      <div className="text-gray-300 font-medium mb-2">{label}</div>
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-gray-400">{STATUS_LABELS[entry.name]}:</span>
                          <span className="text-white font-medium">{entry.value}</span>
                        </div>
                      ))}
                      <div className="mt-2 pt-2 border-t border-gray-700/50">
                        <div className="text-sm">
                          <span className="text-gray-400">Total: </span>
                          <span className="text-white font-medium">
                            {payload.reduce((sum, entry) => sum + entry.value, 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="pending" stackId="a" fill={STATUS_COLORS.pending}>
              <LabelList dataKey="pending" position="inside" fill="#fff" fontSize={10} />
            </Bar>
            <Bar dataKey="in-progress" stackId="a" fill={STATUS_COLORS["in-progress"]}>
              <LabelList dataKey="in-progress" position="inside" fill="#fff" fontSize={10} />
            </Bar>
            <Bar dataKey="completed" stackId="a" fill={STATUS_COLORS.completed}>
              <LabelList dataKey="completed" position="inside" fill="#fff" fontSize={10} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 pt-2">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-400">{STATUS_LABELS[status]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function TasksPerProjectChart({ 
  tasks, 
  searchTerm, 
  projectFilter, 
  groupedProjectStatusData: projectStatusFromProps,
  activeBarIndex,
  setActiveBarIndex,
  timeRange = 'all'
}) {
  // Filter tasks based on search term and time range
  const searchFilteredTasks = useMemo(() => 
    tasks.filter(task => {
      // Get the project from the first product since all products belong to the same project
      const taskProject = task.products?.[0]?.project;
      
      const matchesSearch = !searchTerm || 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        taskProject?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTimeRange = isWithinTimeRange(task.created_at, timeRange);

      // Check project filter against the task's project
      const matchesProject = projectFilter === 'all' || 
        taskProject?.name === projectFilter;

      return matchesSearch && matchesTimeRange && matchesProject;
    }), [tasks, searchTerm, timeRange, projectFilter]
  );

  // Group tasks by project and count them
  const projectTaskCounts = useMemo(() => {
    try {
      if (!Array.isArray(searchFilteredTasks)) {
        console.warn('Tasks is not an array:', searchFilteredTasks);
        return {};
      }

      const counts = {};
      
      searchFilteredTasks.forEach(task => {
        try {
          // Get the project from the first product (all products belong to same project)
          const product = task.products?.[0];
          if (!product?.project) return;
          
          const projectName = product.project.name || 'Sans Projet';
          const projectId = product.project.id;
          
          if (!counts[projectName]) {
            counts[projectName] = {
              count: 0,
              id: projectId,
              pending: 0,
              inProgress: 0,
              completed: 0,
              totalTasks: 0,
              onTime: 0,
              delayed: 0
            };
          }
          
          // Count by status using computed_status
          const status = task.computed_status || task.status;
          if (status === 'pending') counts[projectName].pending++;
          else if (status === 'in-progress') counts[projectName].inProgress++;
          else if (status === 'completed') counts[projectName].completed++;
          
          // Count on-time vs delayed tasks
          if (task.due_date) {
            const dueDate = new Date(task.due_date);
            const completedDate = task.completed_at ? new Date(task.completed_at) : null;
            
            if (completedDate && status === 'completed') {
              if (completedDate <= dueDate) {
                counts[projectName].onTime++;
              } else {
                counts[projectName].delayed++;
              }
            }
          }
          
          // Increment counters only once per task
          counts[projectName].count++;
          counts[projectName].totalTasks++;
        } catch (error) {
          console.error('Error processing task:', error);
        }
      });

      return counts;
    } catch (error) {
      console.error('Error calculating project task counts:', error);
      return {};
    }
  }, [searchFilteredTasks]);

  // Create filtered project data
  const filteredProjectData = useMemo(() => {
    try {
      return Object.entries(projectTaskCounts)
        .map(([project, data]) => ({
          project,
          tasks: data.count,
          projectId: data.id,
          pending: data.pending,
          inProgress: data.inProgress,
          completed: data.completed,
          onTime: data.onTime,
          delayed: data.delayed,
          completionRate: data.totalTasks > 0 
            ? (data.completed / data.totalTasks) * 100 
            : 0
        }))
        .filter(project => project.tasks > 0)
        .sort((a, b) => b.tasks - a.tasks);
    } catch (error) {
      console.error('Error creating filtered project data:', error);
      return [];
    }
  }, [projectTaskCounts]);

  // Calculate total with error handling
  const totalTasks = useMemo(() => {
    try {
      return filteredProjectData.reduce((sum, p) => sum + p.tasks, 0);
    } catch (error) {
      console.error('Error calculating total tasks:', error);
      return 0;
    }
  }, [filteredProjectData]);

  // Reset active bar index when filters change
  React.useEffect(() => {
    setActiveBarIndex(-1);
  }, [searchTerm, projectFilter, timeRange, setActiveBarIndex]);

  // Filter grouped status data by time range
  const timeFilteredStatusData = useMemo(() => {
    if (!projectStatusFromProps) return null;
    
    return projectStatusFromProps.map(status => ({
      ...status,
      value: searchFilteredTasks.filter(task => {
        const matchesStatus = 
          (status.status === 'En Attente' && task.status === 'pending') ||
          (status.status === 'En Cours' && task.status === 'in-progress') ||
          (status.status === 'Terminés' && task.status === 'completed');
        return matchesStatus;
      }).length
    }));
  }, [projectStatusFromProps, searchFilteredTasks]);

  // Compute grouped data for selected project
  const computedProjectStatusData = useMemo(() => {
    if (projectFilter === 'all') return null;

    const projectTasks = searchFilteredTasks.filter(task => 
      task.products?.[0]?.project?.name === projectFilter &&
      (!searchTerm || 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return [
      { status: 'En Attente', value: projectTasks.filter(t => (t.computed_status || t.status) === 'pending').length },
      { status: 'En Cours', value: projectTasks.filter(t => (t.computed_status || t.status) === 'in-progress').length },
      { status: 'Terminés', value: projectTasks.filter(t => (t.computed_status || t.status) === 'completed').length },
    ];
  }, [searchFilteredTasks, projectFilter, searchTerm]);

  // If a project is selected, show grouped bars by status
  if (projectFilter !== 'all' && computedProjectStatusData) {
    const hasData = computedProjectStatusData.some(item => item.value > 0);

    return (
      <div className="bg-gradient-to-br from-gray-800/30 via-gray-900/20 to-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Tickets par Statut pour « {projectFilter} »
                {searchTerm && <span className="text-sm text-gray-400 ml-2">(Filtré: "{searchTerm}")</span>}
              </h3>
              <p className="text-sm text-gray-400">
                Distribution des Tickets par statut
                {timeRange !== 'all' && (
                  <span className="text-blue-400 ml-2">• {getTimeRangeLabel(timeRange)}</span>
                )}
              </p>
            </div>
          </div>
          {hasData && (
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {computedProjectStatusData.reduce((sum, item) => sum + item.value, 0)}
              </div>
              <div className="text-sm text-gray-400">Total des Tickets</div>
            </div>
          )}
        </div>
        
        <div className="relative h-64">
          {!hasData ? (
            <NoDataDisplay searchTerm={searchTerm} timeRange={timeRange} />
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={computedProjectStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="status" 
                    tick={{ fill: '#E5E7EB', fontSize: 14 }} 
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fill: '#E5E7EB', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(59,130,246,0.1)' }}
                    formatter={(value, name) => [`${value} tickets`, name]}
                    contentStyle={{
                      backgroundColor: 'rgba(17,24,39,0.95)',
                      border: '1px solid rgba(107,114,128,0.3)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    isAnimationActive
                    animationDuration={1000}
                    className="transition-all duration-300"
                    radius={[4, 4, 0, 0]}
                  >
                    {computedProjectStatusData.map((entry, idx) => (
                      <Cell 
                        key={entry.status} 
                        fill={STATUS_BAR_COLORS[idx % STATUS_BAR_COLORS.length]}
                        className="transition-all duration-300 hover:brightness-110"
                        style={{
                          filter: `drop-shadow(0 0 6px ${STATUS_BAR_COLORS[idx % STATUS_BAR_COLORS.length]}66)`
                        }}
                      />
                    ))}
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      fill="#fff" 
                      fontSize={14} 
                      fontWeight={600}
                      className="transition-all duration-300"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 pt-2">
                {computedProjectStatusData.map((entry, idx) => (
                  <div key={entry.status} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ 
                        backgroundColor: STATUS_BAR_COLORS[idx % STATUS_BAR_COLORS.length],
                        boxShadow: `0 0 10px ${STATUS_BAR_COLORS[idx % STATUS_BAR_COLORS.length]}66`
                      }}
                    />
                    <span className="text-sm text-gray-400">{entry.status}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Add the ProductLevelChart component */}
        {projectFilter !== 'all' && (
          <ProductLevelChart tasks={searchFilteredTasks} projectFilter={projectFilter} />
        )}
      </div>
    );
  }

  // Show bars by project (original view)
  return (
    <div className="bg-gradient-to-br from-gray-800/30 via-gray-900/20 to-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 h-full">
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
        Tickets par Machines
        {searchTerm && <span className="text-sm text-gray-400 ml-2">(Filtré: "{searchTerm}")</span>}
      </h3>
              <p className="text-sm text-gray-400">
                Vue d'ensemble des Tickets par machine
                {timeRange !== 'all' && (
                  <span className="text-blue-400 ml-2">• {getTimeRangeLabel(timeRange)}</span>
                )}
              </p>
            </div>
          </div>
          {totalTasks > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{totalTasks}</div>
              <div className="text-sm text-gray-400">Total des Tickets</div>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        {/* Chart Container */}
        <div className="h-64 relative">
          {filteredProjectData.length === 0 ? (
            <NoDataDisplay searchTerm={searchTerm} timeRange={timeRange} />
          ) : (
            <>
        <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={filteredProjectData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="project" 
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tick={false}
                    tickLine={false}
                    height={20}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                    width={40}
                  />
            <Tooltip
                    content={<CustomTooltip totalTasks={totalTasks} />}
                    cursor={{ 
                      fill: 'rgba(59,130,246,0.1)',
                      className: 'transition-all duration-300'
              }}
            />
            <Bar 
              dataKey="tasks" 
              isAnimationActive 
                    animationDuration={1000}
              onMouseEnter={(_, idx) => setActiveBarIndex(idx)} 
              onMouseLeave={() => setActiveBarIndex(-1)}
                    className="transition-all duration-300"
                    radius={[4, 4, 0, 0]}
            >
              {filteredProjectData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={activeBarIndex === index ? '#2196F3' : COLORS[index % COLORS.length]}
                  cursor="pointer"
                        className="transition-all duration-300 hover:brightness-110"
                        style={{
                          filter: activeBarIndex === index 
                            ? 'drop-shadow(0 0 8px rgba(33,150,243,0.5))' 
                            : `drop-shadow(0 0 6px ${COLORS[index % COLORS.length]}66)`
                        }}
                />
              ))}
                    <LabelList 
                      dataKey="tasks" 
                      position="top" 
                      fill="#fff" 
                      fontSize={12} 
                      fontWeight={600}
                      className="transition-all duration-300"
                    />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

              {/* Decorative Elements */}
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
              <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl"></div>
            </>
          )}
        </div>

        {/* Interactive Legend */}
        {filteredProjectData.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filteredProjectData.map((entry, index) => (
              <Link 
                key={entry.project}
                href={route('projects.show', entry.projectId)}
                className={`
                  flex items-center gap-2 p-2 rounded-lg border transition-all duration-300 cursor-pointer group
                  ${activeBarIndex === index 
                    ? 'bg-blue-500/10 border-blue-500/30 shadow-lg shadow-blue-500/10' 
                    : 'bg-gray-800/50 border-gray-700/30 hover:bg-gray-800/70'}
                `}
                onMouseEnter={() => setActiveBarIndex(index)}
                onMouseLeave={() => setActiveBarIndex(-1)}
              >
                <div 
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    backgroundColor: activeBarIndex === index ? '#2196F3' : COLORS[index % COLORS.length],
                    boxShadow: activeBarIndex === index 
                      ? '0 0 10px rgba(33,150,243,0.5)' 
                      : `0 0 10px ${COLORS[index % COLORS.length]}66`
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-300 truncate group-hover:text-blue-400 transition-colors">{entry.project}</div>
                  <div className="text-xs text-gray-500">{entry.tasks} Tickets</div>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add DefaultProductDistribution when no project is selected */}
      {projectFilter === 'all' && filteredProjectData.length > 0 && <DefaultProductDistribution />}
    </div>
  );
}