import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const PIE_COLORS = ['#F59E0B', '#3B82F6', '#10B981']; // Amber, Blue, Emerald
const TREND_COLORS = {
  positive: 'text-emerald-500',
  negative: 'text-rose-500',
  neutral: 'text-gray-400'
};

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={14} fontWeight={600}>
      {percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
    </text>
  );
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

const MetricCard = ({ title, value, trend, icon, description, timeRange }) => {
  const trendColor = trend > 0 ? TREND_COLORS.positive : trend < 0 ? TREND_COLORS.negative : TREND_COLORS.neutral;
  const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
  
  return (
    <div className="relative bg-gradient-to-br from-gray-800/30 via-gray-900/20 to-gray-800/30 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50 shadow-lg group hover:shadow-cyan-500/5 transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
            {icon}
          </div>
          <h3 className="text-gray-400 text-sm font-medium group-hover:text-gray-300 transition-colors">
            {title}
            {timeRange !== 'all' && (
              <span className="text-blue-400 text-xs ml-2">• {getTimeRangeLabel(timeRange)}</span>
            )}
          </h3>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="text-3xl font-bold text-white flex items-center gap-2">
          {value.toFixed(1)}%
          {trend !== undefined && (
            <span className={`text-sm font-medium ${trendColor}`}>
              {trendIcon} {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2 group-hover:text-gray-400 transition-colors">
          {description}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 bg-gray-800/50 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>

      {/* Decorative Elements */}
      <div className="absolute -right-8 -bottom-8 w-24 h-24 blur-3xl rounded-full bg-gradient-to-br from-white/5 to-white/10 group-hover:from-white/10 group-hover:to-white/20 transition-all duration-300" />
      <div className="absolute -left-2 -top-2 w-12 h-12 blur-2xl rounded-full bg-gradient-to-br from-white/5 to-white/10 group-hover:from-white/10 group-hover:to-white/20 transition-all duration-300" />
    </div>
  );
};

const PerformanceGrade = ({ score }) => {
  let grade, color;
  if (score >= 90) {
    grade = 'A+';
    color = 'text-emerald-400';
  } else if (score >= 80) {
    grade = 'A';
    color = 'text-emerald-400';
  } else if (score >= 70) {
    grade = 'B';
    color = 'text-blue-400';
  } else if (score >= 60) {
    grade = 'C';
    color = 'text-yellow-400';
  } else {
    grade = 'D';
    color = 'text-rose-400';
  }

  return (
    <div className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-gray-800/50 border border-gray-700/50">
      <span className={`text-xl font-bold ${color}`}>{grade}</span>
    </div>
  );
};

export default function AnalyticsPerformance({ calculatedMetrics, filteredTasks, timeRange = 'all' }) {
  // Calculate metrics with time range filter
  const metrics = useMemo(() => {
    try {
      const totalTasks = filteredTasks?.length || 0;
      const completedTasks = filteredTasks?.filter(t => t.status === 'completed')?.length || 0;
      const onTimeCompletions = filteredTasks?.filter(t => 
        t.status === 'completed' && 
        t.completed_at && t.due_date &&
        new Date(t.completed_at) <= new Date(t.due_date)
      )?.length || 0;
      const highPriorityCompleted = filteredTasks?.filter(t => 
        t.status === 'completed' && t.priority === 'high'
      )?.length || 0;
      const highPriorityTotal = filteredTasks?.filter(t => t.priority === 'high')?.length || 0;

      return {
        completion: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        onTime: completedTasks > 0 ? (onTimeCompletions / completedTasks) * 100 : 0,
        priority: highPriorityTotal > 0 ? (highPriorityCompleted / highPriorityTotal) * 100 : 0,
        overall: totalTasks > 0 ? 
          ((completedTasks / totalTasks) * 0.4 + 
           (onTimeCompletions / (completedTasks || 1)) * 0.4 +
           (highPriorityCompleted / (highPriorityTotal || 1)) * 0.2) * 100 
          : 0
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return {
        completion: 0,
        onTime: 0,
        priority: 0,
        overall: 0
      };
    }
  }, [filteredTasks]);

  const pieData = useMemo(() => {
    try {
      return [
        { name: 'En Attente', value: calculatedMetrics?.pendingTasks || 0 },
        { name: 'En Cours', value: calculatedMetrics?.inProgressTasks || 0 },
        { name: 'Terminés', value: calculatedMetrics?.completedTasks || 0 }
      ];
    } catch (error) {
      console.error('Error creating pie data:', error);
      return [
        { name: 'En Attente', value: 0 },
        { name: 'En Cours', value: 0 },
        { name: 'Terminés', value: 0 }
      ];
    }
  }, [calculatedMetrics]);

  // Calculate trends based on previous period
  const trends = useMemo(() => {
    try {
      // Get previous period metrics from calculatedMetrics if available
      const previousMetrics = calculatedMetrics?.previousPeriod || null;
      
      if (!previousMetrics) {
        return {
          completion: 0,
          onTime: 0,
          priority: 0,
          overall: 0
        };
      }

      return {
        completion: metrics.completion - (previousMetrics.completion || 0),
        onTime: metrics.onTime - (previousMetrics.onTime || 0),
        priority: metrics.priority - (previousMetrics.priority || 0),
        overall: metrics.overall - (previousMetrics.overall || 0)
      };
    } catch (error) {
      console.error('Error calculating trends:', error);
      return {
        completion: 0,
        onTime: 0,
        priority: 0,
        overall: 0
      };
    }
  }, [metrics, calculatedMetrics]);

  return (
    <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50 shadow-lg">
      <div className="text-lg text-white mb-6 font-semibold flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Performance Analytics
        <PerformanceGrade score={metrics.overall} />
      </div>

      <div className="space-y-6">
        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-1 gap-4">
          <MetricCard
            title="Taux de Complétion"
            value={metrics.completion}
            trend={trends.completion}
            timeRange={timeRange}
            description="Pourcentage des tâches terminées par rapport au total"
            icon={
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <MetricCard
            title="Respect des Délais"
            value={metrics.onTime}
            trend={trends.onTime}
            timeRange={timeRange}
            description="Tâches terminées dans les délais impartis"
            icon={
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <MetricCard
            title="Gestion des Priorités"
            value={metrics.priority}
            trend={trends.priority}
            timeRange={timeRange}
            description="Taux de résolution des tâches prioritaires"
            icon={
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />

          <MetricCard
            title="Score Global"
            value={metrics.overall}
            trend={trends.overall}
            timeRange={timeRange}
            description="Performance globale basée sur tous les indicateurs"
            icon={
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
        </div>

        {/* Task Distribution Chart */}
        <div className="mt-6 bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
          <div className="text-lg text-white mb-4 font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Distribution des Tâches
          </div>
          
          <div className="h-48 relative group">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  label={renderCustomizedLabel}
                  labelLine={false}
                  animationBegin={0}
                  animationDuration={1500}
                  className="transition-transform duration-300 group-hover:scale-105"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      className="transition-all duration-300 hover:brightness-110 hover:filter"
                      style={{
                        filter: `drop-shadow(0 0 8px ${PIE_COLORS[index % PIE_COLORS.length]}66)`
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const entry = payload[0].payload;
                      const total = pieData.reduce((sum, p) => sum + p.value, 0);
                      const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
                      
                      return (
                        <div className="bg-gray-900/95 px-4 py-3 rounded-lg border border-gray-700/50 shadow-xl backdrop-blur-xl">
                          <div className="text-gray-300 font-medium">{entry.name}</div>
                          <div className="text-white font-bold text-lg">{entry.value} tâches</div>
                          <div className="text-gray-400 text-sm">{percentage}% du total</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 pt-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ 
                      backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                      boxShadow: `0 0 10px ${PIE_COLORS[index % PIE_COLORS.length]}66`
                    }}
                  />
                  <span className="text-sm text-gray-400">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}