import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head, router} from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import Pagination from '@/Components/Pagination';
import TextInput from '@/Components/TextInput';
import TableHeading from '@/Components/TableHeading';
import { useState, useCallback } from 'react';
import { 
    PlusIcon,
    ClockIcon,
    UserIcon,
    EnvelopeIcon,
    CalendarIcon,
    PencilSquareIcon,
    TrashIcon,
    ShieldCheckIcon,
    ShieldExclamationIcon,
    ArrowPathIcon,
    XMarkIcon,
    InformationCircleIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ChartBarIcon,
    ClipboardDocumentCheckIcon,
    ClipboardDocumentListIcon,
    BellAlertIcon,
    CheckBadgeIcon,
    XCircleIcon,
    FireIcon,
    StarIcon,
    BoltIcon,
    ChartPieIcon,
    SparklesIcon,
    TrophyIcon,
    RocketLaunchIcon,
    HandThumbUpIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import TaskPieChart from '@/Components/TaskPieChart';
      
export const ROLE_BADGE_CLASSES = {
    admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    user: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

export const ROLE_LABELS = {
    admin: 'Administrateur',
    user: 'Utilisateur'
};

// Add safety checks for calculations
const safeCalculatePercentage = (numerator, denominator) => {
    if (!denominator || denominator === 0) return 0;
    return Math.round((numerator / denominator) * 100);
};

// Add performance level constants
const PERFORMANCE_LEVELS = {
    EXCEPTIONAL: { label: 'Exceptionnel', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    GOOD: { label: 'Bon', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    AVERAGE: { label: 'Moyen', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    NEEDS_IMPROVEMENT: { label: 'À améliorer', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

// Improved performance calculation function
const calculatePerformanceLevel = (user) => {
    if (!user) return PERFORMANCE_LEVELS.NEEDS_IMPROVEMENT;

    const completionRate = user.completion_rate || 0;
    const totalInterventions = (user.accepted_interventions_count || 0) + (user.refused_interventions_count || 0);
    const acceptanceRate = totalInterventions > 0 
        ? ((user.accepted_interventions_count || 0) / totalInterventions) * 100 
        : 0;
    
    if (completionRate >= 90 && acceptanceRate >= 90) return PERFORMANCE_LEVELS.EXCEPTIONAL;
    if (completionRate >= 75 && acceptanceRate >= 75) return PERFORMANCE_LEVELS.GOOD;
    if (completionRate >= 60 && acceptanceRate >= 60) return PERFORMANCE_LEVELS.AVERAGE;
    return PERFORMANCE_LEVELS.NEEDS_IMPROVEMENT;
};

// Improved efficiency calculation function
const calculateEfficiencyScore = (user) => {
    if (!user) return 0;

    const tasksCompleted = user.tasks_completed || 0;
    const totalTasks = (user.tasks_pending || 0) + (user.tasks_in_progress || 0) + (user.tasks_completed || 0) || 1;
    const interventionsAccepted = user.accepted_interventions_count || 0;
    const totalInterventions = (user.accepted_interventions_count || 0) + 
        (user.refused_interventions_count || 0) + 
        (user.pending_interventions_count || 0) || 1;
    
    const taskEfficiency = (tasksCompleted / totalTasks) * 100;
    const interventionEfficiency = (interventionsAccepted / totalInterventions) * 100;
    
    return Math.round((taskEfficiency + interventionEfficiency) / 2);
};

// Add helper function for date formatting
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'N/A';
    }
};

// Add helper function for time since calculation
const getTimeSince = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' ans';
        
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' mois';
        
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' jours';
        
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' heures';
        
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' minutes';
        
        return Math.floor(seconds) + ' secondes';
    } catch (error) {
        console.error('Time calculation error:', error);
        return 'N/A';
    }
};

export default function Index({ auth , users , queryParams = null, success, deactivatedUsers }) {
    const [selectedUser, setSelectedUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    queryParams = queryParams || {}
    const searchFieldChange = (name, value) => {
       if (value) {
            queryParams[name] = value;
        } else {
            delete queryParams[name];
        }

        router.get(route('users.index'), queryParams, {
            preserveState: true,
            replace: true,
            only: ['users', 'deactivatedUsers', 'queryParams', 'success']
        });
    }
    const onKeyPress = (name, e) => {
        if (e.key === 'Enter') return;
        searchFieldChange(name, e.target.value);
    }

    const sortChange = (name) => {
        if ( name == queryParams.sort_field ) {
            if (queryParams.sort_direction == 'asc') {
                queryParams.sort_direction = 'desc'
            }else {
                queryParams.sort_direction = 'asc'
            }
        }else {
                queryParams.sort_field = name
                queryParams.sort_direction = 'asc'
            }
            router.get(route('users.index'), queryParams, {
                preserveState: true,
                replace: true,
                only: ['users', 'deactivatedUsers', 'queryParams', 'success']
            });
        }

    const deleteUser = (user) => {
        if (!window.confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ?')) {
            return;
        }   
        router.delete(route('user.destroy', user.id));
    }

    const forceDeleteUser = (user) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ? Cette action est irréversible.')) {
            return;
        }   
        router.delete(route('user.force-delete', { user: user.id }));
    }

    const restoreUser = (user) => {
        if (!window.confirm('Êtes-vous sûr de vouloir restaurer cet utilisateur ?')) {
            return;
        }   
        router.post(route('user.restore', user.id));
    }

    const toggleUserRole = (user) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir changer le rôle de ${user.name} ?`)) {
            return;
        }
        router.put(route('management.users.toggle-role', user.id), {}, {
            onSuccess: () => {
                // Refresh the page to show updated data
                router.reload();
            },
            onError: (errors) => {
                // Show error message if any
                if (errors.error) {
                    alert(errors.error);
                } else {
                    alert('Une erreur est survenue lors du changement de rôle.');
                }
            }
        });
    };

    const showUserStats = (user) => {
        setIsLoading(true);
        try {
            setSelectedUser(user);
        } catch (error) {
            console.error('Error showing user stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePagination = useCallback((url) => {
        router.get(url, {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['users', 'deactivatedUsers', 'queryParams']
        });
    }, []);

    return (
        <AuthenticatedLayout
            user = {auth.user}
            header={
                <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                            Liste des Utilisateurs
                        </h2>
                    </div>
                    <Link 
                        href={route('user.create')}
                        className='bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20'
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span className="relative">
                            Ajouter un nouvel utilisateur
                            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-white/50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                        </span>
                    </Link>
                </div>
            }
        >
            
            <Head title="Utilisateurs" />

            <div className="py-12">
                <div className="mx-auto max-w-[95%] sm:px-6 lg:px-8">

                    {
                     success && (
                     <div className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 py-3 px-4 text-emerald-400 rounded-lg mb-6 transform transition-all duration-300 hover:scale-[1.01]">
                       {success}
                      </div>
                     )  
                    }   
                    <div className="overflow-hidden bg-black/40 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/10 transform transition-all duration-300 hover:scale-[1.01]">
                    <h2 className="text-xl font-semibold mb-4 text-gray-300">Utilisateurs Activés</h2>
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <div className="w-full">
                            <table className="w-full divide-y divide-white/10">
                            <thead className="bg-gradient-to-r from-slate-800/80 via-slate-900/70 to-slate-800/80">
                                <tr className="text-norwrap">
                                    <TableHeading 
                                    name="id"
                                    sortable={true}
                                    sort_field={queryParams.sort_field} 
                                    sort_direction={queryParams.sort_direction} 
                                    sortChange={sortChange}
                                    >
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <ClockIcon className="w-4 h-4" />
                                            ID
                                        </div>
                                    </TableHeading>

                                        <TableHeading 
                                    name="name"
                                    sortable={true}
                                    sort_field={queryParams.sort_field} 
                                    sort_direction={queryParams.sort_direction} 
                                    sortChange={sortChange}
                                    >
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <UserIcon className="w-4 h-4" />
                                            Nom
                                        </div>
                                    </TableHeading>

                                    <TableHeading 
                                    name="email"
                                    sortable={true}
                                    sort_field={queryParams.sort_field} 
                                    sort_direction={queryParams.sort_direction} 
                                    sortChange={sortChange}
                                     >
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <EnvelopeIcon className="w-4 h-4" />
                                            Email
                                        </div>
                                    </TableHeading>

                                    <TableHeading 
                                    name="created_at"
                                    sortable={true}
                                    sort_field={queryParams.sort_field} 
                                    sort_direction={queryParams.sort_direction} 
                                    sortChange={sortChange}
                                    
                                    >
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <CalendarIcon className="w-4 h-4" />
                                            Date de création
                                        </div>
                                    </TableHeading>

                                    <TableHeading 
                                    name="role"
                                    sortable={true}
                                    sort_field={queryParams.sort_field} 
                                    sort_direction={queryParams.sort_direction} 
                                    sortChange={sortChange}
                                    >
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <ShieldCheckIcon className="w-4 h-4" />
                                            Rôle
                                        </div>
                                    </TableHeading>

                                    <th className="px-3 py-2 text-gray-400">
                                        <div className="flex items-center gap-2">
                                            Actions
                                        </div>
                                    </th>
                                    
                                </tr>
                            </thead>
                            <thead className="bg-black/40">
                                <tr className="text-norwrap">
                                    <th className="px-3 py-2"></th>
                                    <th className="px-3 py-2">
                                       <TextInput 
                                         className="w-full bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400" 
                                         defaultValue={queryParams.name}
                                         placeholder="Nom d'utilisateur"
                                         onKeyDown={e => e.key === 'Enter' && searchFieldChange('name', e.target.value)}
                                        />
                                    </th>
                                    <th className="px-3 py-2">
                                        <TextInput 
                                         className="w-full bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400" 
                                         defaultValue={queryParams.email}
                                         placeholder="Email d'utilisateur"
                                         onKeyDown={e => e.key === 'Enter' && searchFieldChange('email', e.target.value)}
                                        />
                                    </th>
                                    <th className="px-3 py-2"></th>
                                    <th className="px-3 py-2"></th>
                                    <th className="px-3 py-2"></th>


                                    
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {users.data.map((user) => (
                                    <tr key={user.id} className="bg-black/20 hover:bg-black/30 transition-colors duration-200 group">
                                     <td className='px-3 py-2 text-gray-300'>{user.id}</td>

                                        <td className='px-3 py-2 text-left'>

                                            <button
                                                onClick={() => showUserStats(user)}
                                                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 group-hover:underline underline-offset-4 decoration-cyan-500/50"
                                            >
                                                {user.name}
                                            </button>
                                        </td>
                                        <td className="px-3 py-2 text-gray-300">
                                            {user.email}
                                        </td>

                                        <td className='px-3 py-2 text-gray-300'>{user.created_at}</td>

                                        <td className="px-3 py-2">
                                            <span className={`px-3 py-1 rounded-full text-sm border ${ROLE_BADGE_CLASSES[user.role]}`}>
                                                {ROLE_LABELS[user.role]}
                                            </span>
                                        </td>

                                        <td className='px-3 py-2 text-nowrap'>
                                                    <div className="flex items-center gap-3">
                                                        <Link
                                                            href={route('user.edit', user.id)}
                                                            className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                                                            title="Modifier"
                                                        >
                                                            <PencilSquareIcon className="w-5 h-5" />
                                                        </Link>
                                                        <button 
                                                            onClick={() => toggleUserRole(user)}
                                                            className={`transition-colors duration-200 ${
                                                                user.role === 'admin' 
                                                                    ? 'text-purple-400 hover:text-purple-300' 
                                                                    : 'text-yellow-400 hover:text-yellow-300'
                                                            }`}
                                                            title={user.role === 'admin' ? 'Rétrograder en utilisateur' : 'Promouvoir en administrateur'}
                                                        >
                                                            {user.role === 'admin' ? (
                                                                <ShieldExclamationIcon className="w-5 h-5" />
                                                            ) : (
                                                                <ShieldCheckIcon className="w-5 h-5" />
                                                            )}
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteUser(user)}
                                                            className="text-red-400 hover:text-red-300 transition-colors duration-200"
                                                            title="Désactiver"
                                                        >
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>

                                    </tr>
                                ))}

                            </tbody>
                        </table>
                            </div>
                        <Pagination 
                            links={users.meta.links} 
                            onClick={handlePagination}
                            showSpinnerOnClick={true}
                        />
                        </div>
                    </div>

                    {/* User Statistics Block */}
                    {selectedUser && (
                        <div className="relative my-8 bg-gradient-to-r from-cyan-900/60 via-blue-900/60 to-cyan-900/60 border border-cyan-500/20 rounded-2xl shadow-lg p-8 flex flex-col gap-8 animate-fade-in transform transition-all duration-500 hover:scale-[1.01]">
                            {isLoading ? (
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                                </div>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => setSelectedUser(null)} 
                                        className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                                        title="Fermer"
                                    >
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>

                                    {/* Enhanced Header Section with Performance Badge */}
                                    <div className="flex items-center justify-between border-b border-cyan-500/20 pb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30">
                                                <UserIcon className="w-10 h-10 text-cyan-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-white">
                                                    Statistiques avancées pour : <span className="text-cyan-400">{selectedUser.name}</span>
                                                </h3>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <p className="text-gray-400">
                                                        Membre depuis {formatDate(selectedUser.created_at)} ({getTimeSince(selectedUser.created_at)})
                                                    </p>
                                                    <span className={`px-4 py-2 rounded-xl text-sm font-medium ${ROLE_BADGE_CLASSES[selectedUser.role]}`}>
                                                        {ROLE_LABELS[selectedUser.role]}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${calculatePerformanceLevel(selectedUser).bgColor}`}>
                                                <SparklesIcon className={`w-5 h-5 ${calculatePerformanceLevel(selectedUser).color}`} />
                                                <span className={`font-medium ${calculatePerformanceLevel(selectedUser).color}`}>
                                                    {calculatePerformanceLevel(selectedUser).label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <BoltIcon className="w-5 h-5 text-yellow-400" />
                                                <span className="text-yellow-400 font-medium">
                                                    Score d'efficacité: {calculateEfficiencyScore(selectedUser)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Key Performance Indicators */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Overall Performance Card */}
                                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20 col-span-full">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-purple-500/20 rounded-lg">
                                                        <TrophyIcon className="w-6 h-6 text-purple-400" />
                                                    </div>
                                                    <h4 className="text-lg font-medium text-white">Performance Globale</h4>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <RocketLaunchIcon className="w-5 h-5 text-purple-400" />
                                                        <span className="text-purple-400">Niveau {Math.floor(calculateEfficiencyScore(selectedUser) / 10)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-black/30 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <HandThumbUpIcon className="w-5 h-5 text-emerald-400" />
                                                        <span className="text-emerald-400 font-medium">Points Forts</span>
                                                    </div>
                                                    <ul className="text-gray-300 text-sm space-y-1">
                                                        {(selectedUser.completion_rate || 0) >= 80 && 
                                                            <li>• Excellent taux de complétion</li>}
                                                        {safeCalculatePercentage(
                                                            selectedUser.accepted_interventions_count,
                                                            (selectedUser.accepted_interventions_count || 0) + (selectedUser.refused_interventions_count || 0)
                                                        ) >= 80 && 
                                                            <li>• Interventions de qualité</li>}
                                                        {(selectedUser.created_tasks_count || 0) >= 10 && 
                                                            <li>• Forte initiative</li>}
                                                    </ul>
                                                </div>
                                                <div className="bg-black/30 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
                                                        <span className="text-yellow-400 font-medium">À Améliorer</span>
                                                    </div>
                                                    <ul className="text-gray-300 text-sm space-y-1">
                                                        {selectedUser.completion_rate < 60 && <li>• Taux de complétion faible</li>}
                                                        {selectedUser.refused_interventions_count > selectedUser.accepted_interventions_count && 
                                                            <li>• Qualité des interventions</li>}
                                                        {selectedUser.tasks_pending > selectedUser.tasks_completed && <li>• Gestion des tâches en attente</li>}
                                                    </ul>
                                                </div>
                                                <div className="bg-black/30 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <ChartPieIcon className="w-5 h-5 text-blue-400" />
                                                        <span className="text-blue-400 font-medium">Statistiques Clés</span>
                                                    </div>
                                                    <ul className="text-gray-300 text-sm space-y-1">
                                                        <li>• {Math.round((selectedUser.tasks_completed / (selectedUser.tasks_pending + selectedUser.tasks_in_progress + selectedUser.tasks_completed)) * 100)}% tâches complétées</li>
                                                        <li>• {Math.round((selectedUser.accepted_interventions_count / (selectedUser.accepted_interventions_count + selectedUser.refused_interventions_count + selectedUser.pending_interventions_count)) * 100)}% interventions acceptées</li>
                                                        <li>• {selectedUser.created_tasks_count} tâches créées</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {/* Tasks Created */}
                                        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-6 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 group">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-3 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-all duration-300">
                                                    <ClipboardDocumentListIcon className="w-6 h-6 text-cyan-400" />
                                                </div>
                                                <span className="text-3xl font-bold text-cyan-400">{selectedUser.created_tasks_count}</span>
                                            </div>
                                            <h4 className="text-gray-300 font-medium">Tâches créées</h4>
                                            <p className="text-gray-500 text-sm mt-1">Total des tâches initiées</p>
                                        </div>

                                        {/* Tasks Assigned */}
                                        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-all duration-300">
                                                    <ClipboardDocumentCheckIcon className="w-6 h-6 text-blue-400" />
                                                </div>
                                                <span className="text-3xl font-bold text-blue-400">{selectedUser.assigned_tasks_count}</span>
                                            </div>
                                            <h4 className="text-gray-300 font-medium">Tâches assignées</h4>
                                            <p className="text-gray-500 text-sm mt-1">Responsabilités actuelles</p>
                                        </div>

                                        {/* Interventions Accepted */}
                                        <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl p-6 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 group">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-3 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-all duration-300">
                                                    <CheckBadgeIcon className="w-6 h-6 text-emerald-400" />
                                                </div>
                                                <span className="text-3xl font-bold text-emerald-400">{selectedUser.accepted_interventions_count}</span>
                                            </div>
                                            <h4 className="text-gray-300 font-medium">Interventions acceptées</h4>
                                            <p className="text-gray-500 text-sm mt-1">Taux de succès élevé</p>
                                        </div>

                                        {/* Interventions Refused */}
                                        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl p-6 border border-red-500/20 hover:border-red-500/40 transition-all duration-300 group">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-3 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-all duration-300">
                                                    <XCircleIcon className="w-6 h-6 text-red-400" />
                                                </div>
                                                <span className="text-3xl font-bold text-red-400">{selectedUser.refused_interventions_count}</span>
                                            </div>
                                            <h4 className="text-gray-300 font-medium">Interventions refusées</h4>
                                            <p className="text-gray-500 text-sm mt-1">Nécessite attention</p>
                                        </div>
                                    </div>

                                    {/* Activity Timeline */}
                                    <div className="bg-black/30 rounded-xl p-6 border border-white/10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <ClockIcon className="w-6 h-6 text-cyan-400" />
                                            <h4 className="text-lg font-medium text-white">Chronologie d'Activité</h4>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-24 text-sm text-gray-400">Dernière connexion</div>
                                                <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                                        style={{ width: '100%' }}
                                                    />
                                                </div>
                                                <div className="text-cyan-400">{selectedUser.last_activity ? new Date(selectedUser.last_activity).toLocaleString('fr-FR') : 'N/A'}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-24 text-sm text-gray-400">Tâches actives</div>
                                                <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                                                        style={{ width: `${(selectedUser.tasks_in_progress / (selectedUser.tasks_pending + selectedUser.tasks_in_progress + selectedUser.tasks_completed)) * 100}%` }}
                                                    />
                                                </div>
                                                <div className="text-yellow-400">{selectedUser.tasks_in_progress} en cours</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-24 text-sm text-gray-400">Interventions</div>
                                                <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"
                                                        style={{ width: `${(selectedUser.accepted_interventions_count / (selectedUser.accepted_interventions_count + selectedUser.refused_interventions_count + selectedUser.pending_interventions_count)) * 100}%` }}
                                                    />
                                                </div>
                                                <div className="text-emerald-400">{selectedUser.accepted_interventions_count} acceptées</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Charts Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Tasks Distribution */}
                                        <div className="bg-black/30 rounded-xl p-6 border border-white/10">
                                            <div className="flex items-center gap-3 mb-6">
                                                <ChartBarIcon className="w-6 h-6 text-cyan-400" />
                                                <h4 className="text-lg font-medium text-white">Distribution des Tâches</h4>
                                            </div>
                                            <TaskPieChart
                                                data={[
                                                    { name: 'En attente', value: selectedUser.tasks_pending },
                                                    { name: 'En cours', value: selectedUser.tasks_in_progress },
                                                    { name: 'Terminées', value: selectedUser.tasks_completed },
                                                ]}
                                            />
                                        </div>

                                        {/* Interventions Distribution */}
                                        <div className="bg-black/30 rounded-xl p-6 border border-white/10">
                                            <div className="flex items-center gap-3 mb-6">
                                                <ChartBarIcon className="w-6 h-6 text-blue-400" />
                                                <h4 className="text-lg font-medium text-white">Distribution des Interventions</h4>
                                            </div>
                                            <TaskPieChart
                                                data={[
                                                    { name: 'Acceptées', value: selectedUser.accepted_interventions_count },
                                                    { name: 'Refusées', value: selectedUser.refused_interventions_count },
                                                    { name: 'En attente', value: selectedUser.pending_interventions_count },
                                                ]}
                                            />
                                        </div>
                                    </div>

                                    {/* Additional Metrics */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Completion Rate */}
                                        <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-xl p-6 border border-emerald-500/20 group hover:border-emerald-500/40 transition-all duration-300">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-all duration-300">
                                                    <StarIcon className="w-6 h-6 text-emerald-400" />
                                                </div>
                                                <span className="text-4xl font-bold text-emerald-400">{selectedUser.completion_rate}%</span>
                                            </div>
                                            <h4 className="text-gray-300 font-medium">Taux de complétion</h4>
                                            <div className="mt-2 bg-black/30 rounded-full h-2">
                                                <div 
                                                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${selectedUser.completion_rate}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Last Activity */}
                                        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20 group hover:border-blue-500/40 transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-all duration-300">
                                                    <ClockIcon className="w-6 h-6 text-blue-400" />
                                                </div>
                                            </div>
                                            <h4 className="text-gray-300 font-medium">Dernière activité</h4>
                                            <p className="text-lg font-semibold text-blue-400 mt-2">
                                                {selectedUser.last_activity ? new Date(selectedUser.last_activity).toLocaleString('fr-FR') : 'N/A'}
                                            </p>
                                        </div>

                                        {/* Most Active Project */}
                                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20 group hover:border-purple-500/40 transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-all duration-300">
                                                    <FireIcon className="w-6 h-6 text-purple-400" />
                                                </div>
                                            </div>
                                            <h4 className="text-gray-300 font-medium">Projet le plus actif</h4>
                                            <p className="text-lg font-semibold text-purple-400 mt-2">
                                                {selectedUser.most_active_project || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Deactivated Users Table */}
                    <div className="mt-8 bg-black/40 backdrop-blur-lg border border-white/10 overflow-hidden shadow-sm sm:rounded-lg p-6 text-gray-100">
                        <h2 className="text-xl font-semibold mb-4 text-gray-300">Utilisateurs Désactivés</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full whitespace-nowrap">
                                <thead>
                                    <tr className="text-left font-bold">
                                        <th className="pb-4 pt-6 px-6">ID</th>
                                        <th className="pb-4 pt-6 px-6">Nom</th>
                                        <th className="pb-4 pt-6 px-6">Email</th>
                                        <th className="pb-4 pt-6 px-6">Rôle</th>
                                        <th className="pb-4 pt-6 px-6">Date de désactivation</th>
                                        <th className="pb-4 pt-6 px-6">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deactivatedUsers.data.map((user) => (
                                        <tr key={user.id} className="bg-black/40 hover:bg-white/5 transition-colors duration-150">
                                            <td className="px-6 py-4 text-white/80">
                                                {user.id}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${(!user.is_active || user.deleted_at) ? 'text-red-500 line-through' : 'text-white/80'}`}>
                                                {user.name}
                                            </td>
                                            <td className="px-6 py-4 text-white/80">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ROLE_BADGE_CLASSES[user.role]}`}>
                                                    {ROLE_LABELS[user.role]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-white/80">
                                                {user.created_at}
                                            </td>
                                            <td className="px-6 py-4 text-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => restoreUser(user)}
                                                        className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                                                        title="Restaurer"
                                                    >
                                                        <ArrowPathIcon className="w-5 h-5" />
                                                    </button>
                                                    
                                                    
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {deactivatedUsers && deactivatedUsers.meta && deactivatedUsers.meta.links && (
                            <Pagination 
                                links={deactivatedUsers.meta.links} 
                                onClick={handlePagination}
                                showSpinnerOnClick={true}
                            />
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    )
    }        

    //**<img src={user.image_path} style={ {width: 60}}/> */


    //**{(() => {
      //**  const rawStatus = user.status || '';
       //** const normalizedStatus = rawStatus.trim().toLowerCase().replace(/\s+/g, '_');

         //** return (
        //**<span className={`px-2 py-1 rounded text-white text-sm ${USER_STATUS_CLASS_MAP[normalizedStatus] || 'bg-blue-500'}`}>
        //** {USER_STATUS_TEXT_MAP[normalizedStatus] || rawStatus}
        //**</span>
       //** );
    //** })()}