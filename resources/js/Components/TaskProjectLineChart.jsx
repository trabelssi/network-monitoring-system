import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import { useState, useMemo, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { subDays, startOfMonth } from 'date-fns';
import { motion } from 'framer-motion';

const COLORS = ['#60a5fa', '#34D399', '#f87171', '#fbbf24', '#a78bfa', '#10b981', '#f472b6'];

const ranges = [
  { label: "Tout", range: [null, null] },
  { label: "Aujourd'hui", range: [new Date(), new Date()] },
  { label: "7 Derniers Jours", range: [subDays(new Date(), 6), new Date()] },
  { label: "Ce Mois", range: [startOfMonth(new Date()), new Date()] },
  { label: "Personnalisé", range: ["custom", "custom"] },
];

const filterData = (data, start, end) =>
  data.filter(d => {
    const date = new Date(d.date).getTime();
    return (!start || date >= start.getTime()) && (!end || date <= end.getTime());
  });

const TaskProjectLineChart = ({ data }) => {
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);
  const [selectedRange, setSelectedRange] = useState("All");
  const [chartType, setChartType] = useState("line");
  const [aiSummary, setAiSummary] = useState("");

  const [startDate, endDate] = useMemo(() => {
    const range = ranges.find(r => r.label === selectedRange)?.range || [null, null];
    if (range[0] === "custom") return [customStart, customEnd];
    return range;
  }, [selectedRange, customStart, customEnd]);

  const filteredData = useMemo(() => {
    return filterData(data, startDate, endDate);
  }, [data, startDate, endDate]);

  const projectNames = useMemo(() => {
    return data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'date') : [];
  }, [data]);

  const finalCounts = useMemo(() => {
    return projectNames.reduce((acc, name) => {
      const last = filteredData.slice().reverse().find(d => d[name] !== undefined);
      acc[name] = last ? last[name] : 0;
      return acc;
    }, {});
  }, [filteredData, projectNames]);

  useEffect(() => {
    // Simulate AI summary generation
    const totalTasks = projectNames.reduce((sum, name) => sum + (finalCounts[name] || 0), 0);
    setAiSummary(`In the selected period, a total of ${totalTasks} tasks were created across all projects.`);
  }, [finalCounts, projectNames]);

  const renderLegend = () => (
    <div className="flex flex-wrap gap-3 justify-center mt-4">
      {projectNames.map((name, index) => (
        <motion.div
          key={name}
          className="flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm hover:scale-105 transition-transform"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <span className="w-3 h-3 mr-2 inline-block rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
          <span className="text-white text-sm font-semibold truncate">{name}</span>
          <span className="ml-2 text-gray-300 text-xs">({finalCounts[name]} tickets)</span>
        </motion.div>
      ))}
    </div>
  );

  const renderChart = () => (
    <ResponsiveContainer width="100%" height={320}>
      {chartType === "line" ? (
        <LineChart data={filteredData}>
          <CartesianGrid stroke="#3f3f46" strokeDasharray="5 5" />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={50}
            tick={{ fill: "#ccc", fontSize: 10, fontWeight: 600 }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#ccc", fontSize: 10, fontWeight: 600 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(30, 41, 59, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 10,
              color: "#fff",
              fontSize: "12px"
            }}
          />
          {projectNames.map((name, index) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
              isAnimationActive
            />
          ))}
        </LineChart>
      ) : (
        <BarChart data={filteredData}>
          <CartesianGrid stroke="#3f3f46" strokeDasharray="5 5" />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={50}
            tick={{ fill: "#ccc", fontSize: 10, fontWeight: 600 }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#ccc", fontSize: 10, fontWeight: 600 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(30, 41, 59, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 10,
              color: "#fff",
              fontSize: "12px"
            }}
          />
          {projectNames.map((name, index) => (
            <Bar
              key={name}
              dataKey={name}
              fill={COLORS[index % COLORS.length]}
              isAnimationActive
            />
          ))}
        </BarChart>
      )}
    </ResponsiveContainer>
  );

  return (
    <div className="p-6 rounded-2xl shadow-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-md border border-white/10">
      <h2 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-6">
        📊 Chronologie des Tickets par Projet
      </h2>

      {/* AI Summary */}
      <motion.div
        className="text-center text-white mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p>{aiSummary}</p>
      </motion.div>

      {/* Quick Ranges */}
      <div className="flex flex-wrap justify-center gap-3 mb-4">
        {ranges.map(({ label }) => (
          <button
            key={label}
            onClick={() => setSelectedRange(label)}
            className={`px-3 py-1 rounded-md text-sm shadow transition ${
              selectedRange === label
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom Date Pickers */}
      {selectedRange === "Custom" && (
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          <div className="text-white text-sm">
            <label>Début</label>
            <DatePicker
              selected={customStart}
              onChange={setCustomStart}
              dateFormat="yyyy-MM-dd"
              className="p-1 rounded text-black"
              placeholderText="Sélectionner la date de début"
            />
          </div>
          <div className="text-white text-sm">
            <label>Fin</label>
            <DatePicker
              selected={customEnd}
              onChange={setCustomEnd}
              dateFormat="yyyy-MM-dd"
              className="p-1 rounded text-black"
              placeholderText="Sélectionner la date de fin"
              minDate={customStart}
            />
          </div>
        </div>
      )}

      {/* Chart Type Toggle */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => setChartType(chartType === "line" ? "bar" : "line")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
        >
          Toggle to {chartType === "line" ? "Graphique en Barres" : "Graphique en Ligne"}
        </button>
      </div>

      {/* Chart */}
      {filteredData.length > 0 ? renderChart() : (
        <p className="text-center text-gray-400 mt-8">Aucune donnée pour la période sélectionnée</p>
      )}

      {/* Legend */}
      {renderLegend()}
    </div>
  );
};

export default TaskProjectLineChart;
