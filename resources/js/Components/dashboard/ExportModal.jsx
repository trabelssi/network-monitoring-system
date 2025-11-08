import React from 'react';

export default function ExportModal({ showExportModal, setShowExportModal, exportData }) {
  return (
    showExportModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-6 w-96 border border-gray-700 shadow-xl">
          <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">Exporter les Données</h3>
          <div className="space-y-3">
            <button
              onClick={() => { exportData('json'); setShowExportModal(false); }}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 hover:scale-105"
            >
              Exporter en JSON
            </button>
            <button
              onClick={() => { exportData('csv'); setShowExportModal(false); }}
              className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 hover:scale-105"
            >
              Exporter en CSV
            </button>
            <button
              onClick={() => setShowExportModal(false)}
              className="w-full px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    )
  );
}