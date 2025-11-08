<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InterventionRatingObserverNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $task;
    protected $intervention;
    protected $rater;

    public function __construct($task, $intervention, $rater)
    {
        $this->task = $task;
        $this->intervention = $intervention;
        $this->rater = $rater;
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
        $status = $this->intervention->status === 'approved' ? 'approuvée' : 'rejetée';
        
        $mailMessage = (new MailMessage)
            ->subject("GLPI - Intervention {$status} sur une tâche observée")
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line("Une intervention sur une tâche que vous observez a été évaluée.")
            ->line("Tâche: {$this->task->name}")
            ->line("Intervention évaluée par: {$this->rater->name}")
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
        $status = $this->intervention->status === 'approved' ? 'approuvée' : 'rejetée';
        return [
            'message' => "Une intervention sur la tâche {$this->task->name} a été {$status} par {$this->rater->name}",
            'url' => route('interventions.show', $this->intervention->id),
            'task_id' => $this->task->id,
            'intervention_id' => $this->intervention->id,
            'rater_id' => $this->rater->id,
            'notifiable_id' => $notifiable->id,
            'status' => $this->intervention->status
        ];
    }
} 