import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, CartesianGrid, LineChart, Line } from 'recharts';

const COLORS = {
  approved: '#4CAF50',
  pending: '#FFC107',
  refused: '#F44336',
  total: '#2196F3'
};

// Time filter helper functions
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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 px-4 py-3 rounded-lg border border-gray-700/50 shadow-xl backdrop-blur-xl">
        <div className="text-gray-300 font-medium mb-1">{label}</div>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-400">{entry.name}:</span>
            <span className="text-white font-medium">{entry.value}</span>
          </div>
        ))}
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
          ? `Aucune intervention pour ${getTimeRangeLabel(timeRange).toLowerCase()}`
          : "Aucune intervention à afficher"}
      </p>
    </div>
  </div>
);

export default function InterventionsChart({
  filteredInterventionsData,
  interventionChartType,
  setInterventionChartType,
  searchTerm,
  interventionStatusFilter,
  timeRange = 'all'
}) {
  // Filter and process data based on time range
  const processedData = useMemo(() => {
    try {
      if (!Array.isArray(filteredInterventionsData)) {
        console.warn('Invalid interventions data:', filteredInterventionsData);
        return [];
      }

      const validData = filteredInterventionsData
        .filter(intervention => {
          // Validate intervention data
          if (!intervention || typeof intervention !== 'object') {
            console.warn('Invalid intervention object:', intervention);
            return false;
          }

          // Check required fields
          const hasRequiredFields = 
            'project' in intervention &&
            'interventions' in intervention &&
            'approved' in intervention &&
            'refused' in intervention &&
            'pending' in intervention;

          if (!hasRequiredFields) {
            console.warn('Missing required fields in intervention:', intervention);
            return false;
          }

          return isWithinTimeRange(intervention.created_at, timeRange);
        })
        .map(intervention => ({
          project: intervention.project || 'Sans Nom',
          total: Number(intervention.interventions) || 0,
          approved: Number(intervention.approved) || 0,
          refused: Number(intervention.refused) || 0,
          pending: Number(intervention.pending) || 0,
          // Calculate percentages
          approvalRate: intervention.interventions > 0 
            ? (Number(intervention.approved) / Number(intervention.interventions)) * 100 
            : 0,
          refusalRate: intervention.interventions > 0 
            ? (Number(intervention.refused) / Number(intervention.interventions)) * 100 
            : 0,
          pendingRate: intervention.interventions > 0 
            ? (Number(intervention.pending) / Number(intervention.interventions)) * 100 
            : 0,
          // Add response time metrics if available
          avgResponseTime: intervention.avg_response_time || 0,
          minResponseTime: intervention.min_response_time || 0,
          maxResponseTime: intervention.max_response_time || 0
        }));

      // Sort data by total interventions
      return validData.sort((a, b) => b.total - a.total);
    } catch (error) {
      console.error('Error processing intervention data:', error);
      return [];
    }
  }, [filteredInterventionsData, timeRange]);

  // Calculate totals and statistics with error handling
  const statistics = useMemo(() => {
    try {
      const totalInterventions = processedData.reduce((sum, item) => sum + item.total, 0);
      const totalApproved = processedData.reduce((sum, item) => sum + item.approved, 0);
      const totalRefused = processedData.reduce((sum, item) => sum + item.refused, 0);
      const totalPending = processedData.reduce((sum, item) => sum + item.pending, 0);

      return {
        total: totalInterventions,
        approved: totalApproved,
        refused: totalRefused,
        pending: totalPending,
        approvalRate: totalInterventions > 0 ? (totalApproved / totalInterventions) * 100 : 0,
        refusalRate: totalInterventions > 0 ? (totalRefused / totalInterventions) * 100 : 0,
        pendingRate: totalInterventions > 0 ? (totalPending / totalInterventions) * 100 : 0,
        avgResponseTime: processedData.reduce((sum, item) => sum + item.avgResponseTime, 0) / processedData.length || 0
      };
    } catch (error) {
      console.error('Error calculating statistics:', error);
      return {
        total: 0,
        approved: 0,
        refused: 0,
        pending: 0,
        approvalRate: 0,
        refusalRate: 0,
        pendingRate: 0,
        avgResponseTime: 0
      };
    }
  }, [processedData]);

  const hasData = processedData.length > 0;

  return (
    <div className="bg-gradient-to-br from-gray-800/30 via-gray-900/20 to-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
            Interventions par Machine
            {searchTerm && <span className="text-sm text-gray-400 ml-2">(Filtré: "{searchTerm}")</span>}
            </h3>
            <p className="text-sm text-gray-400">
              Vue d'ensemble des interventions
              {timeRange !== 'all' && (
                <span className="text-blue-400 ml-2">• {getTimeRangeLabel(timeRange)}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasData && (
            <div className="text-right mr-4">
              <div className="text-2xl font-bold text-white">{statistics.total}</div>
              <div className="text-sm text-gray-400">Total des interventions</div>
            </div>
          )}
          
          <div className="flex rounded-lg overflow-hidden border border-gray-700/50">
            <button
              onClick={() => setInterventionChartType('bar')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                interventionChartType === 'bar'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              Barres
            </button>
            <button
              onClick={() => setInterventionChartType('line')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                interventionChartType === 'line'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              Ligne
            </button>
            </div>
          </div>
        </div>

      <div className="relative h-64">
        {!hasData ? (
          <NoDataDisplay searchTerm={searchTerm} timeRange={timeRange} />
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              {interventionChartType === 'bar' ? (
                <BarChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="project" 
                    tick={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
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
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="approved"
                    name="Approuvées"
                    stackId="a"
                    fill={COLORS.approved}
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList dataKey="approved" position="top" fill="#fff" fontSize={10} />
                  </Bar>
                  <Bar
                    dataKey="pending"
                    name="En Attente"
                    stackId="a"
                    fill={COLORS.pending}
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList dataKey="pending" position="top" fill="#fff" fontSize={10} />
                  </Bar>
                  <Bar
                    dataKey="refused"
                    name="Refusées"
                    stackId="a"
                    fill={COLORS.refused}
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList dataKey="refused" position="top" fill="#fff" fontSize={10} />
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="project" 
                    tick={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
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
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="approved"
                    name="Approuvées"
                    stroke={COLORS.approved}
                    strokeWidth={2}
                    dot={{ fill: COLORS.approved, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pending" 
                    name="En Attente" 
                    stroke={COLORS.pending}
                    strokeWidth={2}
                    dot={{ fill: COLORS.pending, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="refused"
                    name="Refusées"
                    stroke={COLORS.refused}
                    strokeWidth={2}
                    dot={{ fill: COLORS.refused, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total"
                    name="Total"
                    stroke={COLORS.total}
                    strokeWidth={2}
                    dot={{ fill: COLORS.total, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>

            {/* Decorative Elements */}
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl"></div>

            {/* Legend */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.approved }} />
                <span className="text-sm text-gray-400">Approuvées</span>
              </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.pending }} />
                <span className="text-sm text-gray-400">En Attente</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.refused }} />
                <span className="text-sm text-gray-400">Refusées</span>
            </div>
              {interventionChartType === 'line' && (
            <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.total }} />
                  <span className="text-sm text-gray-400">Total</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}