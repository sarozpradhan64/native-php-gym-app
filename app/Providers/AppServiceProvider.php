<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        URL::forceHttps();

        \Illuminate\Support\Facades\Blade::component(\Native\Mobile\Edge\Components\Navigation\BottomNav::class, 'native-bottom-nav');
        \Illuminate\Support\Facades\Blade::component(\Native\Mobile\Edge\Components\Navigation\BottomNavItem::class, 'native-bottom-nav-item');
    }
}
