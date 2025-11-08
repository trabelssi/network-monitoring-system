import React from 'react';

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

const StatCard = ({ title, value, change, isPositive, timeRange }) => {
  // Validate and format value
  const formattedValue = React.useMemo(() => {
    try {
      return typeof value === 'number' ? value : parseInt(value, 10) || 0;
    } catch (error) {
      console.error('Error formatting value:', error);
      return 0;
    }
  }, [value]);

  // Validate and format change text
  const formattedChange = React.useMemo(() => {
    try {
      return typeof change === 'string' ? change : 'Pas de données';
    } catch (error) {
      console.error('Error formatting change:', error);
      return 'Pas de données';
    }
  }, [change]);

  return (
    <div className="bg-gradient-to-br from-slate-900/60 via-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/70 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">
            {title}
            {timeRange !== 'all' && (
              <span className="text-blue-400 text-xs ml-2">• {getTimeRangeLabel(timeRange)}</span>
            )}
          </h3>
          <div className="text-3xl font-bold text-white">{formattedValue}</div>
          <div className={`text-sm mt-1 font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {formattedChange}
          </div>
        </div>
        <div className={`p-3 rounded-xl transform transition-transform duration-300 hover:rotate-12 ${
          isPositive 
            ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
            : 'bg-gradient-to-r from-red-500 to-pink-500'
        }`}>
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                isPositive
                  ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  : "M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"
              }
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default function StatsCards({ stats = [], timeRange = 'all' }) {
  // Validate stats array
  const validStats = React.useMemo(() => {
    try {
      if (!Array.isArray(stats)) {
        console.error('Stats must be an array');
        return [];
      }

      return stats.filter(stat => {
        const isValid = 
          stat &&
          typeof stat === 'object' &&
          'key' in stat &&
          'title' in stat &&
          'value' in stat &&
          'change' in stat;

        if (!isValid) {
          console.warn('Invalid stat object:', stat);
        }

        return isValid;
      });
    } catch (error) {
      console.error('Error validating stats:', error);
      return [];
    }
  }, [stats]);

  if (validStats.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-slate-900/60 via-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-slate-500 to-slate-600 p-2 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">Aucune donnée disponible</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {validStats.map(stat => (
        <StatCard
          key={stat.key}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          isPositive={stat.isPositive}
          timeRange={timeRange}
        />
      ))}
    </div>
  );
}