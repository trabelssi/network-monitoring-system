import { Link } from '@inertiajs/react';
import { router, usePage } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import Pagination from '@/Components/Pagination';
import { TASK_STATUS_CLASS_MAP, TASK_STATUS_TEXT_MAP, TASK_PRIORITY_TEXT_MAP, TASK_PRIORITY_CLASS_MAP } from '@/constants.jsx';
import TextInput from '@/Components/TextInput';
import SelectInput from '@/Components/SelectInput';
import { 
    MagnifyingGlassIcon,
    CalendarIcon,
    UserIcon,
    ClockIcon,
    FlagIcon,
    UserGroupIcon,
    EyeIcon,
    ChatBubbleLeftEllipsisIcon,
    DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function ObservedTasksTable({ tasks, auth }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { errors } = usePage().props;

    // Debounced search
    const handleSearch = useCallback((value) => {
        if (searchTimeout) clearTimeout(searchTimeout);
        setError(null);
        
        setSearchTimeout(setTimeout(() => {
            setIsLoading(true);
            router.get(route('task.observed'), { search: value }, {
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
    }, [searchTimeout]);

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Add this handler near other handlers
    const handlePagination = useCallback((url) => {
        setIsLoading(true);
        router.get(url, {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['tasks'],
            onFinish: () => setIsLoading(false)
        });
    }, []);

    return (
        <div className="py-12">
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                {/* Search and Filters */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <TextInput
                                type="text"
                                value={searchTerm}
                                className="pl-10 w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                placeholder="Rechercher un ticket..."
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    handleSearch(e.target.value);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Tasks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.data.map(task => (
                        <div key={task.id} className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                            {/* Task Header */}
                            <div className="p-4 border-b border-white/10">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <Link 
                                            href={route('task.show', task.id)}
                                            className="text-lg font-semibold text-white hover:text-cyan-400 transition-colors duration-300"
                                        >
                                            {task.name}
                                        </Link>
                                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
                                            <ClockIcon className="w-4 h-4" />
                                            <span>{task.created_at}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${TASK_STATUS_CLASS_MAP[task.status]}`}>
                                            {TASK_STATUS_TEXT_MAP[task.status]}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${TASK_PRIORITY_CLASS_MAP[task.priority]}`}>
                                            {TASK_PRIORITY_TEXT_MAP[task.priority]}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Task Content */}
                            <div className="p-4 space-y-4">
                                {/* Project and Products */}
                                <div className="space-y-2">
                                    <div className="text-sm text-gray-400">Machine:</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white">
                                            {task.products && task.products.length > 0 && task.products[0].project
                                                ? task.products[0].project.name
                                                : 'Aucune machine'}
                                        </span>
                                    </div>
                                </div>

                                {/* Assigned User */}
                                <div className="space-y-2">
                                    <div className="text-sm text-gray-400">Assigné à:</div>
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="w-4 h-4 text-cyan-400" />
                                        <span className="text-white">{task.assigned_user ? task.assigned_user.name : 'Non assigné'}</span>
                                    </div>
                                </div>

                                {/* Due Date */}
                                {task.due_date && (
                                    <div className="space-y-2">
                                        <div className="text-sm text-gray-400">Date limite:</div>
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4 text-cyan-400" />
                                            <span className="text-white">{task.due_date}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Observers Count */}
                                <div className="space-y-2">
                                    <div className="text-sm text-gray-400">Observateurs:</div>
                                    <div className="flex items-center gap-2">
                                        <UserGroupIcon className="w-4 h-4 text-cyan-400" />
                                        <span className="text-white">{task.observers ? task.observers.length : 0} observateurs</span>
                                    </div>
                                </div>
                            </div>

                            {/* Task Footer */}
                            <div className="p-4 bg-white/5 border-t border-white/10">
                                <div className="flex items-center justify-between">
                                    <Link
                                        href={route('task.show', task.id)}
                                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-300"
                                    >
                                        <DocumentMagnifyingGlassIcon className="w-5 h-5" />
                                        <span>Voir les détails</span>
                                    </Link>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <EyeIcon className="w-5 h-5" />
                                        <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {tasks.links && (
                    <div className="mt-6">
                        <Pagination 
                            links={tasks.links} 
                            onClick={handlePagination}
                            showSpinnerOnClick={true}
                        />
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-cyan-500"></div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
} 