<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InterventionObserverNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $task;
    protected $intervention;
    protected $creator;

    public function __construct($task, $intervention, $creator)
    {
        $this->task = $task;
        $this->intervention = $intervention;
        $this->creator = $creator;
    }

    public function via($notifiable)
    {
        if (!$notifiable->email) {
            return ['database'];
        }
        return ['database', 'mail'];
    }

    public function toMail($notifiable)
    {
        $url = route('interventions.show', $this->intervention->id);
        
        return (new MailMessage)
            ->subject('GLPI - Nouvelle intervention sur une tâche observée')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line("Une nouvelle intervention a été ajoutée à une tâche que vous observez.")
            ->line("Tâche: {$this->task->name}")
            ->line("Intervention créée par: {$this->creator->name}")
            ->line("Description de l'intervention: {$this->intervention->description}")
            ->action("Voir l'intervention", $url)
            ->line("Date de l'intervention: " . $this->intervention->action_time->format('d/m/Y H:i'));
    }

    public function toDatabase($notifiable)
    {
        return [
            'message' => "Nouvelle intervention sur la tâche {$this->task->name} par {$this->creator->name}",
            'url' => route('interventions.show', $this->intervention->id),
            'task_id' => $this->task->id,
            'intervention_id' => $this->intervention->id,
            'creator_id' => $this->creator->id,
            'notifiable_id' => $notifiable->id
        ];
    }
} 