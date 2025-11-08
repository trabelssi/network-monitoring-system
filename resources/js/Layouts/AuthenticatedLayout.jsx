import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import backgroundImage from './4411.jpg';
import NotificationBell from '@/Components/NotificationBell';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function AuthenticatedLayout({ header, children }) {
    const { auth } = usePage().props;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div style={{ minHeight: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
            {/* Animated background elements */}
            <div className="particles"></div>
            <div className="floating-shapes">
                <div className="shape shape1"></div>
                <div className="shape shape2"></div>
                <div className="shape shape3"></div>
            </div>
            {/* Background Image with Overlay */}
            <div 
                className="fixed inset-0 z-0"
                style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/4411.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed',
                }}
            />

            {/* Navigation */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
                scrolled ? 'bg-black/80 backdrop-blur-lg' : 'bg-transparent'
            }`}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-20 justify-between items-center">
                        <div className="flex items-center">
                            <div className="flex shrink-0 items-center">
                                <Link href="/" className="group transform transition-transform duration-300 hover:scale-110">
                                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '4px', boxShadow: '0 2px 8px rgba(33,150,243,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'box-shadow 0.3s' }} className="hover:shadow-lg">
                                        <ApplicationLogo className="block" style={{ height: 32, width: 'auto', transition: 'filter 0.3s', filter: 'drop-shadow(0 2px 6px #2196f366)' }} />
                                    </div>
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:ml-12 sm:flex">
                                {auth.user.role === 'admin' ? (
                                    // Admin navigation items
                                    [
                                        { route: 'dashboard', label: 'Tableau de Bord' },
                                        { route: 'projects.index', label: 'Machines' },
                                        { 
                                            type: 'dropdown', 
                                            label: 'Réseau', 
                                            items: [
                                                { route: 'network.dashboard', label: 'Tableau de Bord Réseau' },
                                                { route: 'devices.index', label: 'Équipements Réseau' },
                                                { route: 'device.history.index', label: 'Historique des Équipements' },
                                                { route: 'discovery.index', label: 'Découverte des Équipements' },
                                                { route: 'departments.index', label: 'Départements' },
                                                { route: 'unite-materiels.index', label: 'Unités Matériel' },
                                            ]
                                        },
                                        { route: 'tasks.index', label: 'Ticket' },
                                        { route: 'users.index', label: 'Utilisateurs' },
                                        { route: 'task.observedTasks', label: 'Ticket Observées' },
                                        { route: 'interventions.index', label: 'Interventions' },
                                        { route: 'historique.index', label: "Journal d'Activités" },
                                    ].map((item, index) => (
                                        item.type === 'dropdown' ? (
                                            <Dropdown key={index}>
                                                <Dropdown.Trigger>
                                                    <button className="network-dropdown-trigger text-sm font-medium text-white/80 hover:text-white transition-all duration-300 hover:scale-105 flex items-center gap-2 px-4 py-2 rounded-lg border border-transparent">
                                                        <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-semibold">
                                                            {item.label}
                                                        </span>
                                                        <ChevronDownIcon className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
                                                    </button>
                                                </Dropdown.Trigger>
                                                <Dropdown.Content className="network-dropdown-content rounded-xl min-w-[300px] mt-2">
                                                    <div className="py-3 px-2">
                                                        <div className="network-dropdown-header text-xs font-bold text-cyan-300 px-4 py-3 mb-2">
                                                            GESTION RÉSEAU
                                                        </div>
                                                        {item.items.map((subItem, subIndex) => (
                                                            <Dropdown.Link
                                                                key={subIndex}
                                                                href={route(subItem.route)}
                                                                className="network-dropdown-item block px-4 py-3 text-sm font-medium text-cyan-100 hover:text-white transition-all duration-300 mx-2 my-1 rounded-lg group"
                                                            >
                                                                <span className="flex items-center justify-between">
                                                                    <span>{subItem.label}</span>
                                                                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0"></span>
                                                                </span>
                                                            </Dropdown.Link>
                                                        ))}
                                                    </div>
                                                </Dropdown.Content>
                                            </Dropdown>
                                        ) : (
                                            <NavLink
                                                key={index}
                                                href={route(item.route)}
                                                active={route().current(item.route)}
                                                className="text-sm font-medium text-white/80 hover:text-white transition-all duration-300 hover:scale-105"
                                            >
                                                {item.label}
                                            </NavLink>
                                        )
                                    ))
                                ) : (
                                    // Regular user navigation items
                                    [
                                        { route: 'dashboard', label: 'Tableau de Bord' },
                                        { route: 'task.myTasks', label: 'Mes Ticket' },
                                        { route: 'task.observedTasks', label: 'Ticket Observées' },
                                        { route: 'notifications.index', label: 'Notifications' },
                                        { route: 'historique.index', label: 'Historique' },
                                    ].map((item, index) => (
                                        item.type === 'dropdown' ? (
                                            <Dropdown key={index}>
                                                <Dropdown.Trigger>
                                                    <button className="text-sm font-medium text-white/80 hover:text-white transition-all duration-300 hover:scale-105 flex items-center gap-1">
                                                        {item.label}
                                                        <ChevronDownIcon className="h-4 w-4" />
                                                    </button>
                                                </Dropdown.Trigger>
                                                <Dropdown.Content>
                                                    {item.items.map((subItem, subIndex) => (
                                                        <Dropdown.Link
                                                            key={subIndex}
                                                            href={route(subItem.route)}
                                                            className="block px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
                                                        >
                                                            {subItem.label}
                                                        </Dropdown.Link>
                                                    ))}
                                                </Dropdown.Content>
                                            </Dropdown>
                                        ) : (
                                            <NavLink
                                                key={index}
                                                href={route(item.route)}
                                                active={route().current(item.route)}
                                                className="text-sm font-medium text-white/80 hover:text-white transition-all duration-300 hover:scale-105"
                                            >
                                                {item.label}
                                            </NavLink>
                                        )
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="hidden sm:flex sm:items-center sm:space-x-4">
                            <div className="relative">
                                <NotificationBell />
                            </div>
                            
                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex">
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-all duration-300 hover:scale-105"
                                            >
                                                {auth.user.name}
                                                <svg
                                                    className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-180"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                            className="block px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
                                        >
                                            <span className="ml-2">Profil</span>
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="block w-full px-4 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
                                            preserveScroll={true}
                                        >
                                            <span className="ml-2">Déconnexion</span>
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
                                className="inline-flex items-center justify-center p-2 text-white/80 hover:text-white transition-all duration-300"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className={`sm:hidden transition-all duration-300 ${showingNavigationDropdown ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-1 px-4 pb-3 pt-2">
                        {auth.user.role === 'admin' ? (
                            // Admin mobile navigation items
                            [
                                { route: 'dashboard', label: 'Tableau de Bord' },
                                { route: 'projects.index', label: 'Machines' },
                                { route: 'network.dashboard', label: 'Réseau - Tableau de Bord' },
                                { route: 'devices.index', label: 'Réseau - Équipements' },
                                { route: 'device.history.index', label: 'Réseau - Historique des Équipements' },
                                { route: 'discovery.index', label: 'Réseau - Découverte des Équipements' },
                                { route: 'departments.index', label: 'Réseau - Départements' },
                                { route: 'unite-materiels.index', label: 'Réseau - Unités Matériel' },
                                { route: 'tasks.index', label: 'Ticket' },
                                { route: 'users.index', label: 'Utilisateurs' },
                                { route: 'task.observedTasks', label: 'Ticket Observées' },
                                { route: 'interventions.index', label: 'Interventions' },
                                { route: 'historique.index', label: "Journal d'Activités" },
                            ].map((item) => (
                                <ResponsiveNavLink
                                    key={item.route}
                                    href={route(item.route)}
                                    active={route().current(item.route)}
                                    className="block px-4 py-2 text-base font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
                                >
                                    <span className="ml-2">{item.label}</span>
                                </ResponsiveNavLink>
                            ))
                        ) : (
                            // Regular user mobile navigation items
                            [
                                { route: 'dashboard', label: 'Tableau de Bord' },
                                { route: 'task.myTasks', label: 'Mes Ticket' },
                                { route: 'task.observedTasks', label: 'Ticket Observées' },
                                { route: 'notifications.index', label: 'Notifications' },
                                { route: 'historique.index', label: 'Historique' },
                            ].map((item) => (
                                <ResponsiveNavLink
                                    key={item.route}
                                    href={route(item.route)}
                                    active={route().current(item.route)}
                                    className="block px-4 py-2 text-base font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
                                >
                                    <span className="ml-2">{item.label}</span>
                                </ResponsiveNavLink>
                            ))
                        )}
                    </div>

                    <div className="border-t border-white/10 px-4 pb-1 pt-4">
                        <div>
                            <div className="text-base font-medium text-white">
                                {auth.user.name}
                            </div>
                            <div className="text-sm font-medium text-white/50">
                                {auth.user.email}
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink
                                href={route('profile.edit')}
                                className="block px-4 py-2 text-base font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
                            >
                                <span className="ml-2">Profil</span>
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                                preserveScroll={true}
                                className="block w-full px-4 py-2 text-left text-base font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
                            >
                                <span className="ml-2">Déconnexion</span>
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Header */}
            {header && (
                <header className="relative z-10">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 mt-20">
                        <div className="bg-black/40 backdrop-blur-lg rounded-lg p-6 transform transition-all duration-300 hover:scale-[1.01]">
                            <h1 style={{
                                fontSize: 32,
                                fontWeight: 800,
                                marginBottom: 24,
                                background: 'linear-gradient(45deg, #2196F3, #64B5F6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                animation: 'gradientShift 3s ease infinite',
                                position: 'relative',
                            }}>{typeof header === 'string' ? header : ''}</h1>
                            {typeof header !== 'string' && header}
                        </div>
                    </div>
                </header>
            )}

            {/* Main Content */}
            <main className="relative z-10 flex flex-col items-center justify-center w-full min-h-[calc(100vh-5rem)] p-0 m-0">
                <div
                    className="container"
                    style={{
                        width: 'calc(100vw - 64px)', // 32px space on each side
                        minHeight: 'calc(100vh - 5rem - 64px)', // 32px space top and bottom
                        padding: '32px',
                        margin: '32px',
                        background: 'rgba(13, 71, 161, 0.2)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(10px)',
                        border: 'none',
                        animation: 'fadeInBlur 1.5s ease-in-out',
                        color: 'white',
                        position: 'relative',
                        zIndex: 1,
                        borderRadius: '28px',
                        maxWidth: 'calc(100vw - 64px)',
                    }}
                >
                    <div className="content-wrapper" style={{ position: 'relative' }}>
                        <div className="title-decoration" style={{ display: 'none' }}></div>
                        {children}
                    </div>
                </div>
            </main>

            <style>{`
                @keyframes fadeInBlur {
                    0% { opacity: 0; transform: translateY(20px); filter: blur(8px); }
                    100% { opacity: 1; transform: translateY(0); filter: blur(0); }
                }
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .particles {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle at center, transparent 0%, rgba(33,150,243,0.1) 100%);
                    animation: particleFloat 20s ease-in-out infinite;
                }
                .floating-shapes {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }
                .shape {
                    position: absolute;
                    background: rgba(33,150,243,0.1);
                    border-radius: 50%;
                    animation: float 15s infinite;
                }
                .shape1 {
                    width: 300px;
                    height: 300px;
                    top: -150px;
                    right: -150px;
                    animation-delay: 0s;
                }
                .shape2 {
                    width: 200px;
                    height: 200px;
                    bottom: -100px;
                    left: -100px;
                    animation-delay: -5s;
                }
                .shape3 {
                    width: 150px;
                    height: 150px;
                    top: 50%;
                    right: 10%;
                    animation-delay: -10s;
                }
                @keyframes float {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    50% { transform: translate(20px, 20px) rotate(180deg); }
                    100% { transform: translate(0, 0) rotate(360deg); }
                }
                @keyframes particleFloat {
                    0% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-20px) scale(1.1); }
                    100% { transform: translateY(0) scale(1); }
                }
                .title-decoration {
                    position: absolute;
                    top: -20px;
                    left: -20px;
                    width: 100px;
                    height: 100px;
                    border-top: 3px solid #2196F3;
                    border-left: 3px solid #2196F3;
                    opacity: 0.5;
                }
                .container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(45deg, rgba(33,150,243,0.1), transparent);
                    border-radius: 20px;
                    z-index: -1;
                }
                
                /* Enhanced Network Dropdown Styles */
                .network-dropdown-trigger:hover {
                    background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1));
                    box-shadow: 0 4px 20px rgba(6, 182, 212, 0.2);
                    border: 1px solid rgba(6, 182, 212, 0.3);
                }
                
                .network-dropdown-content {
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95));
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(6, 182, 212, 0.2);
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(6, 182, 212, 0.1);
                }
                
                .network-dropdown-item:hover {
                    background: linear-gradient(90deg, rgba(6, 182, 212, 0.15), rgba(59, 130, 246, 0.15));
                    transform: translateX(4px);
                    box-shadow: inset 3px 0 0 #06b6d4;
                }
                
                .network-dropdown-header {
                    background: linear-gradient(90deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1));
                    border-bottom: 1px solid rgba(6, 182, 212, 0.2);
                    letter-spacing: 0.05em;
                }
            `}</style>
        </div>
    );
}
