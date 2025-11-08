import React, { useState, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, Sector, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

// Define a color map for different statuses
const COLOR_MAP = {
    'En attente': '#FFBB28', // Yellow
    'En cours': '#0088FE',   // Blue
    'Terminées': '#00C49F', // Green
    'Acceptées': '#00C49F', // Green
    'Refusées': '#FF6363',   // Red
    'pending': '#FFBB28', // Fallback for pending
};
const DEFAULT_COLOR = '#8884d8'; // Purple fallback

// Custom active shape for the pie chart
const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill} className="text-xl font-bold">
                {payload.name}
            </text>
            <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#999">
                {`(Total ${value})`}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 6}
                outerRadius={outerRadius + 10}
                fill={fill}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#fff">{`${(percent * 100).toFixed(2)}%`}</text>
        </g>
    );
};

// Custom tooltip
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg shadow-lg">
                <p className="label text-cyan-400">{`${payload[0].name} : ${payload[0].value}`}</p>
                <p className="desc text-white">{`Pourcentage: ${(payload[0].percent * 100).toFixed(2)}%`}</p>
            </div>
        );
    }
    return null;
};

export default function TaskPieChart({ data, title }) {
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = useCallback((_, index) => {
        setActiveIndex(index);
    }, [setActiveIndex]);

    const totalValue = data.reduce((sum, entry) => sum + entry.value, 0);

    if (totalValue === 0) {
        return (
            <div className="p-6 h-full flex flex-col justify-center items-center rounded-2xl shadow-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-md border border-white/10">
                <h2 className="text-xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-4">
                    {title}
                </h2>
                <p className="text-gray-400">Aucune donnée disponible.</p>
            </div>
        )
    }

    return (
        <div className="p-6 rounded-2xl shadow-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-md border border-white/10">
            <h2 className="text-xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-4">
                {title}
            </h2>
            
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            dataKey="value"
                            onMouseEnter={onPieEnter}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLOR_MAP[entry.name] || DEFAULT_COLOR} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
                {data.map((entry, index) => (
                    <motion.div
                        key={`legend-${index}`}
                        className="flex items-center text-sm cursor-pointer"
                        onMouseEnter={() => setActiveIndex(index)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: COLOR_MAP[entry.name] || DEFAULT_COLOR }}
                        />
                        <span className={`font-semibold ${index === activeIndex ? 'text-white' : 'text-gray-400'}`}>
                            {entry.name} ({entry.value})
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
