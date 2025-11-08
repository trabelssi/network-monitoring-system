import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { motion } from "framer-motion";
import { AiOutlineInfoCircle } from "react-icons/ai";

// Register chart components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TaskBarChart = ({ labels, dataPoints }) => {
  const [activeTask, setActiveTask] = useState(null);

  const data = {
    labels,
    datasets: [
      {
        label: "Mes Tickets",
        data: dataPoints,
        backgroundColor: [
          "#3b82f6", // Blue
          "#f59e0b", // Yellow
          "#10b981", // Green
          "#FF6363", // Red
          "#6B8E23", // Olive Green
          "#F472B6", // Pink
          "#60A5FA"  // Light Blue
        ],
        borderRadius: 20, // Rounded corners
        barThickness: 50, // Thicker bars for more impact
        hoverBackgroundColor: "#F59E0B",
        hoverBorderColor: "#1F2937",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(30, 41, 59, 0.9)",
        bodyColor: "#fff",
        titleColor: "#A78BFA",
        cornerRadius: 8,
        padding: 12,
        bodyFont: { size: 14, weight: "600" },
        titleFont: { size: 16, weight: "bold" },
        caretSize: 10,
      },
      title: {
        display: true,
        text: "Aperçu de Mes Tickets",
        color: "#1f2937",
        font: { size: 24, weight: "bold" },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#1f2937",
          font: { size: 14, weight: "600" },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#1f2937",
          font: { size: 14, weight: "600" },
        },
        grid: {
          color: "#e5e7eb",
        },
      },
    },
  };

  const handleBarClick = (index) => {
    setActiveTask(index);
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 p-8 rounded-2xl shadow-2xl w-full max-w-2xl mx-auto relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Title Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            📊 Distribution de Mes Tickets
          </h2>
          <div className="text-white text-sm flex items-center">
            <AiOutlineInfoCircle className="mr-2" />
            <span>Cliquez sur les barres pour plus de détails</span>
          </div>
        </div>

        {/* Bar Chart */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Bar
            data={data}
            options={options}
            onClick={(e, elements) => {
              if (elements.length > 0) {
                const index = elements[0]._index;
                handleBarClick(index);
              }
            }}
          />
        </motion.div>

        {/* Hover Effects with Interactive Feedback */}
        <motion.div
          className={`absolute top-16 left-1/2 transform -translate-x-1/2 text-center transition-all duration-300 ${
            activeTask !== null ? "opacity-100" : "opacity-0"
          }`}
        >
          <motion.div
            className="text-white font-semibold py-2 px-4 bg-gradient-to-r from-blue-400 to-green-400 rounded-xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-lg">
              {activeTask !== null
                ? `Vous avez cliqué sur la Tâche : ${labels[activeTask]}`
                : "Survolez les barres pour voir les détails !"}
            </span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Floating Detail Card for Selected Task */}
      {activeTask !== null && (
        <motion.div
          className="absolute bottom-16 left-1/2 transform -translate-x-1/2 p-4 bg-white shadow-lg rounded-xl w-72"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <h3 className="text-xl font-bold">{labels[activeTask]}</h3>
          <p className="mt-2 text-gray-600">
            Les informations détaillées sur la tâche apparaissent ici. Vous pouvez expliquer la
            progression de la tâche, son importance et les étapes nécessaires pour la compléter.
          </p>
          <motion.button
            className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
            onClick={() => setActiveTask(null)} // Close the detail card
          >
            Fermer
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default TaskBarChart;
