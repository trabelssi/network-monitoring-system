import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: [
                'resources/views/**',
                'routes/**',
                'app/Http/Controllers/**',
            ],
        }),
        react(),
    ],
    server: {
        host: '127.0.0.1',
        port: 5174,
        hmr: {
            host: '127.0.0.1',
            port: 5174,
            overlay: false,
        },
        watch: {
            usePolling: false,
            interval: 1000,
        },
    },
    resolve: {
        alias: {
            '@': '/resources/js',
        },
        dedupe: ['react', 'react-dom']
    },
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', '@inertiajs/react'],
                    utils: ['axios', 'lodash'],
                },
            },
        },
    },
    optimizeDeps: {
        include: ['@inertiajs/react', 'react', 'react-dom'],
    },
});
