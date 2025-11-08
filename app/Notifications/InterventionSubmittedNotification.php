<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InterventionSubmittedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $task;
    protected $intervention;
    protected $assignedUser;

    public function __construct($task, $intervention, $assignedUser)
    {
        $this->task = $task;
        $this->intervention = $intervention;
        $this->assignedUser = $assignedUser;
    }

    public function via($notifiable)
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable)
    {
        $url = route('interventions.show', $this->intervention->id);
        
        return (new MailMessage)
            ->subject('GLPI - Nouvelle intervention sur votre tâche')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line("{$this->assignedUser->name} a ajouté une intervention à votre tâche.")
            ->line("Tâche: {$this->task->name}")
            ->line("Description de l'intervention: {$this->intervention->description}")
            ->action("Voir l'intervention", $url)
            ->line("Date de l'intervention: " . $this->intervention->action_time->format('d/m/Y H:i'))
            ->line("Veuillez examiner cette intervention dès que possible.");
    }

    public function toDatabase($notifiable)
    {
        return [
            'message' => "{$this->assignedUser->name} a ajouté une intervention à votre tâche.",
            'url' => route('interventions.show', $this->intervention->id),
            'task_id' => $this->task->id,
            'intervention_id' => $this->intervention->id,
            'assigned_user_id' => $this->assignedUser->id,
            'notifiable_id' => $notifiable->id
        ];
    }
} 