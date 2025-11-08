import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { TASK_STATUS_CLASS_MAP, TASK_STATUS_TEXT_MAP, TASK_PRIORITY_TEXT_MAP, TASK_PRIORITY_CLASS_MAP } from '@/constants.jsx';
import TextInput from '@/Components/TextInput';
import Pagination from '@/Components/Pagination';
import { 
    MagnifyingGlassIcon,
    CalendarIcon,
    UserIcon,
    ClockIcon,
    FlagIcon,
    UserGroupIcon,
    EyeIcon,
    ChatBubbleLeftEllipsisIcon,
    DocumentMagnifyingGlassIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';

export default function ObservedTasks({ auth, tasks }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Debounced search
    const handleSearch = useCallback((value) => {
        if (searchTimeout) clearTimeout(searchTimeout);
        
        setSearchTimeout(setTimeout(() => {
            setIsLoading(true);
            router.get(route('task.observedTasks'), { name: value }, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => setIsLoading(false),
                onError: () => setIsLoading(false)
            });
        }, 300));
    }, [searchTimeout]);

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
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                            <EyeIcon className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                            Tickets Observés
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title="Tickets Observés" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Search Bar */}
                    <div className="mb-8">
                        <div className="relative max-w-md mx-auto">
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

                    {tasks.data.length > 0 ? (
                        <>
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
                                                    <span className="text-white">{task.assignedUser ? task.assignedUser.name : 'Non assigné'}</span>
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
                            {tasks.links && tasks.links.length > 3 && (
                                <div className="mt-8">
                                    <Pagination 
                                        links={tasks.links} 
                                        onClick={handlePagination}
                                        showSpinnerOnClick={true}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        // Empty State
                        <div className="text-center py-12">
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-full p-4">
                                    <EyeSlashIcon className="h-12 w-12 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-medium text-white">Aucun ticket observé</h3>
                                <p className="text-gray-400 max-w-md">
                                    Vous n'observez actuellement aucun ticket. Les tickets que vous observez apparaîtront ici.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-cyan-500"></div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 