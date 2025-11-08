import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { TASK_STATUS_CLASS_MAP, TASK_STATUS_TEXT_MAP } from '@/constants.jsx';
import { 
    BellIcon, ClockIcon, CheckCircleIcon, ExclamationCircleIcon, 
    FolderIcon, CalendarIcon, ChartBarIcon, MagnifyingGlassIcon,
    ExclamationTriangleIcon, FireIcon, ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import TaskPieChart from '@/Components/TaskPieChart';
import { useState, useMemo } from 'react';
import debounce from 'lodash/debounce';

// Task Priority Badge Component
const PriorityBadge = ({ priority }) => {
    const priorityConfig = {
        high: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: FireIcon },
        medium: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: ExclamationTriangleIcon },
        low: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: ArrowTrendingUpIcon },
    };

    const config = priorityConfig[priority] || priorityConfig.low;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${config.color} border transition-all duration-300`}>
            <Icon className="w-3.5 h-3.5" />
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </span>
    );
};

export default function UserDashboard({
    auth,
    myPendingTasks,
    myCompletedTasks,
    myInProgressTasks,
    activeTasks,
    recentNotifications
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');

    const chartData = useMemo(() => [
        { name: 'En Attente', value: myPendingTasks },
        { name: 'En Cours', value: myInProgressTasks },
        { name: 'Terminées', value: myCompletedTasks },
    ], [myPendingTasks, myInProgressTasks, myCompletedTasks]);

    // Filter tasks based on search query and status
    const filteredTasks = useMemo(() => {
        return activeTasks.data.filter(task => {
            const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = selectedFilter === 'all' || task.status === selectedFilter;
            return matchesSearch && matchesFilter;
        });
    }, [activeTasks.data, searchQuery, selectedFilter]);

    // Calculate days until due date
    const getDaysUntilDue = (dueDate) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleSearch = debounce((value) => {
        setSearchQuery(value);
    }, 300);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg transition-all duration-300 transform hover:rotate-12">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Tableau de Bord Utilisateur</p>
                            <h2 className="text-2xl font-bold text-white">
                                Bienvenue, {auth.user.name}
                            </h2>
                        </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.location.href = route('notifications.index')}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                            <BellIcon className="w-5 h-5" />
                            Notifications
                        </button>
                        <button
                            onClick={() => window.location.href = route('task.myTasks')}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                            <ClockIcon className="w-5 h-5" />
                            Mes Tâches
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Tableau de Bord" />

            <div className="py-6">
                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                        { label: 'En Attente', value: myPendingTasks, color: 'from-violet-500', colorTo: 'to-purple-500', icon: ClockIcon, textColor: 'text-violet-400' },
                        { label: 'En Cours', value: myInProgressTasks, color: 'from-blue-500', colorTo: 'to-cyan-500', icon: ExclamationCircleIcon, textColor: 'text-blue-400' },
                        { label: 'Terminés', value: myCompletedTasks, color: 'from-emerald-500', colorTo: 'to-green-500', icon: CheckCircleIcon, textColor: 'text-emerald-400' },
                    ].map(({ label, value, color, colorTo, icon: Icon, textColor }, i) => (
                        <div 
                            key={i} 
                            className="bg-gradient-to-br from-slate-900/60 via-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/70 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-slate-400 text-sm font-medium mb-1">{label}</h3>
                                    <div className="text-3xl font-bold text-white">{value}</div>
                                    <div className={`text-sm mt-1 font-medium ${textColor}`}>
                                        Tickets
                                    </div>
                                </div>
                                <div className={`bg-gradient-to-r ${color} ${colorTo} p-3 rounded-xl transform transition-transform duration-300 hover:rotate-12`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Tasks Overview */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-gradient-to-br from-slate-900/60 via-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg transition-all duration-300 transform hover:rotate-12">
                                        <ChartBarIcon className='w-6 h-6 text-white' />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Gestion des Tâches</p>
                                        <h3 className="text-lg font-bold text-white">Mes Tickets Actifs</h3>
                                    </div>
                                </div>
                                
                                {/* Search and Filter */}
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Rechercher..."
                                            className="pl-11 pr-4 py-3 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-64 backdrop-blur-lg"
                                            onChange={(e) => handleSearch(e.target.value)}
                                        />
                                        <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                    </div>
                                    
                                    <select
                                        className="bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent px-4 py-3 backdrop-blur-lg appearance-none cursor-pointer"
                                        value={selectedFilter}
                                        onChange={(e) => setSelectedFilter(e.target.value)}
                                    >
                                        <option value="all">Tous</option>
                                        <option value="pending">En Attente</option>
                                        <option value="in-progress">En Cours</option>
                                        <option value="completed">Terminés</option>
                                    </select>
                                </div>
                            </div>

                            {filteredTasks.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="bg-gradient-to-r from-slate-500 to-slate-600 p-3 rounded-lg mx-auto w-fit mb-4">
                                        <ChartBarIcon className="w-8 h-8 text-white" />
                                    </div>
                                    <p className="text-gray-400 font-medium">Aucun ticket trouvé</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredTasks.map((task) => {
                                        const daysUntilDue = getDaysUntilDue(task.due_date);
                                        return (
                                            <div
                                                key={task.id}
                                                className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-black/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-3">
                                                        <Link
                                                            href={route('task.show', task.id)}
                                                            className="text-lg font-semibold text-white hover:text-cyan-400 transition-colors duration-300"
                                                        >
                                                            {task.name}
                                                        </Link>
                                                        <div className="flex items-center gap-3">
                                                            <PriorityBadge priority={task.priority || 'low'} />
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${TASK_STATUS_CLASS_MAP[task.status]} transition-all duration-300`}>
                                                                {TASK_STATUS_TEXT_MAP[task.status]}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                    
                                                <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                                                    <div className='flex items-center gap-3'>
                                                        <FolderIcon className='w-4 h-4 text-gray-500' />
                                                        <span>
                                                            {task.products && task.products.length > 0 && task.products[0].project ? task.products[0].project.name : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className='flex items-center gap-3'>
                                                        <CalendarIcon className='w-4 h-4 text-gray-500' />
                                                        <span className={`
                                                            ${daysUntilDue <= 1 ? 'text-red-400' : 
                                                              daysUntilDue <= 3 ? 'text-yellow-400' : 
                                                              'text-gray-400'}
                                                        `}>
                                                            Date limite: {task.due_date}
                                                            {daysUntilDue <= 3 && ` (${daysUntilDue} jour${daysUntilDue > 1 ? 's' : ''} restant${daysUntilDue > 1 ? 's' : ''})`}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                {task.progress !== undefined && (
                                                    <div className="mt-4">
                                                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                                            <div 
                                                                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300"
                                                                style={{ width: `${task.progress}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-2">{task.progress}% complété</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notifications and Stats */}
                    <div className="space-y-8">
                        {/* Notifications */}
                        <div className="bg-gradient-to-br from-slate-900/60 via-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div className='flex items-center gap-3'>
                                    <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-2 rounded-lg shadow-lg transition-all duration-300 transform hover:rotate-12">
                                        <BellIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Alertes Système</p>
                                        <h3 className="text-lg font-bold text-white">Notifications Récentes</h3>
                                    </div>
                                </div>
                                <Link
                                    href={route('notifications.index')}
                                    className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm"
                                >
                                    Voir tout →
                                </Link>
                            </div>
                            <div className="space-y-4">
                                {recentNotifications?.slice(0, 3).map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`bg-black/40 backdrop-blur-lg border rounded-xl p-4 transition-all duration-300 ${!notification.read_at ? 'border-cyan-500/30 hover:bg-black/50' : 'border-white/10 hover:bg-black/30'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {!notification.read_at && (
                                                <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_theme(colors.cyan.400)] flex-shrink-0"></div>
                                            )}
                                            <div className="flex-grow">
                                                <p className="text-sm text-white font-medium">
                                                    {notification.data?.message}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    {notification.data?.category && (
                                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                                            {notification.data.category}
                                                        </span>
                                                    )}
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(notification.created_at).toLocaleString('fr-FR')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Task Distribution Chart */}
                        <div className="bg-gradient-to-br from-slate-900/60 via-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-2 rounded-lg shadow-lg transition-all duration-300 transform hover:rotate-12">
                                    <ChartBarIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Analyse des Données</p>
                                    <h3 className="text-lg font-bold text-white">Distribution des Tickets</h3>
                                </div>
                            </div>
                            <TaskPieChart data={chartData} title="Distribution des Tickets" />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
