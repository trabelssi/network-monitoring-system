import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { format, formatDistanceToNow, isToday, isYesterday, isSameWeek, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
    ChevronLeftIcon, 
    BellIcon, 
    CheckCircleIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    TrashIcon,
    CheckIcon,
    BellAlertIcon,
    EyeIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import { useEffect, useState, useCallback, useRef } from 'react';

export default function Notification({ auth, notifications = [], message, error }) {
    const notificationsArray = Array.isArray(notifications) ? notifications : [];
    const unreadCount = notificationsArray.filter(n => !n.read_at).length;
    const previousUnreadCount = useRef(unreadCount);
    const [isRinging, setIsRinging] = useState(false);
    const [showConfirmClear, setShowConfirmClear] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [newNotifications, setNewNotifications] = useState(new Set());
    const notificationSound = useRef(new Audio('/sounds/notification-short.mp3'));
    const previousNotifications = useRef(new Set());
    const lastPlayedTimestamp = useRef(0);

    // Group notifications by date
    const groupedNotifications = notificationsArray.reduce((groups, notification) => {
        const date = parseISO(notification.created_at);
        let groupKey;

        if (isToday(date)) {
            groupKey = "Aujourd'hui";
        } else if (isYesterday(date)) {
            groupKey = 'Hier';
        } else if (isSameWeek(date, new Date())) {
            groupKey = 'Cette semaine';
        } else {
            groupKey = 'Plus ancien';
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(notification);
        return groups;
    }, {});

    // Filter notifications
    const getFilteredNotifications = useCallback(() => {
        const filtered = {};
        Object.keys(groupedNotifications).forEach(key => {
            filtered[key] = groupedNotifications[key].filter(notification => {
                if (selectedFilter === 'unread') return !notification.read_at;
                if (selectedFilter === 'read') return notification.read_at;
                return true;
            });
        });
        return filtered;
    }, [groupedNotifications, selectedFilter]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setShowConfirmClear(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Add preloading for the notification sound
    useEffect(() => {
        const audio = notificationSound.current;
        
        // Preload the audio file
        audio.load();
        
        // Prevent looping
        audio.loop = false;
        
        // Add error handling for audio
        audio.onerror = (error) => {
            console.error('Error loading notification sound:', error);
            setSoundEnabled(false);
        };

        return () => {
            audio.onerror = null;
        };
    }, []);

    // Track new notifications using localStorage
    useEffect(() => {
        // Get the set of already seen notification IDs from localStorage
        const seenNotifications = new Set(
            JSON.parse(localStorage.getItem('seenNotifications') || '[]')
        );

        // Find truly new notifications (ones we've never seen before)
        const newNotificationIds = notificationsArray
            .filter(notification => !seenNotifications.has(notification.id))
            .map(notification => notification.id);

        if (newNotificationIds.length > 0) {
            // Play sound only for brand new notifications
            if (soundEnabled) {
                notificationSound.current.currentTime = 0;
                notificationSound.current.play()
                    .then(() => {
                        console.log('Notification sound played successfully');
                    })
                    .catch((error) => {
                        console.error('Error playing notification sound:', error);
                        setSoundEnabled(false);
                    });
            }

            // Add new notifications to seen set
            const updatedSeenNotifications = [
                ...seenNotifications,
                ...newNotificationIds
            ];
            localStorage.setItem('seenNotifications', JSON.stringify(updatedSeenNotifications));

            // Set new notifications for animation
            setNewNotifications(new Set(newNotificationIds));

            // Clear animation after delay
            setTimeout(() => {
                setNewNotifications(new Set());
            }, 1000);
        }
    }, [notificationsArray, soundEnabled]);

    // Poll for new notifications
    useEffect(() => {
        const pollInterval = setInterval(() => {
            router.reload({ preserveScroll: true });
        }, 30000);

        return () => clearInterval(pollInterval);
    }, []);

    // Bell animation effect
    useEffect(() => {
        if (unreadCount > 0) {
            setIsRinging(true);
            const ringInterval = setInterval(() => {
                setIsRinging(prev => !prev);
            }, 5000);

            return () => clearInterval(ringInterval);
        } else {
            setIsRinging(false);
        }
    }, [unreadCount]);

    const clearAllNotifications = (e) => {
        e.preventDefault();
        if (confirm('Êtes-vous sûr de vouloir supprimer toutes vos notifications ?')) {
            router.delete(route('notifications.clearAll'), {
                preserveScroll: true,
                preserveState: false,
                onBefore: () => {
                    setShowConfirmClear(false);
                },
                onError: (errors) => {
                    console.error('Failed to clear notifications:', errors);
                }
            });
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            const relativeTime = formatDistanceToNow(date, { addSuffix: true, locale: fr });
            return relativeTime.charAt(0).toUpperCase() + relativeTime.slice(1);
        } catch {
            return 'Date invalide';
        }
    };

    const getNotificationIcon = (type) => {
        switch(type) {
            case 'success':
                return <CheckCircleIcon className="w-6 h-6 text-emerald-400" />;
            case 'error':
                return <ExclamationCircleIcon className="w-6 h-6 text-red-400" />;
            case 'info':
                return <InformationCircleIcon className="w-6 h-6 text-blue-400" />;
            default:
                return <BellAlertIcon className="w-6 h-6 text-cyan-400" />;
        }
    };

    const handleNotificationClick = (notification) => {
        if (notification.data?.url) {
            // First mark as read, then navigate
            router.post(route('notifications.markAsRead'), {
                notification_id: notification.id
            }, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    // After marking as read, navigate to the URL
                    router.visit(notification.data.url);
                }
            });
        }
    };

    const toggleSound = () => {
        setSoundEnabled(!soundEnabled);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                                <BellIcon 
                                    className={`h-8 w-8 text-white transition-transform duration-300 ${
                                        isRinging ? 'animate-ring' : ''
                                    }`} 
                                />
                            </div>
                            {unreadCount > 0 && (
                                <span className="absolute -top-2 -right-2 flex h-5 w-5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center">
                                        {unreadCount}
                                    </span>
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                            Vos Notifications
                            {unreadCount > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center px-2.5 py-0.5 text-sm font-medium bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full animate-pulse">
                                    {unreadCount} non lues
                                </span>
                            )}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSound}
                            className={`p-2 rounded-lg transition-all duration-300 ${
                                soundEnabled 
                                ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20' 
                                : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                            }`}
                            title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
                        >
                            {soundEnabled ? (
                                <SpeakerWaveIcon className="w-6 h-6" />
                            ) : (
                                <SpeakerXMarkIcon className="w-6 h-6" />
                            )}
                        </button>
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
                </div>
            }
        >
            <Head title="Notifications" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {message && (
                        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                            {error}
                        </div>
                    )}
                    <div className="bg-black/40 backdrop-blur-lg overflow-hidden shadow-sm sm:rounded-2xl border border-white/10">
                        <div className="p-6">
                            {/* Actions and Filters */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-2">
                                    {notificationsArray.length > 0 && (
                                        <form onSubmit={clearAllNotifications} className="inline">
                                            <button
                                                type="submit"
                                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 gap-2"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                                Tout effacer
                                            </button>
                                        </form>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
                                    <button
                                        onClick={() => setSelectedFilter('all')}
                                        className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                                            selectedFilter === 'all' 
                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' 
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        Toutes
                                    </button>
                                    <button
                                        onClick={() => setSelectedFilter('unread')}
                                        className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                                            selectedFilter === 'unread' 
                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' 
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        Non lues
                                    </button>
                                    <button
                                        onClick={() => setSelectedFilter('read')}
                                        className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                                            selectedFilter === 'read' 
                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' 
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        Lues
                                    </button>
                                </div>
                            </div>

                            {/* Notifications list */}
                            <div className="space-y-8">
                                {Object.entries(getFilteredNotifications()).map(([dateGroup, notifications]) => (
                                    notifications.length > 0 && (
                                        <div key={dateGroup} className="space-y-4">
                                            <h3 className="text-lg font-medium text-white/80 pl-4 border-l-2 border-cyan-500">
                                                {dateGroup}
                                            </h3>
                                            <div className="grid gap-4">
                                                {notifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        className={`group p-4 rounded-xl cursor-pointer transition-all duration-300 transform
                                                            ${!notification.read_at
                                                                ? 'bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-blue-400/5 border border-blue-500/30'
                                                                : 'bg-gradient-to-r from-white/10 via-white/5 to-transparent border border-white/10'
                                                            } 
                                                            ${newNotifications.has(notification.id) ? 'animate-notification-pop' : ''}
                                                            hover:scale-[1.01]`}
                                                        onClick={() => handleNotificationClick(notification)}
                                                        role="button"
                                                        tabIndex={0}
                                                        style={{ cursor: notification.data?.url ? 'pointer' : 'default' }}
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <div className={`p-2 rounded-lg ${
                                                                !notification.read_at 
                                                                ? 'bg-blue-500/10' 
                                                                : 'bg-white/5'
                                                            }`}>
                                                                {getNotificationIcon(notification.data?.type)}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className={`text-base ${
                                                                    !notification.read_at
                                                                        ? 'font-semibold text-white'
                                                                        : 'text-white/80'
                                                                } group-hover:text-cyan-400 transition-colors duration-300`}>
                                                                    {notification.data?.message || 'Notification'}
                                                                </p>
                                                                <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors duration-300">
                                                                    {formatDate(notification.created_at)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="h-2 w-2 rounded-full bg-blue-500 group-hover:bg-cyan-400 transition-colors duration-300"></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}

                                {Object.values(getFilteredNotifications()).every(group => group.length === 0) && (
                                    <div className="text-center py-12">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-4 rounded-full">
                                                <BellIcon className="w-12 h-12 text-cyan-400" />
                                            </div>
                                            <p className="text-white/60 text-lg">
                                                {selectedFilter === 'all' 
                                                    ? "Vous n'avez pas encore de notifications."
                                                    : selectedFilter === 'unread'
                                                    ? "Vous n'avez pas de notifications non lues."
                                                    : "Vous n'avez pas de notifications lues."
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal for Clear All */}
            {showConfirmClear && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmClear(false)}></div>
                    <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10 shadow-2xl transform transition-all duration-300 scale-100">
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-red-500/10 p-3 rounded-full">
                                <ExclamationCircleIcon className="w-8 h-8 text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Confirmer la suppression</h3>
                            <p className="text-center text-white/60">
                                Êtes-vous sûr de vouloir supprimer toutes vos notifications ? Cette action est irréversible.
                            </p>
                            <div className="flex items-center gap-3 mt-4">
                                <button
                                    onClick={() => setShowConfirmClear(false)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all duration-300"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={clearAllNotifications}
                                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105"
                                >
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>
                {`
                    @keyframes ring {
                        0% { transform: rotate(0); }
                        20% { transform: rotate(15deg); }
                        40% { transform: rotate(-15deg); }
                        60% { transform: rotate(7deg); }
                        80% { transform: rotate(-7deg); }
                        100% { transform: rotate(0); }
                    }
                    .animate-ring {
                        animation: ring 1s ease-in-out infinite;
                    }
                    @keyframes gradient-x {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    .animate-gradient-x {
                        animation: gradient-x 15s ease infinite;
                        background-size: 200% 200%;
                    }
                    @keyframes notification-pop {
                        0% { transform: scale(1) translateY(0); }
                        25% { transform: scale(1.03) translateY(-4px); }
                        50% { transform: scale(1.05) translateY(-6px); }
                        75% { transform: scale(1.03) translateY(-4px); }
                        100% { transform: scale(1) translateY(0); }
                    }
                    .animate-notification-pop {
                        animation: notification-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                    }
                `}
            </style>
        </AuthenticatedLayout>
    );
}
