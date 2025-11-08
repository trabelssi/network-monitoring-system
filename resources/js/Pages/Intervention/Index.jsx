import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import TableHeading from '@/Components/TableHeading';
import Pagination from '@/Components/Pagination';
import { INTERVENTION_STATUS_CLASS_MAP, INTERVENTION_STATUS_TEXT_MAP } from '@/constants';
import TextInput from '@/Components/TextInput';
import { 
    PlusIcon,
    ClockIcon,
    UserIcon,
    CalendarIcon,
    ClipboardDocumentListIcon,
    BuildingOfficeIcon,
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowPathIcon,
    AdjustmentsHorizontalIcon,
    XMarkIcon,
    ChevronDownIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useState, useCallback, useEffect } from 'react';

export default function Index({
    auth,
    interventions = { data: [], meta: { links: [] } },
    users = [],
    tasks = [],
    projects = [],
    queryParams = {},
    success,
}) {
    const [searchTerm, setSearchTerm] = useState(queryParams.task_name || '');
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [error, setError] = useState(null);
    const [localQueryParams, setLocalQueryParams] = useState({
        status: queryParams.status || '',
        project_id: queryParams.project_id || '',
        user_id: queryParams.user_id || '',
        assigned_user_id: queryParams.assigned_user_id || '',
        from_date: queryParams.from_date || '',
        to_date: queryParams.to_date || '',
        task_name: queryParams.task_name || '',
        sort_field: queryParams.sort_field || 'created_at',
        sort_direction: queryParams.sort_direction || 'desc'
    });
    const [dateRange, setDateRange] = useState({ 
        start: queryParams.from_date || '', 
        end: queryParams.to_date || '' 
    });
    const { errors } = usePage().props;

    // Sync URL parameters with local state
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const newParams = {};
        
        // Get all parameters from URL
        for (const [key, value] of urlParams.entries()) {
            newParams[key] = value;
        }

        // Update local state if URL parameters are different
        if (JSON.stringify(newParams) !== JSON.stringify(localQueryParams)) {
            setLocalQueryParams(newParams);
            
            // Update search term if present
            if (newParams.task_name) {
                setSearchTerm(newParams.task_name);
            }
            
            // Update date range if present
            if (newParams.from_date || newParams.to_date) {
                setDateRange({
                    start: newParams.from_date || '',
                    end: newParams.to_date || ''
                });
            }
        }
    }, [window.location.search]);

    // Filter tasks based on search term with debouncing
    const filteredTasks = tasks.filter(task => 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.projects && task.projects.map(p => p.name).join(', ').toLowerCase().includes(searchTerm.toLowerCase())) ||
        (task.created_by?.name || task.createdBy?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Debounced search with error handling
    const searchFieldChange = useCallback((value) => {
        if (searchTimeout) clearTimeout(searchTimeout);
        setSearchTerm(value);
        setError(null);
        
        // Don't search if less than 2 characters
        if (value && value.length < 2) return;
        
        setSearchTimeout(setTimeout(() => {
            const newParams = { ...localQueryParams };
            if (value && value.length >= 2) {
                newParams.task_name = value;
            } else {
                delete newParams.task_name;
            }
            
            // Reset pagination when searching
            delete newParams.page;
            
            setIsLoading(true);
            setLocalQueryParams(newParams);
            
            router.get(route('interventions.index'), newParams, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsLoading(false);
                    setError(null);
                },
                onError: (errors) => {
                    setIsLoading(false);
                    setError(errors.message || 'Une erreur est survenue lors de la recherche');
                }
            });
        }, 500)); // Increased debounce time for better performance
    }, [searchTimeout, localQueryParams]);

    const handleFilterChange = useCallback((type, value) => {
        setIsLoading(true);
        setError(null);
        const newParams = { ...localQueryParams };

        if (value) {
            newParams[type] = value;
        } else {
            delete newParams[type];
        }

        // Reset pagination when changing filters
        delete newParams.page;

        // Keep sort parameters
        if (!newParams.sort_field) {
            newParams.sort_field = 'created_at';
        }
        if (!newParams.sort_direction) {
            newParams.sort_direction = 'desc';
        }

        setLocalQueryParams(newParams);
        router.get(route('interventions.index'), newParams, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsLoading(false);
                setError(null);
            },
            onError: (errors) => {
                setIsLoading(false);
                setError(errors.message || 'Une erreur est survenue lors du filtrage');
            }
        });
    }, [localQueryParams]);

    const handleDateRangeChange = useCallback((start, end) => {
        setIsLoading(true);
        setError(null);
        const newParams = { ...localQueryParams };

        if (start && end) {
            newParams.from_date = start;
            newParams.to_date = end;
        } else {
            delete newParams.from_date;
            delete newParams.to_date;
        }

        // Reset pagination when changing dates
        delete newParams.page;

        // Keep sort parameters
        if (!newParams.sort_field) {
            newParams.sort_field = 'created_at';
        }
        if (!newParams.sort_direction) {
            newParams.sort_direction = 'desc';
        }

        setLocalQueryParams(newParams);
        router.get(route('interventions.index'), newParams, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsLoading(false);
                setError(null);
            },
            onError: (errors) => {
                setIsLoading(false);
                setError(errors.message || 'Une erreur est survenue lors du filtrage par date');
            }
        });
    }, [localQueryParams]);

    const clearAllFilters = useCallback(() => {
        setIsLoading(true);
        setError(null);
        setSearchTerm('');
        setLocalQueryParams({
            sort_field: 'created_at',
            sort_direction: 'desc'
        });
        setDateRange({ start: '', end: '' });
        setShowAdvancedSearch(false);
        
        router.get(route('interventions.index'), {
            sort_field: 'created_at',
            sort_direction: 'desc'
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsLoading(false);
                setError(null);
            },
            onError: (errors) => {
                setIsLoading(false);
                setError(errors.message || 'Une erreur est survenue lors de la réinitialisation des filtres');
            }
        });
    }, []);

    const handleSearch = (name, value) => {
        const params = { ...queryParams };
        
        // If the value is empty, remove the parameter
        if (!value) {
            delete params[name];
        } else {
            params[name] = value;
        }

        // Remove empty parameters
        Object.keys(params).forEach(key => {
            if (!params[key]) {
                delete params[key];
            }
        });

        // Preserve the current page if it exists
        if (params.page) {
            delete params.page;
        }

        // Handle date range validation
        if (params.from_date && params.to_date) {
            const fromDate = new Date(params.from_date);
            const toDate = new Date(params.to_date);
            if (fromDate > toDate) {
                // If from_date is after to_date, swap them
                [params.from_date, params.to_date] = [params.to_date, params.from_date];
            }
        }

        router.get(route('interventions.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        router.get(route('interventions.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const handleSort = (field) => {
        const params = { ...queryParams };
        if (field === params.sort_field) {
            params.sort_direction = params.sort_direction === 'asc' ? 'desc' : 'asc';
        } else {
            params.sort_field = field;
            params.sort_direction = 'asc';
        }
        router.get(route('interventions.index'), params, { preserveState: true });
    };

    const renderStatusBadge = (status) => (
        <span className={`px-3 py-1 rounded-full text-sm font-medium shadow-inner ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300 whitespace-nowrap ${INTERVENTION_STATUS_CLASS_MAP[status] || 'bg-gray-500'}`}>
            {INTERVENTION_STATUS_TEXT_MAP[status] || status}
        </span>
    );

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const truncateTaskName = (name) => {
        if (!name) return 'N/A';
        const words = name.split(' ');
        if (words.length <= 3) return name;
        return words.slice(0, 3).join(' ') + '...';
    };

    const truncateMachineName = (name) => {
        if (!name) return 'N/A';
        const words = name.split(' ');
        if (words.length <= 2) return name;
        return words.slice(0, 2).join(' ') + '...';
    };

    // Add this handler near other handlers like searchFieldChange
    const handlePagination = useCallback((url) => {
        setIsLoading(true);
        router.get(url, {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['interventions', 'queryParams'],
            onFinish: () => {
                setIsLoading(false);
                // Scroll to top of the table
                document.querySelector('.table-wrapper')?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }, []);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                            Liste des Interventions
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title="Interventions" />

            <div className="py-12">
                <div className="mx-auto max-w-[95%] sm:px-6 lg:px-8">
                    {/* Enhanced Notifications */}
                    <div className="space-y-4 mb-6">
                    {error && (
                            <div className="relative transform transition-all duration-300 hover:scale-[1.02]">
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-500/10 via-red-500/10 to-red-400/10 border border-red-500/20 rounded-xl shadow-lg backdrop-blur-xl">
                                    <div className="flex-shrink-0">
                                        <div className="p-2 bg-red-500/10 rounded-lg">
                                            <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                                        </div>
                                    </div>
                                    <div className="flex-1 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-base font-medium text-red-400">Erreur</h3>
                                            <p className="text-sm text-red-300 mt-1">{error}</p>
                                        </div>
                                        <button 
                                            onClick={() => setError(null)}
                                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
                                        >
                                            <XMarkIcon className="h-5 w-5 text-red-400" />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-300 animate-shrink" style={{ width: '100%' }} />
                                </div>
                        </div>
                    )}
                    
                    {success && (
                            <div className="relative transform transition-all duration-300 hover:scale-[1.02]">
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/10 to-emerald-400/10 border border-emerald-500/20 rounded-xl shadow-lg backdrop-blur-xl">
                                    <div className="flex-shrink-0">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                                            <CheckCircleIcon className="h-6 w-6 text-emerald-400" />
                                        </div>
                                    </div>
                                    <div className="flex-1 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-base font-medium text-emerald-400">Succès</h3>
                                            <p className="text-sm text-emerald-300 mt-1">{success}</p>
                                        </div>
                                        <button 
                                            onClick={() => router.get(route('interventions.index'), {}, { preserveState: false })}
                                            className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors duration-200"
                                        >
                                            <XMarkIcon className="h-5 w-5 text-emerald-400" />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-300 animate-shrink" style={{ width: '100%' }} />
                                </div>
                        </div>
                    )}
                    </div>

                    <div className="overflow-hidden bg-black/40 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/10 transform transition-all duration-300 hover:scale-[1.01]">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            {/* Enhanced Search Section */}
                            <div className="mb-8">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        {isLoading ? (
                                            <svg className="animate-spin h-6 w-6 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <MagnifyingGlassIcon className="h-6 w-6 text-cyan-500" />
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-4 py-4 bg-black/40 border-2 border-cyan-500/30 focus:border-cyan-500 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-cyan-500/40 transition-all duration-300 text-lg font-medium"
                                        placeholder="Rechercher une intervention par nom de ticket (minimum 2 caractères)..."
                                        value={searchTerm}
                                        onChange={(e) => searchFieldChange(e.target.value)}
                                        disabled={isLoading}
                                    />
                                    {searchTerm && (
                                <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                searchFieldChange('');
                                            }}
                                            className="absolute inset-y-0 right-16 flex items-center pr-4 text-gray-400 hover:text-white transition-colors duration-200"
                                >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                                    >
                                        <AdjustmentsHorizontalIcon className="w-6 h-6" />
                                        <span className="ml-2 mr-2 text-sm">Options de recherche</span>
                                        <ChevronDownIcon className={`w-4 h-4 transform transition-transform duration-200 ${showAdvancedSearch ? 'rotate-180' : ''}`} />
                                </button>
                                </div>
                                {searchTerm && searchTerm.length < 2 && (
                                    <p className="mt-2 text-sm text-cyan-400">
                                        Veuillez saisir au moins 2 caractères pour lancer la recherche
                                    </p>
                                )}

                                {showAdvancedSearch && (
                                    <div className={`mt-4 p-4 bg-black/20 rounded-xl border border-cyan-500/20 transition-all duration-300 ${
                                        showAdvancedSearch ? 'transform translate-y-0 opacity-100' : 'transform -translate-y-2 opacity-0'
                                    }`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-400">Statut</label>
                                                <select
                                                    className="w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                                                    value={localQueryParams.status || ''}
                                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                                    disabled={isLoading}
                                                >
                                                    <option value="">Tous les statuts</option>
                                                    <option value="pending">En attente</option>
                                                    <option value="approved">Approuvé</option>
                                                    <option value="rejected">Rejeté</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-400">Machine</label>
                                                <select
                                                    className="w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                                                    value={localQueryParams.project_id || ''}
                                                    onChange={(e) => handleFilterChange('project_id', e.target.value)}
                                                    disabled={isLoading}
                                                >
                                                    <option value="">Toutes les machines</option>
                                                    {projects.map(project => (
                                                        <option key={project.id} value={project.id}>{project.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-400">Utilisateur</label>
                                                <select
                                                    className="w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                                                    value={localQueryParams.user_id || ''}
                                                    onChange={(e) => handleFilterChange('user_id', e.target.value)}
                                                    disabled={isLoading}
                                                >
                                                    <option value="">Tous les utilisateurs</option>
                                                    {users.map(user => (
                                                        <option key={user.id} value={user.id}>{user.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-400">Utilisateur Assigné</label>
                                                <select
                                                    className="w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                                                    value={localQueryParams.assigned_user_id || ''}
                                                    onChange={(e) => handleFilterChange('assigned_user_id', e.target.value)}
                                                    disabled={isLoading}
                                                >
                                                    <option value="">Tous les utilisateurs</option>
                                                    {users.map(user => (
                                                        <option key={user.id} value={user.id}>{user.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-2 lg:col-span-3">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-400">Date de début</label>
                                            <input
                                                type="date"
                                                            className="w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                                                            value={dateRange.start}
                                                            onChange={(e) => {
                                                                setDateRange(prev => ({ ...prev, start: e.target.value }));
                                                                if (e.target.value && dateRange.end) {
                                                                    handleDateRangeChange(e.target.value, dateRange.end);
                                                                }
                                                            }}
                                                            disabled={isLoading}
                                                        />
                                        </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-400">Date de fin</label>
                                            <input
                                                type="date"
                                                            className="w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                                                            value={dateRange.end}
                                                            onChange={(e) => {
                                                                setDateRange(prev => ({ ...prev, end: e.target.value }));
                                                                if (e.target.value && dateRange.start) {
                                                                    handleDateRangeChange(dateRange.start, e.target.value);
                                                                }
                                                            }}
                                                            min={dateRange.start}
                                                            disabled={isLoading}
                                                        />
                                        </div>
                                    </div>

                                                {/* Date Quick Filters */}
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <button
                                                        onClick={() => {
                                                            const today = new Date();
                                                            const start = today.toISOString().split('T')[0];
                                                            const end = start;
                                                            setDateRange({ start, end });
                                                            handleDateRangeChange(start, end);
                                                        }}
                                                        className="px-3 py-1 text-sm bg-black/40 text-cyan-400 rounded-full hover:bg-cyan-500/10 transition-all duration-200"
                                                        disabled={isLoading}
                                                    >
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
                                                        className="px-3 py-1 text-sm bg-black/40 text-cyan-400 rounded-full hover:bg-cyan-500/10 transition-all duration-200"
                                                        disabled={isLoading}
                                                    >
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
                                                        className="px-3 py-1 text-sm bg-black/40 text-cyan-400 rounded-full hover:bg-cyan-500/10 transition-all duration-200"
                                                        disabled={isLoading}
                                                    >
                                                        30 derniers jours
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={clearAllFilters}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all duration-200"
                                                disabled={isLoading}
                                            >
                                                <XMarkIcon className="w-5 h-5" />
                                                Réinitialiser les filtres
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl">
                                <table className="w-full divide-y divide-white/10" role="grid">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-cyan-950/50 via-slate-900/50 to-cyan-950/50">
                                                <TableHeading
                                                    name="id"
                                                    sortable={true}
                                                    sort_field={queryParams?.sort_field || ''}
                                                    sort_direction={queryParams?.sort_direction || ''}
                                                    sortChange={handleSort}
                                                    className="w-16"
                                                >
                                                <div className="flex items-center gap-2 text-cyan-400 whitespace-nowrap">
                                                        <ClockIcon className="w-4 h-4" />
                                                        ID
                                                    </div>
                                                </TableHeading>
                                            <th className="px-4 py-4 text-cyan-400 w-32">
                                                    <div className="flex items-center gap-2">
                                                        <FunnelIcon className="w-4 h-4" />
                                                        Statut
                                                    </div>
                                                </th>
                                                <TableHeading
                                                    name="action_time"
                                                    sortable={true}
                                                    sort_field={queryParams?.sort_field || ''}
                                                    sort_direction={queryParams?.sort_direction || ''}
                                                    sortChange={handleSort}
                                                    className="w-32"
                                                >
                                                <div className="flex items-center gap-2 text-cyan-400">
                                                        <CalendarIcon className="w-4 h-4" />
                                                        Date
                                                    </div>
                                                </TableHeading>
                                            <th className="px-4 py-4 text-cyan-400 w-64">
                                                    <div className="flex items-center gap-2">
                                                        <ClipboardDocumentListIcon className="w-4 h-4" />
                                                        Ticket
                                                    </div>
                                                </th>
                                            <th className="px-4 py-4 text-cyan-400 w-48">
                                                    <div className="flex items-center gap-2">
                                                        <BuildingOfficeIcon className="w-4 h-4" />
                                                        Machines
                                                    </div>
                                                </th>
                                            <th className="px-4 py-4 text-cyan-400 w-48">
                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="w-4 h-4" />
                                                        Utilisateur Assigné
                                                    </div>
                                                </th>
                                            <th className="px-4 py-4 text-cyan-400 w-48">
                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="w-4 h-4" />
                                                        Créé Par
                                                    </div>
                                                </th>
                                            <th className="px-4 py-4 text-cyan-400 w-32">
                                                    <div className="flex items-center gap-2">
                                                        Actions
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                    <tbody className="divide-y divide-white/5">
                                            {interventions.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-4 rounded-full mb-4">
                                                            <ClipboardDocumentListIcon className="w-16 h-16 text-cyan-500" />
                                                        </div>
                                                        <p className="text-xl font-medium mb-2 text-white">Aucune intervention trouvée</p>
                                                        <p className="text-sm text-gray-400">Ajoutez une nouvelle intervention ou modifiez vos filtres de recherche</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                            interventions.data.map((intervention) => (
                                                    <tr 
                                                        key={intervention.id} 
                                                    className="group hover:bg-cyan-500/5 transition-colors duration-200"
                                                    >
                                                        <td className="px-4 py-3 text-gray-300 font-medium">{intervention.id}</td>
                                                        <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-inner ring-1 ring-white/10 transition-all duration-300 ${INTERVENTION_STATUS_CLASS_MAP[intervention.status] || 'bg-gray-500'}`}>
                                                            {INTERVENTION_STATUS_TEXT_MAP[intervention.status] || intervention.status}
                                                        </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-300">{formatDate(intervention.action_time)}</td>
                                                    <td className="px-4 py-3">
                                                            <Link
                                                                href={route('task.show', intervention.task?.id)}
                                                            className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 font-medium group-hover:underline underline-offset-4 decoration-cyan-500/50"
                                                            >
                                                            {truncateTaskName(intervention.task?.name)}
                                                            </Link>
                                                        </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-wrap gap-2">
                                                                {intervention.task?.projects?.map((project, idx) => (
                                                                    <span 
                                                                        key={idx}
                                                                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/5 transition-all duration-300 hover:scale-105"
                                                                    >
                                                                    {truncateMachineName(project.name)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                {intervention.task?.assignedUser?.is_active === false ? (
                                                                <span className="inline-flex items-center gap-1.5 text-red-400 line-through px-2.5 py-1 rounded-lg bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20">
                                                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                                                        {intervention.task.assignedUser.name}
                                                                    </span>
                                                                ) : (
                                                                <span className="inline-flex items-center gap-1.5 text-cyan-400 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                                                                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                                                                        {intervention.task?.assignedUser?.name || 'N/A'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                {intervention.task?.createdBy?.is_active === false ? (
                                                                <span className="inline-flex items-center gap-1.5 text-red-400 line-through px-2.5 py-1 rounded-lg bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20">
                                                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                                                        {intervention.task.createdBy.name}
                                                                    </span>
                                                                ) : (
                                                                <span className="inline-flex items-center gap-1.5 text-cyan-400 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                                                                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                                                                        {intervention.task?.createdBy?.name || 'N/A'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-2">
                                                                <Link
                                                                    href={route('interventions.show', intervention.id)}
                                                                className="p-2 text-cyan-400 hover:text-cyan-300 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 hover:from-cyan-500/10 hover:to-blue-500/10 rounded-lg transition-all duration-300 hover:scale-110 border border-cyan-500/20"
                                                                    title="Modifier"
                                                                >
                                                                    <PencilSquareIcon className="w-5 h-5" />
                                                                </Link>
                                                                <button
                                                                    onClick={() => {
                                                                        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
                                                                            router.delete(route('interventions.destroy', intervention.id));
                                                                        }
                                                                    }}
                                                                className="p-2 text-red-400 hover:text-red-300 bg-gradient-to-r from-red-500/5 to-pink-500/5 hover:from-red-500/10 hover:to-pink-500/10 rounded-lg transition-all duration-300 hover:scale-110 border border-red-500/20"
                                                                    title="Supprimer"
                                                                >
                                                                    <TrashIcon className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {interventions.data.length > 0 && (
                                <div className="mt-6">
                                    <Pagination 
                                        links={interventions.meta.links} 
                                        onClick={handlePagination}
                                        showSpinnerOnClick={true}
                                    />
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add animation keyframes */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes shimmer {
                    0% {
                        background-position: -1000px 0;
                    }
                    100% {
                        background-position: 1000px 0;
                    }
                }

                @keyframes shrink {
                    0% {
                        width: 100%;
                    }
                    100% {
                        width: 0%;
                    }
                }

                .animate-shrink {
                    animation: shrink 5s linear forwards;
                }

                .hover-shimmer {
                    background: linear-gradient(
                        to right,
                        rgba(6, 182, 212, 0.05) 0%,
                        rgba(59, 130, 246, 0.05) 25%,
                        rgba(59, 130, 246, 0.05) 50%,
                        rgba(6, 182, 212, 0.05) 100%
                    );
                    background-size: 2000px 100%;
                    animation: shimmer 3s linear infinite;
                }

                .table-wrapper {
                    position: relative;
                    margin: 0 auto;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    animation: fadeIn 0.5s ease-out;
                }

                table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                }

                th {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    backdrop-filter: blur(10px);
                }

                td, th {
                    padding: 1rem;
                    vertical-align: middle;
                }

                tbody tr {
                    transition: all 0.3s ease;
                    animation: fadeIn 0.5s ease-out;
                }

                tbody tr:hover {
                    transform: translateX(4px);
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(6, 182, 212, 0.1);
                    border-radius: 4px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(to right, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2));
                    border-radius: 4px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to right, rgba(6, 182, 212, 0.3), rgba(59, 130, 246, 0.3));
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }

                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
