<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use App\Models\Task;
use App\Models\User;

class TaskObserverNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $taskId;
    protected $taskName;
    protected $taskDescription;
    protected $taskPriority;
    protected $taskDueDate;
    protected $creatorId;
    protected $creatorName;

    public function __construct($task, $creator)
    {
        $this->taskId = $task->id;
        $this->taskName = $task->name;
        $this->taskDescription = $task->description;
        $this->taskPriority = $task->priority;
        $this->taskDueDate = $task->due_date;
        $this->creatorId = $creator->id;
        $this->creatorName = $creator->name;
    }

    public function via($notifiable)
    {
        try {
            if (!$notifiable->email) {
                return ['database'];
            }
            return ['database', 'mail'];
        } catch (\Exception $e) {
            Log::error('TaskObserverNotification via method error:', [
                'error' => $e->getMessage()
            ]);
            return ['database'];
        }
    }

    public function toMail($notifiable)
    {
        try {
            $url = route('task.show', $this->taskId);
            
            return (new MailMessage)
                ->subject('GLPI - Ajout comme observateur à une tâche')
                ->greeting('Bonjour ' . $notifiable->name . ',')
                ->line("Vous avez été ajouté comme observateur à une tâche par {$this->creatorName}.")
                ->line("Nom de la tâche: {$this->taskName}")
                ->line("Description: {$this->taskDescription}")
                ->line("Priorité: {$this->taskPriority}")
                ->action('Voir la tâche', $url)
                ->line("Date limite: " . ($this->taskDueDate ? date('d/m/Y', strtotime($this->taskDueDate)) : 'Non spécifiée'))
                ->line('En tant qu\'observateur, vous recevrez des notifications pour toutes les mises à jour de cette tâche.');
        } catch (\Exception $e) {
            Log::error('TaskObserverNotification toMail error:', [
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    public function toDatabase($notifiable)
    {
        try {
            Log::info('TaskObserverNotification saving to database:', [
                'notifiable_id' => $notifiable->id,
                'task_id' => $this->taskId
            ]);

            return [
                'message' => "Vous avez été ajouté comme observateur à une tâche par {$this->creatorName}.",
                'url' => route('task.show', $this->taskId),
                'task_id' => $this->taskId,
                'creator_id' => $this->creatorId,
                'notifiable_id' => $notifiable->id
            ];
        } catch (\Exception $e) {
            Log::error('TaskObserverNotification toDatabase error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'notifiable_id' => $notifiable->id ?? 'null',
                'task_id' => $this->taskId ?? 'null'
            ]);
            throw $e;
        }
    }
} 