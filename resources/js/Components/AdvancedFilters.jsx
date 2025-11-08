import { 
    AdjustmentsHorizontalIcon,
    XMarkIcon,
    ListBulletIcon,
    CubeIcon,
    TagIcon,
    FlagIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';

export default function AdvancedFilters({ 
    localQueryParams,
    projectsList,
    selectedProjectProducts,
    dateRange,
    isLoading,
    handleProjectChange,
    handleProductChange,
    handleFilterChange,
    setDateRange,
    handleDateRangeChange,
    clearAllFilters
}) {
    return (
        <div className="mt-4 space-y-6 p-6 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-xl rounded-xl shadow-2xl border border-cyan-500/20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                        <AdjustmentsHorizontalIcon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white">Filtres avancés</h3>
                </div>
                {(localQueryParams.project_id || 
                  localQueryParams.product_id || 
                  localQueryParams.status || 
                  localQueryParams.priority || 
                  localQueryParams.date_start || 
                  localQueryParams.date_end) && (
                    <button
                        onClick={clearAllFilters}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 transition-all duration-300 rounded-full border border-red-500/40 hover:border-red-500/60 hover:shadow-lg hover:shadow-red-500/10"
                    >
                        <XMarkIcon className="w-4 h-4" />
                        <span>Réinitialiser les filtres</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Project Filter */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 shadow-xl transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/10">
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <ListBulletIcon className="w-4 h-4 text-cyan-400" />
                        Machine
                    </label>
                    <select
                        value={localQueryParams.project_id || ''}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base bg-black/40 border-2 border-cyan-500/30 focus:border-cyan-500 text-white rounded-lg focus:ring-2 focus:ring-cyan-500/40 transition-all duration-300"
                    >
                        <option value="">Toutes les machines</option>
                        {projectsList.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Product Filter */}
                {localQueryParams.project_id && selectedProjectProducts.length > 0 && (
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10 shadow-xl transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/10">
                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                            <CubeIcon className="w-4 h-4 text-cyan-400" />
                            Produit
                        </label>
                        <select
                            value={localQueryParams.product_id || ''}
                            onChange={(e) => handleProductChange(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base bg-black/40 border-2 border-cyan-500/30 focus:border-cyan-500 text-white rounded-lg focus:ring-2 focus:ring-cyan-500/40 transition-all duration-300"
                        >
                            <option value="">Tous les produits</option>
                            {selectedProjectProducts.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Status Filter */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 shadow-xl transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/10">
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <TagIcon className="w-4 h-4 text-cyan-400" />
                        Status
                    </label>
                    <select
                        value={localQueryParams.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base bg-black/40 border-2 border-cyan-500/30 focus:border-cyan-500 text-white rounded-lg focus:ring-2 focus:ring-cyan-500/40 transition-all duration-300"
                    >
                        <option value="">Tous les status</option>
                        <option value="pending">En attente</option>
                        <option value="in-progress">En cours</option>
                        <option value="completed">Terminé</option>
                    </select>
                </div>

                {/* Priority Filter */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 shadow-xl transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/10">
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <FlagIcon className="w-4 h-4 text-cyan-400" />
                        Priorité
                    </label>
                    <select
                        value={localQueryParams.priority || ''}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base bg-black/40 border-2 border-cyan-500/30 focus:border-cyan-500 text-white rounded-lg focus:ring-2 focus:ring-cyan-500/40 transition-all duration-300"
                    >
                        <option value="">Toutes les priorités</option>
                        <option value="low">Basse</option>
                        <option value="medium">Moyenne</option>
                        <option value="high">Haute</option>
                    </select>
                </div>

                {/* Date Range Filters */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 shadow-xl transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/10">
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-cyan-400" />
                        Date de début
                    </label>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => {
                            setDateRange(prev => ({ ...prev, start: e.target.value }));
                            if (e.target.value && dateRange.end) {
                                handleDateRangeChange(e.target.value, dateRange.end);
                            }
                        }}
                        className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base bg-black/40 border-2 border-cyan-500/30 focus:border-cyan-500 text-white rounded-lg focus:ring-2 focus:ring-cyan-500/40 transition-all duration-300"
                    />
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10 shadow-xl transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/10">
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-cyan-400" />
                        Date de fin
                    </label>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => {
                            setDateRange(prev => ({ ...prev, end: e.target.value }));
                            if (e.target.value && dateRange.start) {
                                handleDateRangeChange(dateRange.start, e.target.value);
                            }
                        }}
                        min={dateRange.start}
                        className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base bg-black/40 border-2 border-cyan-500/30 focus:border-cyan-500 text-white rounded-lg focus:ring-2 focus:ring-cyan-500/40 transition-all duration-300"
                    />
                </div>
            </div>

            {/* Date Quick Filters */}
            <div className="pt-2">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => {
                            const today = new Date();
                            const start = today.toISOString().split('T')[0];
                            const end = start;
                            setDateRange({ start, end });
                            handleDateRangeChange(start, end);
                        }}
                        className="px-4 py-2 text-sm bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-all duration-300 border border-cyan-500/30 hover:border-cyan-500/50 flex items-center gap-2"
                        disabled={isLoading}
                    >
                        <CalendarIcon className="w-4 h-4" />
                        Aujourd'hui
                    </button>
                    <button
                        onClick={() => {
                            const today = new Date();
                            const start = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
                            const end = new Date().toISOString().split('T')[0];
                            setDateRange({ start, end });
                            handleDateRangeChange(start, end);
                        }}
                        className="px-4 py-2 text-sm bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-all duration-300 border border-cyan-500/30 hover:border-cyan-500/50 flex items-center gap-2"
                        disabled={isLoading}
                    >
                        <CalendarIcon className="w-4 h-4" />
                        7 derniers jours
                    </button>
                    <button
                        onClick={() => {
                            const today = new Date();
                            const start = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
                            const end = new Date().toISOString().split('T')[0];
                            setDateRange({ start, end });
                            handleDateRangeChange(start, end);
                        }}
                        className="px-4 py-2 text-sm bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-all duration-300 border border-cyan-500/30 hover:border-cyan-500/50 flex items-center gap-2"
                        disabled={isLoading}
                    >
                        <CalendarIcon className="w-4 h-4" />
                        30 derniers jours
                    </button>
                </div>
            </div>
        </div>
    );
}