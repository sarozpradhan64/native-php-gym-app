<?php

use Livewire\Volt\Component;
use App\Models\WorkoutSession;

new class extends Component {
    public $streak = 0;
    public $recentSessions = [];

    public function mount()
    {
        $this->recentSessions = WorkoutSession::with('workoutPlan')
            ->orderBy('started_at', 'desc')
            ->take(3)
            ->get();
        // Placeholder for streak calculation
        $this->streak = 5; 
    }
    public function quickStart()
    {
        // Create an empty workout session
        $session = WorkoutSession::create([
            'started_at' => now(),
        ]);

        return redirect()->route('session.show', $session->id);
    }
}; ?>

<div class="p-4 mb-20 space-y-6">
    <div class="flex justify-between items-center">
        <div>
            <h1 class="text-3xl font-bold font-sans text-on-surface">Dashboard</h1>
            <p class="text-sm text-on-surface-variant tracking-wider uppercase mt-1">Today's Overview</p>
        </div>
        <div class="bg-surface-container-high rounded-full w-12 h-12 flex items-center justify-center border border-outline-variant">
            <span class="text-primary font-bold text-lg">{{ $streak }}🔥</span>
        </div>
    </div>

    <!-- Quick Start Card -->
    <div class="bg-surface-container rounded-2xl p-6 border border-outline-variant shadow-lg relative overflow-hidden">
        <div class="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
        <h2 class="text-xl font-bold text-on-surface mb-2 relative z-10">Ready to train?</h2>
        <p class="text-on-surface-variant mb-6 relative z-10">Start an empty workout or choose a plan.</p>
        <button wire:click="quickStart" class="w-full bg-secondary hover:bg-secondary-container text-on-secondary font-semibold py-3 px-6 rounded-xl transition relative z-10 cursor-pointer">
            Quick Start
        </button>
    </div>

    <!-- Recent History -->
    <div>
        <h2 class="text-xl font-bold text-on-surface mb-4">Recent Workouts</h2>
        <div class="space-y-3">
            @forelse($recentSessions as $session)
                <div class="bg-surface-container-low border-l-4 border-primary rounded-r-xl rounded-l-sm p-4 flex justify-between items-center">
                    <div>
                        <h3 class="font-bold text-on-surface">{{ $session->workoutPlan?->name ?? 'Freestyle Workout' }}</h3>
                        <p class="text-sm text-on-surface-variant">{{ $session->started_at->diffForHumans() }}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-sm font-medium text-primary">{{ floor($session->duration / 60) }} min</span>
                    </div>
                </div>
            @empty
                <div class="text-center py-8 bg-surface-container-lowest rounded-xl border border-outline-variant border-dashed">
                    <p class="text-on-surface-variant">No recent workouts.</p>
                </div>
            @endforelse
        </div>
    </div>
</div>
