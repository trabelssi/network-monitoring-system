import { Link } from '@inertiajs/react';
import { router, usePage } from '@inertiajs/react';
import { useState, useEffect, useCallback, Fragment, useMemo, memo, useRef } from 'react';
import Pagination from '@/Components/Pagination';
import { 
    TASK_STATUS_CLASS_MAP, 
    TASK_STATUS_TEXT_MAP, 
    TASK_PRIORITY_TEXT_MAP, 
    TASK_PRIORITY_CLASS_MAP,
    INTERVENTION_STATUS_TEXT_MAP 
} from '@/constants.jsx';
import TextInput from '@/Components/TextInput';
import SelectInput from '@/Components/SelectInput';
import TableHeading from '@/Components/TableHeading';
import AdvancedFilters from '@/Components/AdvancedFilters';
import { 
    PencilSquareIcon, 
    TrashIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    CalendarIcon,
    UserIcon,
    ClockIcon,
    ListBulletIcon,
    PlusIcon,
    FlagIcon,
    UserGroupIcon,
    DocumentPlusIcon,
    ChevronDownIcon,
    XMarkIcon,
    AdjustmentsHorizontalIcon,
    CubeIcon,
    TagIcon,
    ClockIcon as HistoryIcon
} from '@heroicons/react/24/outline';
import { debounce } from 'lodash';

