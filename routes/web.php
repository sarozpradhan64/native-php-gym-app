<?php

use Illuminate\Support\Facades\Route;
use Livewire\Volt\Volt;

Volt::route('/', 'dashboard')->name('home');
Volt::route('/plans', 'plans.index')->name('plans');
Volt::route('/progress', 'progress.index')->name('progress');
Volt::route('/settings', 'settings.index')->name('settings');
Volt::route('/session/{session}', 'session.show')->name('session.show');
