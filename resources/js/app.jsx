import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

// Import Ziggy to make the routes available globally
import { Ziggy } from './ziggy';

const appName = import.meta.env.VITE_APP_NAME || 'GLPI Sancella';

// Register service worker
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful:', registration.scope);
            })
            .catch(error => {
                console.error('ServiceWorker registration failed:', error);
            });
    });
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        // Get the CSRF token from the meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        // Ensure CSRF token is available to all components
        if (csrfToken) {
            props.initialPage.props.csrf_token = csrfToken;
        }
        
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
        includeCSS: true,
        showSpinner: true,
        delay: 100,
    },
});
