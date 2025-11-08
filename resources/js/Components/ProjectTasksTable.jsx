import { Link } from '@inertiajs/react';
import { 
    PencilSquareIcon,
    ClockIcon,
    UserIcon,
    FlagIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ClockIcon as PendingIcon,
    EyeIcon
} from '@heroicons/react/24/outline';

const STATUS_STYLES = {
    'pending': {
        icon: PendingIcon,
        text: 'En attente',
        className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    },
    'in-progress': {
        icon: ClockIcon,
        text: 'En cours',
        className: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    },
    'completed': {
        icon: CheckCircleIcon,
        text: 'Terminé',
        className: 'bg-green-500/10 text-green-400 border-green-500/20'
    }
};

const PRIORITY_STYLES = {
    'low': {
        text: 'Basse',
        className: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    },
    'medium': {
        text: 'Moyenne',
        className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    },
    'high': {
        text: 'Haute',
        className: 'bg-red-500/10 text-red-400 border-red-500/20'
    }
};

export default function ProjectTasksTable({ tasks, auth }) {
    const StatusIcon = ({ status }) => {
        const IconComponent = STATUS_STYLES[status]?.icon;
        return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
    };

    if (!tasks || !tasks.data) {
        return (
            <div className="text-center text-gray-400 py-8">
                <ExclamationCircleIcon className="w-6 h-6 mx-auto mb-2" />
                <p>Erreur de chargement des tickets</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full divide-y divide-white/10">
                <thead>
                    <tr className="bg-gradient-to-r from-cyan-950/50 via-slate-900/50 to-cyan-950/50">
                        <th className="px-4 py-3 text-left">
                            <div className="flex items-center gap-2 text-cyan-400 font-medium">
                                <ClockIcon className="w-4 h-4" />
                                ID
                            </div>
                        </th>
                        <th className="px-4 py-3 text-left">
                            <div className="flex items-center gap-2 text-cyan-400 font-medium">
                                Nom
                            </div>
                        </th>
                        <th className="px-4 py-3 text-left">
                            <div className="flex items-center gap-2 text-cyan-400 font-medium">
                                <UserIcon className="w-4 h-4" />
                                Assigné à
                            </div>
                        </th>
                        <th className="px-4 py-3 text-left">
                            <div className="flex items-center gap-2 text-cyan-400 font-medium">
                                <FlagIcon className="w-4 h-4" />
                                Priorité
                            </div>
                        </th>
                        <th className="px-4 py-3 text-left">
                            <div className="flex items-center gap-2 text-cyan-400 font-medium">
                                Statut
                            </div>
                        </th>
                        <th className="px-4 py-3 text-left">
                            <div className="flex items-center gap-2 text-cyan-400 font-medium">
                                Actions
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                    {tasks.data.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <ExclamationCircleIcon className="w-6 h-6" />
                                    <span>Aucun ticket trouvé pour cette machine</span>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        tasks.data.map((task) => (
                            <tr key={task.id} className="group hover:bg-cyan-500/5 transition-colors duration-200">
                                <td className="px-4 py-3 text-gray-300 font-medium">
                                    {task.id}
                                </td>
                                <td className="px-4 py-3">
                                    <Link 
                                        href={route('task.show', task.id)}
                                        className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                                    >
                                        {task.name}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-gray-300">
                                    {task.assignedUser?.name || 'Non assigné'}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${PRIORITY_STYLES[task.priority]?.className}`}>
                                        {PRIORITY_STYLES[task.priority]?.text || task.priority}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[task.status]?.className}`}>
                                        <StatusIcon status={task.status} />
                                        {STATUS_STYLES[task.status]?.text || task.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={route('task.show', task.id)}
                                            className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors duration-200"
                                            aria-label={`Voir le ticket ${task.name}`}
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                        </Link>
                                        {(auth.user.role === 'admin' || task.created_by === auth.user.id) && (
                                            <Link
                                                href={route('task.edit', task.id)}
                                                className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors duration-200"
                                                aria-label={`Modifier le ticket ${task.name}`}
                                            >
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </Link>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
} 