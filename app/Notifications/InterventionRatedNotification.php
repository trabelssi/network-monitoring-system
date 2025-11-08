<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InterventionRatedNotification extends Notification implements ShouldQueue
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
        return ['database', 'mail'];
    }

    public function toMail($notifiable)
    {
        $url = route('interventions.show', $this->intervention->id);
        $status = $this->intervention->status === 'approved' ? 'approuvée' : 'rejetée';
        
        $mailMessage = (new MailMessage)
            ->subject("GLPI - Votre intervention a été {$status}")
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line("Votre intervention a été évaluée par {$this->creator->name}.")
            ->line("Tâche: {$this->task->name}")
            ->line("Statut: " . ucfirst($status))
            ->action("Voir l'intervention", $url);

        if ($this->intervention->status === 'approved' && $this->intervention->rating_comment) {
            $mailMessage->line("Commentaire: {$this->intervention->rating_comment}");
        }

        if ($this->intervention->status === 'rejected' && $this->intervention->rejection_comment) {
            $mailMessage->line("Raison du rejet: {$this->intervention->rejection_comment}");
        }

        return $mailMessage;
    }

    public function toDatabase($notifiable)
    {
        return [
            'message' => "Votre intervention a été évaluée par {$this->creator->name}.",
            'url' => route('interventions.show', $this->intervention->id),
            'task_id' => $this->task->id,
            'intervention_id' => $this->intervention->id,
            'creator_id' => $this->creator->id,
            'notifiable_id' => $notifiable->id
        ];
    }
} 