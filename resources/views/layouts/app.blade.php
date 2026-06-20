<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ $title ?? config('app.name', 'Mimi') }}</title>

        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="min-h-screen bg-gray-100 dark:bg-gray-900">
        {{-- Main Content --}}
        <main class="nativephp-safe-area">
            {{ $slot }}
        </main>

        {{-- Native Bottom Navigation --}}
        <x-native-bottom-nav>
            <x-native-bottom-nav-item
                id="home"
                icon="house.fill"
                label="Home"
                url="/"
                :active="request()->is('/')"
            />
            <x-native-bottom-nav-item
                id="plans"
                icon="list.bullet.clipboard.fill"
                label="Plans"
                url="/plans"
                :active="request()->is('plans*')"
            />
            <x-native-bottom-nav-item
                id="progress"
                icon="chart.xyaxis.line"
                label="Progress"
                url="/progress"
                :active="request()->is('progress*')"
            />
            <x-native-bottom-nav-item
                id="settings"
                icon="gearshape.fill"
                label="Settings"
                url="/settings"
                :active="request()->is('settings*')"
            />
        </x-native-bottom-nav>
    </body>
</html>