export default function TasksTable({ tasks, projects = [], queryParams = null, currentRouteName, success, hideProjectColumn = false, auth }) {
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const { errors } = usePage().props;
    const [localQueryParams, setLocalQueryParams] = useState(queryParams || {});
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [projectsList, setProjectsList] = useState([]);
    const [selectedProjectProducts, setSelectedProjectProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState(localQueryParams.name || '');
    const [searchHistory, setSearchHistory] = useState(() => {
        const savedHistory = localStorage.getItem('taskSearchHistory');
        return savedHistory ? JSON.parse(savedHistory) : [];
    });
    const [showSearchHistory, setShowSearchHistory] = useState(false);
    const searchContainerRef = useRef(null);

    // Memoize projects list to prevent unnecessary re-renders
    const memoizedProjects = useMemo(() => {
        return projects.map(project => ({
            id: project.id,
            name: project.name,
            products: project.products || []
        }));
    }, [projects]);

    // Update projects list only when memoized data changes
    useEffect(() => {
        setProjectsList(memoizedProjects);
    }, [memoizedProjects]);

    // Memoize selected project products
    const memoizedSelectedProducts = useMemo(() => {
        if (!localQueryParams.project_id) return [];
        const selectedProject = memoizedProjects.find(p => p.id === parseInt(localQueryParams.project_id));
        return selectedProject?.products || [];
    }, [localQueryParams.project_id, memoizedProjects]);

    useEffect(() => {
        setSelectedProjectProducts(memoizedSelectedProducts);
    }, [memoizedSelectedProducts]);

    // Save search history to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('taskSearchHistory', JSON.stringify(searchHistory));
    }, [searchHistory]);

    // Add search to history
    const addToSearchHistory = (term) => {
        if (!term.trim()) return;
        
        const searchItem = {
            query: term,
            timestamp: new Date().toISOString()
        };
        
        setSearchHistory(prevHistory => {
            const newHistory = [
                searchItem,
                ...prevHistory.filter(item => item.query !== term)
            ].slice(0, 5);
            return newHistory;
        });
    };

    // Remove item from search history
    const removeFromHistory = (termToRemove) => {
        setSearchHistory(prevHistory => 
            prevHistory.filter(item => item.query !== termToRemove)
        );
    };

    // Clear entire search history
    const clearSearchHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('taskSearchHistory');
    };

    useEffect(() => {
        const newParams = { ...queryParams };
        
        // For non-admin users, remove advanced filter parameters
        if (auth.user.role !== 'admin') {
            const advancedFilterKeys = [
                'status', 
                'priority',
                'project_id',
                'date_start', 
                'date_end', 
                'search_in', 
                'search_type', 
                'case_sensitive'
            ];
            advancedFilterKeys.forEach(key => delete newParams[key]);
        }
        
        setLocalQueryParams(newParams || {});
        
        // Set date range if it exists in query params
        if (newParams?.date_start || newParams?.date_end) {
            setDateRange({
                start: newParams.date_start || '',
                end: newParams.date_end || ''
            });
        }

        // Set filter visibility based on active filters
        if (auth.user.role === 'admin') {
            const hasAdvancedFilters = ['status', 'priority', 'date_start', 'date_end'].some(key => newParams[key]);
            setShowFilters(hasAdvancedFilters);
        }
    }, [queryParams, auth.user.role]);

    const debouncedSearch = useCallback(
        debounce((value) => {
            if (!value.trim()) return;
            
            setIsLoading(true);
            router.get(route(currentRouteName), { ...localQueryParams, name: value }, {
            preserveState: true,
            preserveScroll: true,
                only: ['tasks'],
            onSuccess: () => {
                setIsLoading(false);
                setError(null);
                    addToSearchHistory(value);
            },
            onError: (errors) => {
                setIsLoading(false);
                setError(errors.message || 'Une erreur est survenue lors de la recherche');
            }
        });
        }, 300),
        [localQueryParams, currentRouteName]
    );

    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
        debouncedSearch(value);
    }, [debouncedSearch]);

    // Handle search input keypress
    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch(searchTerm);
        }
    };

    // Handle clicking a search history item
    const handleHistoryItemClick = (item) => {
        setSearchTerm(item.query);
        handleSearch(item.query);
    };

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.abs(now - date) / 36e5; // Convert to hours

        if (diffInHours < 1) {
            return 'Il y a quelques minutes';
        } else if (diffInHours < 24) {
            const hours = Math.floor(diffInHours);
            return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
        } else {
            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    // Debounced search with error handling
    const searchFieldChange = useCallback((name, value) => {
        if (searchTimeout) clearTimeout(searchTimeout);
        setError(null);
        
        setSearchTimeout(setTimeout(() => {
            const newParams = { ...localQueryParams };
        if (value) {
                newParams[name] = value;
            } else {
                delete newParams[name];
                // Also clear advanced search params when search is cleared
                ['search_in', 'search_type', 'case_sensitive'].forEach(key => delete newParams[key]);
            }
            
            setIsLoading(true);
            router.get(route(currentRouteName), newParams, {
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
        }, 300));
    }, [searchTimeout, localQueryParams, currentRouteName]);

    // Handle filter button clicks
    const handleFilterClick = useCallback((filterType) => {
        setIsLoading(true);
        setError(null);
        const newParams = { ...localQueryParams };

        if (filterType === 'assigned') {
            if (newParams.assigned_to_me === '1') {
                delete newParams.assigned_to_me;
            } else {
                newParams.assigned_to_me = '1';
                delete newParams.created_by_me;
            }
        } else {
            if (newParams.created_by_me === '1') {
                delete newParams.created_by_me;
            } else {
                newParams.created_by_me = '1';
                delete newParams.assigned_to_me;
            }
        }

        setLocalQueryParams(newParams);
        router.get(route(currentRouteName), newParams, {
            preserveState: true,
            replace: true,
            onSuccess: () => setIsLoading(false),
            onError: (errors) => {
                setIsLoading(false);
                setError(errors.message || 'Une erreur est survenue lors du filtrage');
            }
        });
    }, [localQueryParams, currentRouteName]);

    // Modified handleFilterChange to check user role and handle all filter types
    const handleFilterChange = useCallback((type, value) => {
        // Server-side validation will be the primary security measure
        if (auth.user.role !== 'admin' && ['status', 'priority', 'search_in', 'search_type', 'case_sensitive'].includes(type)) {
            setError('Vous n\'avez pas les permissions nécessaires pour utiliser les filtres avancés.');
            return;
        }

        if (isLoading) return; // Prevent multiple requests while loading

        setIsLoading(true);
        setError(null);

        // Store current state for potential rollback
        const previousParams = { ...localQueryParams };

        try {
            const newParams = { ...localQueryParams };

            if (value) {
                newParams[type] = value;
            } else {
                delete newParams[type];
                // Also clear product_id when project_id is cleared
                if (type === 'project_id') {
                    delete newParams.product_id;
                    setSelectedProjectProducts([]);
                }
            }

            // Special handling for search-related filters
            if (['search_in', 'search_type', 'case_sensitive'].includes(type) && !newParams.name) {
                delete newParams[type];
            }

            // Optimistic update
            setLocalQueryParams(newParams);

            router.get(route(currentRouteName), newParams, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsLoading(false);
                    setError(null);
                    
                    // Update products list if project changed
                    if (type === 'project_id' && value) {
                        const selectedProject = projectsList.find(p => p.id === parseInt(value));
                        setSelectedProjectProducts(selectedProject?.products || []);
                    }
                },
                onError: (errors) => {
                    // Revert on error
                    setLocalQueryParams(previousParams);
                    setIsLoading(false);
                    setError(errors.message || 'Une erreur est survenue lors du filtrage');
                }
            });
        } catch (error) {
            // Revert on error
            setLocalQueryParams(previousParams);
            setIsLoading(false);
            setError('Une erreur est survenue lors du filtrage');
            console.error('Filter error:', error);
        }
    }, [localQueryParams, currentRouteName, auth.user.role, isLoading, projectsList]);

    // Modified handleDateRangeChange to check user role and validate dates
    const handleDateRangeChange = useCallback((start, end) => {
        if (auth.user.role !== 'admin') {
            setError('Vous n\'avez pas les permissions nécessaires pour utiliser les filtres de date.');
            return;
        }

        // Validate dates
        if (start && end && new Date(start) > new Date(end)) {
            setError('La date de début doit être antérieure à la date de fin.');
            return;
        }

        setIsLoading(true);
        setError(null);
        const newParams = { ...localQueryParams };

        if (start && end) {
            newParams.date_start = start;
            newParams.date_end = end;
        } else {
            delete newParams.date_start;
            delete newParams.date_end;
        }

        setLocalQueryParams(newParams);
        router.get(route(currentRouteName), newParams, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsLoading(false);
                setError(null);
                setDateRange({ start, end });
            },
            onError: (errors) => {
                setIsLoading(false);
                setError(errors.message || 'Une erreur est survenue lors du filtrage par date');
            }
        });
    }, [localQueryParams, currentRouteName, auth.user.role]);

    // Modified clearAllFilters to properly clear all filters
    const clearAllFilters = useCallback(() => {
        const newParams = {};
        // Preserve pagination and sorting if they exist
        if (localQueryParams.sort_field) newParams.sort_field = localQueryParams.sort_field;
        if (localQueryParams.sort_direction) newParams.sort_direction = localQueryParams.sort_direction;
        if (localQueryParams.page) newParams.page = '1'; // Reset to first page when clearing filters
        
        setLocalQueryParams(newParams);
        setDateRange({ start: '', end: '' });
        setSearchTerm('');
        setSelectedProjectProducts([]);
        
        router.get(route(currentRouteName), newParams, {
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
    }, [localQueryParams, currentRouteName]);

    // Modified getActiveFiltersCount to properly count active filters
    const getActiveFiltersCount = useCallback(() => {
        if (auth.user.role !== 'admin') return 0;
        
        const excludedKeys = ['sort_field', 'sort_direction', 'page'];
        const filterKeys = Object.keys(localQueryParams).filter(key => 
            !excludedKeys.includes(key) && localQueryParams[key]
        );

        // Count date range as one filter if both dates are present
        const dateRangeCount = (localQueryParams.date_start && localQueryParams.date_end) ? -1 : 0;
        
        // Count search options as one filter if they're part of an active search
        const searchOptionsCount = localQueryParams.name ? 
            (['search_in', 'search_type', 'case_sensitive'].filter(key => localQueryParams[key]).length > 0 ? -2 : 0) : 0;

        return filterKeys.length + dateRangeCount + searchOptionsCount;
    }, [localQueryParams, auth.user.role]);

    // Add this handler near other handlers
    const handlePagination = useCallback((url) => {
        setIsLoading(true);
        router.get(url, {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['tasks', 'queryParams'],
            onFinish: () => setIsLoading(false)
        });
    }, []);

    // Add the sortChange function
    const sortChange = useCallback((field) => {
        if (isLoading) return; // Prevent multiple requests while loading

        setIsLoading(true);
        setError(null);
        
        // Store current state for potential rollback
        const previousParams = { ...localQueryParams };
        
        try {
            const newParams = { ...localQueryParams };

            // Toggle direction if same field, otherwise set to asc
            if (field === newParams.sort_field) {
                newParams.sort_direction = newParams.sort_direction === 'asc' ? 'desc' : 'asc';
            } else {
                newParams.sort_field = field;
                newParams.sort_direction = 'asc';
            }

            // Optimistic update
            setLocalQueryParams(newParams);

            router.get(route(currentRouteName), newParams, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsLoading(false);
                    setError(null);
                },
                onError: (errors) => {
                    // Revert on error
                    setLocalQueryParams(previousParams);
                    setIsLoading(false);
                    setError(errors.message || 'Une erreur est survenue lors du tri');
                }
            });
        } catch (error) {
            // Revert on error
            setLocalQueryParams(previousParams);
            setIsLoading(false);
            setError('Une erreur est survenue lors du tri');
            console.error('Sorting error:', error);
        }
    }, [localQueryParams, currentRouteName, isLoading]);

    // Add a helper function to get sort icon
    const getSortIcon = useCallback((field) => {
        if (field !== localQueryParams.sort_field) {
            return null;
        }
        return localQueryParams.sort_direction === 'asc' ? '↑' : '↓';
    }, [localQueryParams.sort_field, localQueryParams.sort_direction]);

    // Add back the deleteTask function
    const deleteTask = useCallback((task) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette Ticket ?')) {
            return;
        }
        setDeletingId(task.id);
        setError(null);
        router.delete(route('task.destroy', task.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingId(null);
                setError(null);
            },
            onError: (errors) => {
                setDeletingId(null);
                setError(errors.message || 'Une erreur est survenue lors de la suppression');
            }
        });
    }, []);

    // Add back the error cleanup effect
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Add back the search timeout cleanup
    useEffect(() => {
        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, [searchTimeout]);

    // Add a helper function to get status details
    const getStatusDetails = useCallback((task) => {
        const status = task.computed_status || task.status;
        const statusClass = TASK_STATUS_CLASS_MAP[status] || 'bg-gray-500';
        const statusText = TASK_STATUS_TEXT_MAP[status] || 'Inconnu';
        
        let tooltip = '';
        if (task.interventions_count > 0) {
            tooltip = `${task.interventions_count} intervention${task.interventions_count > 1 ? 's' : ''}`;
            if (task.latest_intervention) {
                const latestStatus = INTERVENTION_STATUS_TEXT_MAP[task.latest_intervention.status];
                tooltip += ` - Dernière: ${latestStatus}`;
            }
        }
        
        return { statusClass, statusText, tooltip };
    }, []);

    // Handle project selection change
    const handleProjectChange = (projectId) => {
        const newParams = { ...localQueryParams };
        
        if (projectId) {
            newParams.project_id = projectId;
            // Find the selected project and its products
            const selectedProject = projectsList.find(p => p.id === parseInt(projectId));
            if (selectedProject?.products) {
                setSelectedProjectProducts(selectedProject.products);
            } else {
                setSelectedProjectProducts([]);
            }
        } else {
            // Clear project and product selection
            delete newParams.project_id;
            delete newParams.product_id;
            setSelectedProjectProducts([]);
        }
        
        setLocalQueryParams(newParams);
        handleFilterChange('project_id', projectId);
    };

    // Handle product selection change
    const handleProductChange = (productId) => {
        const newParams = { ...localQueryParams };
        if (productId) {
            newParams.product_id = productId;
        } else {
            delete newParams.product_id;
        }
        setLocalQueryParams(newParams);
        handleFilterChange('product_id', productId);
    };

    // Memoize tasks data to prevent unnecessary re-renders
    const memoizedTasks = useMemo(() => {
        return tasks.data.map(task => ({
            ...task,
            statusDetails: getStatusDetails(task),
            formattedDueDate: task.due_date,
            formattedCreatedAt: task.created_at
        }));
    }, [tasks.data]);

    // Memoize filtered tasks
    const filteredTasks = useMemo(() => {
        return memoizedTasks;
    }, [memoizedTasks]);

    const TaskRow = memo(({ task }) => (
        <tr className="group hover:bg-cyan-500/5 transition-colors duration-200">
            <td className="px-4 py-3 text-gray-300 font-medium">{task.id}</td>
            {!hideProjectColumn && (
                <td className="px-4 py-3">
                    {task.products && task.products.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {task.products.slice(0, 2).map((product) => (
                                <span key={product.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 transition-all duration-200 group-hover:border-cyan-500/30">
                                    {product.name}
                                </span>
                            ))}
                            {task.products.length > 2 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                    +{task.products.length - 2}
                                </span>
                            )}
                        </div>
                    ) : null}
                </td>
            )}
            <td className="px-4 py-3">
                <Link href={route('task.show', task.id)} className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200">
                    {task.name}
                </Link>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-inner ring-1 ring-white/10 transition-all duration-300 text-white ${task.statusDetails.statusClass}`}>
                        {task.statusDetails.statusText}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-inner ring-1 ring-white/10 transition-all duration-300 text-white ${TASK_PRIORITY_CLASS_MAP[task.priority] || 'bg-gray-500'}`}>
                    {TASK_PRIORITY_TEXT_MAP[task.priority] || task.priority}
                </span>
            </td>
            <td className="px-4 py-3 text-gray-300">{task.formattedCreatedAt}</td>
            <td className="px-4 py-3 text-gray-300">{task.formattedDueDate}</td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className={`text-sm font-medium ${task.createdBy?.is_active === false ? 'line-through text-red-500' : 'text-gray-300'}`}>
                        {task.createdBy?.name}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3">
                {task.createdBy?.id === auth.user.id && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Link
                            href={route('task.edit', task.id)}
                            className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all duration-200"
                            title="Modifier"
                        >
                            <PencilSquareIcon className="w-5 h-5" />
                        </Link>
                        <button
                            onClick={() => deleteTask(task)}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200"
                            title="Supprimer"
                            disabled={deletingId === task.id}
                        >
                            {deletingId === task.id ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <TrashIcon className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                )}
            </td>
        </tr>
    ));

    const renderTasks = () => {
        if (isLoading) {
            return (
                <tr>
                    <td colSpan={8} className="px-4 py-3 text-center text-gray-400">
                        Chargement...
                    </td>
                </tr>
            );
        }

        if (!filteredTasks.length) {
            return (
                <tr>
                    <td colSpan={8} className="px-4 py-3 text-center text-gray-400">
                        Aucune tâche trouvée
                    </td>
                </tr>
            );
        }

        return filteredTasks.map(task => (
            <TaskRow key={task.id} task={task} />
        ));
    };

    // Add click outside handler
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowSearchHistory(false);
            }
        }

        // Add event listener when dropdown is open
        if (showSearchHistory) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Cleanup event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSearchHistory]);

    return (
        <>
            {success && (
                <div className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 py-3 px-4 text-emerald-400 rounded-lg mb-6 transform transition-all duration-300 hover:scale-[1.01]">
                    {success}
                </div>
            )}

            {error && (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 py-3 px-4 text-red-400 rounded-lg mb-6 transform transition-all duration-300 hover:scale-[1.01]">
                    {error}
                </div>
            )}

            <div className="py-12">
                <div className="mx-auto max-w-[95%] sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-black/40 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/10 transform transition-all duration-300 hover:scale-[1.01]">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            {/* Enhanced Search Section */}
                            <div className="mb-8">
                                <div className="relative w-full" ref={searchContainerRef}>
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <MagnifyingGlassIcon className="h-6 w-6 text-cyan-500" />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-24 py-4 bg-black/40 border-2 border-cyan-500/30 focus:border-cyan-500 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-cyan-500/40 transition-all duration-300 text-lg font-medium"
                                        placeholder="Rechercher un ticket par nom... (Appuyez sur Entrée)"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={handleSearchKeyPress}
                                        onFocus={() => setShowSearchHistory(true)}
                                        disabled={isLoading}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                                        {searchTerm && (
                                            <button
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    handleSearch('');
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-gray-300 transition-colors duration-200"
                                                title="Effacer la recherche"
                                            >
                                                <XMarkIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowSearchHistory(!showSearchHistory)}
                                            className={`p-1.5 rounded-lg transition-colors duration-200 ${
                                                showSearchHistory 
                                                ? 'bg-cyan-500/20 text-cyan-400' 
                                                : 'text-gray-400 hover:text-gray-300'
                                            }`}
                                            title="Historique des recherches"
                                        >
                                            <HistoryIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Search History Dropdown */}
                                    {showSearchHistory && searchHistory.length > 0 && (
                                        <div className="absolute left-0 right-0 mt-2 bg-black/60 backdrop-blur-xl rounded-xl border border-cyan-500/20 shadow-2xl z-50">
                                            <div className="p-2">
                                                <div className="flex items-center justify-between px-3 py-2 text-sm text-gray-400 border-b border-cyan-500/10">
                                                    <span className="font-medium">Recherches récentes</span>
                                                    <button
                                                        onClick={clearSearchHistory}
                                                        className="text-red-400 hover:text-red-300 text-sm transition-colors duration-200"
                                                    >
                                                        Effacer l'historique
                                                    </button>
                                                </div>
                                                <div className="mt-2">
                                                    {searchHistory.map((item, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center justify-between px-3 py-2 hover:bg-white/5 group transition-all duration-200"
                                                        >
                                                            <button
                                                                onClick={() => handleHistoryItemClick(item)}
                                                                className="flex-1 flex items-center gap-3 text-left text-gray-300 hover:text-cyan-400 transition-colors duration-200 w-full"
                                                            >
                                                                <HistoryIcon className="w-4 h-4 flex-shrink-0" />
                                                                <div className="flex flex-col items-start flex-1 min-w-0">
                                                                    <span className="text-sm truncate w-full">{item.query}</span>
                                                                    <span className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</span>
                                                                </div>
                                                            </button>
                                                            <button
                                                                onClick={() => removeFromHistory(item.query)}
                                                                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all duration-200 ml-2 flex-shrink-0"
                                                            >
                                                                <XMarkIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Filter section */}
                            <div className="mb-6 space-y-4">
                                {/* Quick Filters Row */}
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <FunnelIcon className="w-5 h-5" />
                                            <span className="text-sm font-medium uppercase tracking-wider">Filtres Rapides</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-300 border shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 whitespace-nowrap ${
                                                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                                } ${
                                                    localQueryParams.assigned_to_me === '1'
                                                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-transparent shadow-cyan-500/20'
                                                        : 'bg-black/30 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-400 border-cyan-500/40'
                                                }`}
                                                onClick={() => !isLoading && handleFilterClick('assigned')}
                                                disabled={isLoading}
                                                type="button"
                                                title="Afficher les tickets qui vous sont assignés"
                                            >
                                                <div className="relative">
                                                    {isLoading && localQueryParams.assigned_to_me === '1' ? (
                                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    ) : (
                                                        <UserGroupIcon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                                                    )}
                                                    {localQueryParams.assigned_to_me === '1' && (
                                                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-cyan-500 rounded-full"></span>
                                                    )}
                                                </div>
                                                <span>Assignés à moi</span>
                                            </button>

                                            <button
                                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-300 border shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 whitespace-nowrap ${
                                                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                                } ${
                                                    localQueryParams.created_by_me === '1'
                                                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-transparent shadow-cyan-500/20'
                                                        : 'bg-black/30 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-400 border-cyan-500/40'
                                                }`}
                                                onClick={() => !isLoading && handleFilterClick('created')}
                                                disabled={isLoading}
                                                type="button"
                                                title="Afficher les tickets que vous avez créés"
                                            >
                                                <div className="relative">
                                                    {isLoading && localQueryParams.created_by_me === '1' ? (
                                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    ) : (
                                                        <DocumentPlusIcon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                                                    )}
                                                    {localQueryParams.created_by_me === '1' && (
                                                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-cyan-500 rounded-full"></span>
                                                    )}
                                                </div>
                                                <span>Créés par moi</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {auth.user.role === 'admin' && (
                                            <button
                                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                                className="flex items-center gap-2 px-4 py-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-200 rounded-full border border-cyan-500/40 hover:border-cyan-500/60"
                                            >
                                                <AdjustmentsHorizontalIcon className="w-5 h-5" />
                                                <span>Filtres Avancés</span>
                                                <ChevronDownIcon className={`w-4 h-4 transform transition-transform duration-200 ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}
                                        
                                        {/* Single Reset Filters Button */}
                                        {(localQueryParams.project_id || 
                                          localQueryParams.product_id || 
                                          localQueryParams.status || 
                                          localQueryParams.priority || 
                                          localQueryParams.date_start || 
                                          localQueryParams.date_end ||
                                          localQueryParams.assigned_to_me === '1' ||
                                          localQueryParams.created_by_me === '1' ||
                                          localQueryParams.name) && (
                                            <button
                                                onClick={clearAllFilters}
                                                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 transition-colors duration-200 rounded-full border border-red-500/40 hover:border-red-500/60"
                                                disabled={isLoading}
                                            >
                                                <XMarkIcon className="w-5 h-5" />
                                                <span>Réinitialiser les filtres</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Advanced Filters - Only visible for admin */}
                                {auth.user.role === 'admin' && showAdvancedFilters && (
                                    <AdvancedFilters
                                        localQueryParams={localQueryParams}
                                        projectsList={projectsList}
                                        selectedProjectProducts={selectedProjectProducts}
                                        dateRange={dateRange}
                                        isLoading={isLoading}
                                        handleProjectChange={handleProjectChange}
                                        handleProductChange={handleProductChange}
                                        handleFilterChange={handleFilterChange}
                                        setDateRange={setDateRange}
                                        handleDateRangeChange={handleDateRangeChange}
                                        clearAllFilters={clearAllFilters}
                                    />
                                )}
                            </div>

                            {/* Table Section */}
                            <div className="w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl">
                                <table className="w-full divide-y divide-white/10" role="grid">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-cyan-950/50 via-slate-900/50 to-cyan-950/50">
                                            <TableHeading
                                                name="id"
                                                sortable={true}
                                                sort_field={localQueryParams.sort_field}
                                                sort_direction={localQueryParams.sort_direction}
                                                sortChange={sortChange}
                                            >
                                                <div className="flex items-center gap-2 text-cyan-400 font-medium">
                                                    <ClockIcon className="w-4 h-4" />
                                                    ID {getSortIcon('id')}
                                                </div>
                                            </TableHeading>
                                            {!hideProjectColumn && (
                                                <th className="px-4 py-3 text-cyan-400 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <ListBulletIcon className="w-4 h-4" />
                                                        Produits
                                                    </div>
                                                </th>
                                            )}
                                            <TableHeading
                                                name="name"
                                                sortable={true}
                                                sort_field={localQueryParams.sort_field}
                                                sort_direction={localQueryParams.sort_direction}
                                                sortChange={sortChange}
                                            >
                                                <div className="flex items-center gap-2 text-cyan-400 font-medium">
                                                    <MagnifyingGlassIcon className="w-4 h-4" />
                                                    Nom {getSortIcon('name')}
                                                </div>
                                            </TableHeading>
                                            <TableHeading>
                                                <div className="flex items-center gap-2 text-cyan-400 font-medium">
                                                    <FunnelIcon className="w-4 h-4" />
                                                    Statut
                                                </div>
                                            </TableHeading>
                                            <TableHeading onClick={() => sortChange('priority')}>
                                                <div className="flex items-center gap-2 text-cyan-400 font-medium">
                                                    <FlagIcon className="w-4 h-4" />
                                                    Priorité {getSortIcon('priority')}
                                                </div>
                                            </TableHeading>
                                            <TableHeading
                                                name="created_at"
                                                sortable={true}
                                                sort_field={localQueryParams.sort_field}
                                                sort_direction={localQueryParams.sort_direction}
                                                sortChange={sortChange}
                                            >
                                                <div className="flex items-center gap-2 text-cyan-400 font-medium">
                                                    <CalendarIcon className="w-4 h-4" />
                                                    Date de création {getSortIcon('created_at')}
                                                </div>
                                            </TableHeading>
                                            <TableHeading
                                                name="due_date"
                                                sortable={true}
                                                sort_field={localQueryParams.sort_field}
                                                sort_direction={localQueryParams.sort_direction}
                                                sortChange={sortChange}
                                            >
                                                <div className="flex items-center gap-2 text-cyan-400 font-medium">
                                                    <CalendarIcon className="w-4 h-4" />
                                                    Date limite {getSortIcon('due_date')}
                                                </div>
                                            </TableHeading>
                                            <th className="px-4 py-3 text-cyan-400 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="w-4 h-4" />
                                                    Créé par
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-cyan-400 font-medium">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {renderTasks()}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="mt-6">
                                <Pagination 
                                    links={tasks.meta.links} 
                                    onClick={handlePagination}
                                    showSpinnerOnClick={true}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}