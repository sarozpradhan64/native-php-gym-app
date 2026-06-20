<?php

use Livewire\Volt\Component;
use App\Models\WorkoutSession;

new class extends Component {
    public WorkoutSession $session;

    public function mount(WorkoutSession $session)
    {
        $this->session = $session;
    }

    public function complete()
    {
        $this->session->update(['completed_at' => now(), 'duration' => now()->diffInSeconds($this->session->started_at)]);
        return redirect()->route('home');
    }
}; ?>

<div class="p-4 mb-20 space-y-6">
    <div class="flex justify-between items-center">
        <div>
            <h1 class="text-3xl font-bold font-sans text-on-surface">Active Session</h1>
            <p class="text-sm text-on-surface-variant tracking-wider mt-1">{{ $session->started_at->format('M j, g:i A') }}</p>
        </div>
        <button wire:click="complete" class="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold text-sm">
            Finish
        </button>
    </div>

    <!-- Active Session Content -->
    <div class="bg-surface-container rounded-2xl p-6 border border-outline-variant shadow-lg relative overflow-hidden">
        <p class="text-on-surface-variant mb-6 text-center">Add exercises to start tracking.</p>
        <button class="w-full bg-surface-bright border border-outline-variant hover:bg-surface-container-highest text-on-surface font-semibold py-3 px-6 rounded-xl transition relative z-10 cursor-pointer">
            + Add Exercise
        </button>
    </div>
</div>
