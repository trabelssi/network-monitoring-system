import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { 
    BellIcon, 
    BellSlashIcon,
    CheckCircleIcon, 
    XMarkIcon,
    EyeIcon,
    ChevronRightIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function NotificationBell() {
    const { auth } = usePage().props;
    const [isRinging, setIsRinging] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(() => {
        return localStorage.getItem('notificationSound') !== 'disabled';
    });
    const [shouldPop, setShouldPop] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const dropdownRef = useRef(null);
    const notificationSound = useRef(new Audio('/sounds/notification-short.mp3'));
    const notificationsArray = Array.isArray(auth?.user?.notifications) ? auth.user.notifications : [];
    const unreadCount = notificationsArray.filter(n => !n.read_at).length;
    const recentNotifications = notificationsArray.slice(0, 5); // Show only 5 most recent notifications

    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Track new notifications using localStorage
    useEffect(() => {
        try {
            const seenNotifications = new Set(
                JSON.parse(localStorage.getItem('seenNotifications') || '[]')
            );

            const newNotifications = notificationsArray.filter(
                notification => !seenNotifications.has(notification.id)
            );

            if (newNotifications.length > 0) {
                // Play sound only for brand new notifications
                if (soundEnabled) {
                    notificationSound.current.currentTime = 0;
                    notificationSound.current.play()
                        .then(() => {
                            console.log('NotificationBell sound played successfully');
                        })
                        .catch((error) => {
                            console.error('Error playing NotificationBell sound:', error);
                            setSoundEnabled(false);
                        });
                }

                // Add new notifications to seen set
                const updatedSeenNotifications = [
                    ...seenNotifications,
                    ...newNotifications.map(n => n.id)
                ];
                localStorage.setItem('seenNotifications', JSON.stringify(updatedSeenNotifications));

                // Trigger pop animation
                setShouldPop(true);
                setTimeout(() => {
                    setShouldPop(false);
                }, 1000);
            }
        } catch (error) {
            console.error('Error handling notifications:', error);
            setError('Une erreur est survenue lors du traitement des notifications');
        }
    }, [notificationsArray, soundEnabled]);

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

    // Poll for new notifications
    useEffect(() => {
        const pollInterval = setInterval(() => {
            router.reload({ preserveScroll: true, preserveState: true });
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(pollInterval);
    }, []);

    // Handle sound toggle
    const toggleSound = useCallback(() => {
        setSoundEnabled(prev => {
            const newState = !prev;
            localStorage.setItem('notificationSound', newState ? 'enabled' : 'disabled');
            return newState;
        });
    }, []);

    // Format notification date
    const formatDate = useCallback((date) => {
        const parsedDate = new Date(date);
        return formatDistanceToNow(parsedDate, { addSuffix: true, locale: fr });
    }, []);

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

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className={`relative p-2 text-white/80 hover:text-white rounded-full transition-all duration-300 
                    hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 
                    active:scale-95 active:rotate-12 active:shadow-none
                    group ${shouldPop ? 'animate-notification-pop' : ''}`}
                aria-label="Voir les notifications"
            >
                <BellIcon 
                    className={`h-6 w-6 transition-all duration-300 
                        group-hover:text-blue-400
                        ${isRinging ? 'animate-ring' : ''}`} 
                />
                {unreadCount > 0 && (
                    <span 
                        className={`absolute top-1 right-0.5 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-red-500 rounded-full
                            transition-all duration-300
                            group-hover:scale-110 group-hover:bg-red-400
                            group-active:scale-90 ${shouldPop ? 'animate-notification-badge-pop' : ''}`}
                        aria-label={`${unreadCount} notifications non lues`}
                    >
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-80 origin-top-right transition-all duration-200 ${
                    isDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}>
                    <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/10 overflow-hidden">
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Notifications</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleSound}
                                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                    title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
                                >
                                    {soundEnabled ? (
                                        <SpeakerWaveIcon className="w-5 h-5 text-blue-400" />
                                    ) : (
                                        <SpeakerXMarkIcon className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {error && (
                                <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                            
                            {recentNotifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <BellSlashIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-400">Aucune notification</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {recentNotifications.map((notification) => (
                                        <div 
                                            key={notification.id}
                                            className={`p-4 hover:bg-white/5 transition-colors ${
                                                !notification.read_at ? 'bg-blue-500/5' : ''
                                            }`}
                                            onClick={() => handleNotificationClick(notification)}
                                            style={{ cursor: notification.data?.url ? 'pointer' : 'default' }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white/90 truncate">
                                                        {notification.data?.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {formatDate(notification.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10">
                            <Link
                                href={route('notifications.index')}
                                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
                                onClick={() => setIsDropdownOpen(false)}
                            >
                                <span>Voir toutes les notifications</span>
                                <ChevronRightIcon className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <style>
                {`
                    @keyframes ring {
                        0% { transform: rotate(0); }
                        10% { transform: rotate(10deg); }
                        20% { transform: rotate(-8deg); }
                        30% { transform: rotate(6deg); }
                        40% { transform: rotate(-4deg); }
                        50% { transform: rotate(2deg); }
                        60% { transform: rotate(-1deg); }
                        70% { transform: rotate(1deg); }
                        80% { transform: rotate(-0.5deg); }
                        90% { transform: rotate(0.5deg); }
                        100% { transform: rotate(0); }
                    }
                    .animate-ring {
                        animation: ring 1.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite;
                        transform-origin: top center;
                    }
                    @keyframes notification-pop {
                        0% { transform: scale(1) translateY(0); }
                        25% { transform: scale(1.1) translateY(-4px); }
                        50% { transform: scale(1.2) translateY(-6px); }
                        75% { transform: scale(1.1) translateY(-4px); }
                        100% { transform: scale(1) translateY(0); }
                    }
                    .animate-notification-pop {
                        animation: notification-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                    }
                    @keyframes notification-badge-pop {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.4); }
                        100% { transform: scale(1); }
                    }
                    .animate-notification-badge-pop {
                        animation: notification-badge-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                    }
                `}
            </style>
        </div>
    );
}
