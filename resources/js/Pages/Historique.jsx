import { useState, useMemo, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { format, isToday, isYesterday, isSameWeek, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { 
    MagnifyingGlassIcon, 
    CalendarIcon, 
    ArrowPathIcon,
    FunnelIcon,
    DocumentTextIcon,
    UserIcon,
    ClockIcon,
    ChevronLeftIcon,
    EyeIcon,
    ArrowDownTrayIcon,
    ChartBarIcon,
    AdjustmentsHorizontalIcon,
    XMarkIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import debounce from 'lodash/debounce';

// Action type translations
const actionTranslations = {
    // Task actions
    'create_task': 'Création de ticket',
    'update_task': 'Mise à jour de ticket',
    'delete_task': 'Suppression de ticket',
    
    // Intervention actions
    'create_intervention': 'Création d\'intervention',
    'update_intervention': 'Mise à jour d\'intervention',
    'delete_intervention': 'Suppression d\'intervention',
    
    // Project actions
    'create_project': 'Création de machine',
    'update_project': 'Mise à jour de machine',
    'delete_project': 'Suppression de machine'
};

// Get route based on model type and ID
const getViewRoute = (modelType, modelId) => {
    try {
        switch (modelType) {
            case 'Task':
                return route('task.show', modelId);
            case 'Intervention':
                return route('interventions.show', modelId);
            case 'Project':
                return route('projects.show', modelId);
            default:
                return null;
        }
    } catch (error) {
        console.error('Error getting route:', error);
        return null;
    }
};

function Pagination({ links }) {
    return (
        <div className="flex flex-wrap justify-center gap-x-1">
            {links.map((link, key) => {
                return link.url === null ? (
                    <div
                        key={key}
                        className="px-4 py-2 text-gray-400 bg-black/40 border border-white/10 rounded-md"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <Link
                        key={key}
                        href={link.url}
                        className={`px-4 py-2 border rounded-md transition-all duration-200 ${
                            link.active
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                                : 'bg-black/40 text-white/80 hover:bg-white/10 border-white/10'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </div>
    );
}

// Add grouping function
const groupActivitiesByDate = (activities) => {
    const groups = activities.reduce((acc, activity) => {
        const date = new Date(activity.created_at);
        let groupTitle;

        if (isToday(date)) {
            groupTitle = "Aujourd'hui";
        } else if (isYesterday(date)) {
            groupTitle = "Hier";
        } else if (isSameWeek(date, new Date())) {
            groupTitle = "Cette semaine";
        } else if (isSameMonth(date, new Date())) {
            groupTitle = "Ce mois";
        } else {
            groupTitle = format(date, 'MMMM yyyy', { locale: fr });
        }

        if (!acc[groupTitle]) {
            acc[groupTitle] = [];
        }
        acc[groupTitle].push(activity);
        return acc;
    }, {});

    return Object.entries(groups);
};

// Add filter categories
const filterCategories = {
    tasks: ['create_task', 'update_task', 'delete_task'],
    interventions: ['create_intervention', 'update_intervention', 'delete_intervention'],
    projects: ['create_project', 'update_project', 'delete_project']
};

// Add loading states for different filter types
const LoadingStates = {
    SEARCH: 'search',
    DATE: 'date',
    ACTION: 'action'
};

export default function Historique({ auth, activities, filters, actions }) {
    const [searchParams, setSearchParams] = useState({
        search: filters.search || '',
        date_from: filters.date_from ? new Date(filters.date_from) : null,
        date_to: filters.date_to ? new Date(filters.date_to) : null,
        action: filters.action || '',
        category: filters.category || 'all',
        searchType: filters.searchType || 'all'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [loadingState, setLoadingState] = useState(null);
    const [showStats, setShowStats] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState(
        filters.action ? filters.action.split(',') : []
    );

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((params) => {
            const queryParams = new URLSearchParams();
            
            if (params.search) {
                queryParams.append('search', params.search);
                queryParams.append('searchType', params.searchType);
            }
            if (params.date_from) queryParams.append('date_from', format(params.date_from, 'yyyy-MM-dd'));
            if (params.date_to) queryParams.append('date_to', format(params.date_to, 'yyyy-MM-dd'));
            if (params.action) queryParams.append('action', params.action);
            
            router.get(`/historique?${queryParams.toString()}`, {}, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onBefore: () => setIsLoading(true),
                onFinish: () => {
                    setIsLoading(false);
                    setLoadingState(null);
                }
            });
        }, 300),
        []
    );

    // Handle search input change
    const handleSearchChange = (value) => {
        const newParams = { ...searchParams, search: value };
        setSearchParams(newParams);
        setLoadingState(LoadingStates.SEARCH);
        debouncedSearch(newParams);
    };

    // Handle date change
    const handleDateChange = (type, date) => {
        const newParams = { ...searchParams, [type]: date };
        setSearchParams(newParams);
        setLoadingState(LoadingStates.DATE);
        debouncedSearch(newParams);
    };

    // Handle filter selection
    const handleFilterToggle = (filter) => {
        const newFilters = selectedFilters.includes(filter)
            ? selectedFilters.filter(f => f !== filter)
            : [...selectedFilters, filter];
        
        setSelectedFilters(newFilters);
        const newParams = { ...searchParams, action: newFilters.join(',') };
        setSearchParams(newParams);
        setLoadingState(LoadingStates.ACTION);
        debouncedSearch(newParams);
    };

    // Reset all filters
    const resetAllFilters = () => {
        setSearchParams({
            search: '',
            date_from: null,
            date_to: null,
            action: '',
            category: 'all',
            searchType: 'all'
        });
        setSelectedFilters([]);
        router.get('/historique', {}, {
            preserveState: true,
            preserveScroll: true,
            onBefore: () => setIsLoading(true),
            onFinish: () => {
                setIsLoading(false);
                setLoadingState(null);
            }
        });
    };

    // Calculate activity statistics
    const activityStats = useMemo(() => {
        if (!activities.data.length) return null;

        const stats = {
            total: activities.total,
            byType: {},
            byUser: {},
            mostActive: {
                hour: { count: 0, hour: 0 },
                day: { count: 0, day: '' }
            }
        };

        // Process activities for stats
        activities.data.forEach(activity => {
            // Count by type
            stats.byType[activity.action] = (stats.byType[activity.action] || 0) + 1;

            // Count by user
            if (activity.user?.name) {
                stats.byUser[activity.user.name] = (stats.byUser[activity.user.name] || 0) + 1;
            }

            // Most active hour and day
            const date = new Date(activity.created_at);
            const hour = date.getHours();
            const day = format(date, 'EEEE', { locale: fr });

            const hourKey = `${hour}`;
            const dayKey = day;

            if (!stats.mostActive.hour[hourKey]) stats.mostActive.hour[hourKey] = 0;
            if (!stats.mostActive.day[dayKey]) stats.mostActive.day[dayKey] = 0;

            stats.mostActive.hour[hourKey]++;
            stats.mostActive.day[dayKey]++;
        });

        // Find most active hour and day
        Object.entries(stats.mostActive.hour).forEach(([hour, count]) => {
            if (count > stats.mostActive.hour.count) {
                stats.mostActive.hour = { count, hour: parseInt(hour) };
            }
        });

        Object.entries(stats.mostActive.day).forEach(([day, count]) => {
            if (count > stats.mostActive.day.count) {
                stats.mostActive.day = { count, day };
            }
        });

        return stats;
    }, [activities.data, activities.total]);

    // Export activities to CSV
    const exportToCSV = () => {
        const headers = ['Date', 'Utilisateur', 'Action', 'Description'];
        const csvContent = activities.data.map(activity => [
            formatDate(activity.created_at),
            activity.user?.name || 'Utilisateur inconnu',
            actionTranslations[activity.action] || activity.action,
            activity.description
        ]);

        const csv = [
            headers.join(','),
            ...csvContent.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `activites_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
    };

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Date invalide';
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                            <DocumentTextIcon className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                            Journal d'Activités
                            <span className="ml-2 inline-flex items-center justify-center px-2.5 py-0.5 text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full">
                                {activities.total} activités
                            </span>
                        </h2>
                    </div>
                    <Link
                        href={route('dashboard')}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                        <span className="relative">
                            Retour au Tableau de Bord
                            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-white/50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                        </span>
                    </Link>
                </div>
            }
        >
            <Head title="Historique" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <button
                                type="button"
                                onClick={() => setShowStats(!showStats)}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-300"
                            >
                                <ChartBarIcon className="h-5 w-5 mr-2" />
                                {showStats ? 'Masquer les statistiques' : 'Afficher les statistiques'}
                            </button>
                            <div className="h-6 w-px bg-white/10"></div>
                            <span className="text-sm text-white/60">
                                {activities.total} activité{activities.total > 1 ? 's' : ''} au total
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={exportToCSV}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-lg hover:from-emerald-500/30 hover:to-green-500/30 transition-all duration-300"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                            Exporter en CSV
                        </button>
                    </div>

                    {/* Stats Panel */}
                    {showStats && activityStats && (
                        <div className="mb-8 bg-black/40 backdrop-blur-lg rounded-lg border border-white/10 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-4 border border-cyan-500/30">
                                    <h4 className="text-sm font-medium text-white/60 mb-2">Total des activités</h4>
                                    <p className="text-2xl font-bold text-white">{activityStats.total}</p>
                                </div>
                                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-4 border border-cyan-500/30">
                                    <h4 className="text-sm font-medium text-white/60 mb-2">Heure la plus active</h4>
                                    <p className="text-2xl font-bold text-white">
                                        {activityStats.mostActive.hour.hour}h00 ({activityStats.mostActive.hour.count} activités)
                                    </p>
                                </div>
                                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-4 border border-cyan-500/30">
                                    <h4 className="text-sm font-medium text-white/60 mb-2">Jour le plus actif</h4>
                                    <p className="text-2xl font-bold text-white">
                                        {activityStats.mostActive.day.day} ({activityStats.mostActive.day.count} activités)
                                    </p>
                                </div>
                                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-4 border border-cyan-500/30">
                                    <h4 className="text-sm font-medium text-white/60 mb-2">Types d'actions</h4>
                                    <p className="text-2xl font-bold text-white">{Object.keys(activityStats.byType).length}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-black/40 backdrop-blur-lg overflow-hidden shadow-sm sm:rounded-lg border border-white/10">
                        {/* Show filters section only for admin users */}
                        {auth.user.role === 'admin' && (
                            <div className="p-6 border-b border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-white">Filtres de recherche</h3>
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="inline-flex items-center px-3 py-2 border border-cyan-500/30 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300"
                                    >
                                        <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                                        {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
                                    </button>
                                </div>

                                {showFilters && (
                                    <div className={`space-y-6 transition-all duration-300 ${
                                        showFilters ? 'transform translate-y-0 opacity-100' : 'transform -translate-y-4 opacity-0'
                                    }`}>
                                        {/* Enhanced Search Input with Type Selection */}
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-1 relative">
                                                    <label className="block text-sm font-medium text-white/80 mb-1">Recherche</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={searchParams.search}
                                                            onChange={(e) => handleSearchChange(e.target.value)}
                                                            className="block w-full pl-10 pr-12 py-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder-white/40 focus:border-cyan-500 focus:ring-cyan-500 transition-all duration-300"
                                                            placeholder={searchParams.searchType === 'user' ? "Rechercher par nom d'utilisateur..." : "Rechercher dans les activités..."}
                                                        />
                                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                            {loadingState === LoadingStates.SEARCH ? (
                                                                <svg className="animate-spin h-5 w-5 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                            ) : (
                                                                <MagnifyingGlassIcon className="h-5 w-5 text-white/40" />
                                                            )}
                                                        </div>
                                                        {searchParams.search && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSearchChange('')}
                                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
                                                            >
                                                                <XMarkIcon className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="w-48">
                                                    <label className="block text-sm font-medium text-white/80 mb-1">Type de recherche</label>
                                                    <select
                                                        value={searchParams.searchType}
                                                        onChange={(e) => {
                                                            const newParams = { ...searchParams, searchType: e.target.value };
                                                            setSearchParams(newParams);
                                                            debouncedSearch(newParams);
                                                        }}
                                                        className="block w-full py-2 px-3 rounded-lg bg-black/40 border border-white/10 text-white focus:border-cyan-500 focus:ring-cyan-500 transition-all duration-300"
                                                    >
                                                        <option value="all">Tout</option>
                                                        <option value="user">Nom d'utilisateur</option>
                                                        <option value="description">Description</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Date Range Picker */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="relative">
                                                <label className="block text-sm font-medium text-white/80 mb-1">Date de début</label>
                                                <div className="relative">
                                                    <DatePicker
                                                        selected={searchParams.date_from}
                                                        onChange={(date) => handleDateChange('date_from', date)}
                                                        className="block w-full pl-10 pr-12 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-white/40 focus:border-cyan-500 focus:ring-cyan-500"
                                                        dateFormat="dd/MM/yyyy"
                                                        placeholderText="Sélectionner une date"
                                                        locale={fr}
                                                        isClearable
                                                    />
                                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                        {loadingState === LoadingStates.DATE ? (
                                                            <svg className="animate-spin h-5 w-5 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                        ) : (
                                                            <CalendarIcon className="h-5 w-5 text-white/40" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <label className="block text-sm font-medium text-white/80 mb-1">Date de fin</label>
                                                <div className="relative">
                                                    <DatePicker
                                                        selected={searchParams.date_to}
                                                        onChange={(date) => handleDateChange('date_to', date)}
                                                        className="block w-full pl-10 pr-12 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-white/40 focus:border-cyan-500 focus:ring-cyan-500"
                                                        dateFormat="dd/MM/yyyy"
                                                        placeholderText="Sélectionner une date"
                                                        locale={fr}
                                                        isClearable
                                                    />
                                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                        {loadingState === LoadingStates.DATE ? (
                                                            <svg className="animate-spin h-5 w-5 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                        ) : (
                                                            <CalendarIcon className="h-5 w-5 text-white/40" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Type Filters */}
                                        <div className="space-y-4">
                                            <label className="block text-sm font-medium text-white/80">Types d'actions</label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {Object.entries(filterCategories).map(([category, categoryActions]) => (
                                                    <div key={category} className="bg-black/20 rounded-lg p-4 border border-white/10">
                                                        <h4 className="text-sm font-medium text-white/80 mb-3 capitalize">
                                                            {category === 'tasks' ? 'Tickets' : 
                                                             category === 'interventions' ? 'Interventions' : 'Machines'}
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {categoryActions.map(action => (
                                                                <label key={action} className="flex items-center space-x-2 cursor-pointer group">
                                                                    <div className="relative">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedFilters.includes(action)}
                                                                            onChange={() => handleFilterToggle(action)}
                                                                            className="form-checkbox h-4 w-4 text-cyan-500 border-white/30 rounded focus:ring-cyan-500 focus:ring-offset-0 bg-black/40 transition-all duration-300"
                                                                        />
                                                                        {loadingState === LoadingStates.ACTION && selectedFilters.includes(action) && (
                                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                                <svg className="animate-spin h-4 w-4 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                                </svg>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors duration-300">
                                                                        {actionTranslations[action]}
                                                                    </span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                            <button
                                                type="button"
                                                onClick={resetAllFilters}
                                                className="inline-flex items-center px-4 py-2 border border-white/10 rounded-lg text-sm font-medium text-white/70 hover:text-white bg-black/40 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300"
                                            >
                                                <ArrowPathIcon className="h-5 w-5 mr-2" />
                                                Réinitialiser
                                            </button>
                                            <div className="flex items-center space-x-3">
                                                <span className="text-sm text-white/60">
                                                    {selectedFilters.length} filtre(s) sélectionné(s)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Activities Table with Loading State */}
                        <div className="relative">
                            {isLoading && (
                                <div className={`absolute inset-0 flex items-center justify-center bg-black/70 z-10 rounded-lg backdrop-blur-sm transition-opacity duration-150 ${
                                    isLoading ? 'opacity-100' : 'opacity-0'
                                }`}>
                                    <svg className="animate-spin h-8 w-8 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                    </svg>
                                </div>
                            )}

                            {/* Activities Table */}
                            <div className="overflow-x-auto">
                                {activities.data.length > 0 ? (
                                    groupActivitiesByDate(activities.data).map(([groupTitle, groupActivities]) => (
                                        <div key={groupTitle} className="mb-8">
                                            <div className="px-6 py-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-l-4 border-cyan-500">
                                                <h3 className="text-lg font-semibold text-white">{groupTitle}</h3>
                                            </div>
                                            <table className="min-w-full divide-y divide-white/10">
                                                <thead className="bg-black/40">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                                                            <div className="flex items-center space-x-1">
                                                                <ClockIcon className="h-4 w-4" />
                                                                <span>Date</span>
                                                            </div>
                                                        </th>
                                                        {auth.user.role === 'admin' && (
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                                                                <div className="flex items-center space-x-1">
                                                                    <UserIcon className="h-4 w-4" />
                                                                    <span>Utilisateur</span>
                                                                </div>
                                                            </th>
                                                        )}
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                                                            <div className="flex items-center space-x-1">
                                                                <DocumentTextIcon className="h-4 w-4" />
                                                                <span>Action</span>
                                                            </div>
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                                                            Description
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                                                            <div className="flex items-center space-x-1">
                                                                <EyeIcon className="h-4 w-4" />
                                                                <span>Voir</span>
                                                            </div>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-black/40 divide-y divide-white/10">
                                                    {groupActivities.map((activity) => {
                                                        
                                                        return (
                                                            <tr key={activity.id} className="hover:bg-white/5 transition-colors duration-150">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                                                                    {formatDate(activity.created_at)}
                                                                </td>
                                                                {auth.user.role === 'admin' && (
                                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${activity.user && (!activity.user.is_active || activity.user.deleted_at) ? 'text-red-500 line-through' : 'text-white/80'}`}>
                                                                        {activity.user?.name || 'Utilisateur inconnu'}
                                                                    </td>
                                                                )}
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30">
                                                                        {actionTranslations[activity.action] || activity.action}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-white/80">
                                                                    {activity.description}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                                                                    {activity.model_type && activity.model_id && (
                                                                        (() => {
                                                                            const route = getViewRoute(activity.model_type, activity.model_id);
                                                                            return route ? (
                                                                                <Link
                                                                                    href={route}
                                                                                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
                                                                                >
                                                                                    <EyeIcon className="h-4 w-4 mr-1" />
                                                                                    Voir
                                                                                </Link>
                                                                            ) : null;
                                                                        })()
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))
                                ) : (
                                    <tr>
                                        <td 
                                            colSpan={auth.user.role === 'admin' ? 5 : 4} 
                                            className="px-6 py-4 text-sm text-white/60 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center py-8">
                                                <DocumentTextIcon className="h-12 w-12 text-white/40 mb-2" />
                                                <p className="text-lg font-medium text-white/80">Aucune activité trouvée</p>
                                                <p className="text-sm text-white/60">Essayez de modifier vos critères de recherche</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </div>
                        </div>

                        {/* Pagination */}
                        {activities.links && activities.links.length > 3 && (
                            <div className="px-6 py-4 bg-black/40 border-t border-white/10">
                                <Pagination links={activities.links} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>
                {`
                    @keyframes gradient-x {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    .animate-gradient-x {
                        background-size: 200% auto;
                        animation: gradient-x 3s ease infinite;
                    }
                `}
            </style>
        </AuthenticatedLayout>
    );
}
