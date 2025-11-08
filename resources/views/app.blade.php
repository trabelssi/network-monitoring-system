<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="GLPI Sancella - Gestion des tickets et interventions">
        <meta http-equiv="Cache-Control" content="public, max-age=31536000">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <title inertia>{{ config('app.name', 'GLPI') }}</title>

        <!-- Preload Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
        <link rel="stylesheet" href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap">

        <!-- Critical CSS -->
        <style>
            /* Progress bar container */
            #nprogress {
                pointer-events: none;
            }

            #nprogress .bar {
                background: #4B5563;
                position: fixed;
                z-index: 1031;
                top: 0;
                left: 0;
                width: 100%;
                height: 2px;
            }

            /* Spinner */
            #nprogress .spinner {
                display: block;
                position: fixed;
                z-index: 1031;
                top: 15px;
                right: 15px;
            }

            #nprogress .spinner-icon {
                width: 18px;
                height: 18px;
                box-sizing: border-box;
                border: solid 2px transparent;
                border-top-color: #4B5563;
                border-left-color: #4B5563;
                border-radius: 50%;
                animation: nprogress-spinner 400ms linear infinite;
            }

            @keyframes nprogress-spinner {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }
        </style>

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
