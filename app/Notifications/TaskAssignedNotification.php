<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use App\Models\Task;
use App\Models\User;

class TaskAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $taskId;
    protected $creatorId;
    protected $taskName;
    protected $taskDescription;
    protected $taskPriority;
    protected $taskDueDate;
    protected $creatorName;

    /**
     * Create a new notification instance.
     */
    public function __construct($task, $creator)
    {
        $this->taskId = $task->id;
        $this->creatorId = $creator->id;
        $this->taskName = $task->name;
        $this->taskDescription = $task->description;
        $this->taskPriority = $task->priority;
        $this->taskDueDate = $task->due_date;
        $this->creatorName = $creator->name;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via($notifiable)
    {
        try {
            Log::info('TaskAssignedNotification via method:', [
                'notifiable_id' => $notifiable->id ?? 'null',
                'notifiable_email' => $notifiable->email ?? 'null',
                'task_id' => $this->taskId ?? 'null',
                'creator_id' => $this->creatorId ?? 'null'
            ]);

            if (!$notifiable->email) {
                Log::error('TaskAssignedNotification: Notifiable has no email', [
                    'notifiable_id' => $notifiable->id ?? 'null'
                ]);
                return ['database'];
            }

            return ['database', 'mail'];
        } catch (\Exception $e) {
            Log::error('TaskAssignedNotification via method error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return ['database'];
        }
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable)
    {
        try {
            $url = route('task.show', $this->taskId);
            
            Log::info('TaskAssignedNotification preparing email:', [
                'to_email' => $notifiable->email,
                'task_id' => $this->taskId,
                'task_name' => $this->taskName,
                'creator_name' => $this->creatorName
            ]);
            
            return (new MailMessage)
                ->subject('GLPI - Nouvelle tâche assignée')
                ->greeting('Bonjour ' . $notifiable->name . ',')
                ->line("Une nouvelle tâche vous a été assignée par {$this->creatorName}.")
                ->line("Nom de la tâche: {$this->taskName}")
                ->line("Description: {$this->taskDescription}")
                ->line("Priorité: {$this->taskPriority}")
                ->action('Voir la tâche', $url)
                ->line("Date limite: " . ($this->taskDueDate ? date('d/m/Y', strtotime($this->taskDueDate)) : 'Non spécifiée'))
                ->line('Merci d\'utiliser notre application!');
        } catch (\Exception $e) {
            Log::error('TaskAssignedNotification toMail error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'notifiable_id' => $notifiable->id ?? 'null',
                'task_id' => $this->taskId ?? 'null'
            ]);
            throw $e;
        }
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase($notifiable)
    {
        try {
            Log::info('TaskAssignedNotification saving to database:', [
                'notifiable_id' => $notifiable->id,
                'task_id' => $this->taskId
            ]);

            return [
                'message' => "Une nouvelle tâche vous a été assignée par {$this->creatorName}.",
                'url' => route('task.show', $this->taskId),
                'task_id' => $this->taskId,
                'creator_id' => $this->creatorId,
                'notifiable_id' => $notifiable->id
            ];
        } catch (\Exception $e) {
            Log::error('TaskAssignedNotification toDatabase error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'notifiable_id' => $notifiable->id ?? 'null',
                'task_id' => $this->taskId ?? 'null'
            ]);
            throw $e;
        }
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray($notifiable)
    {
        return [
            'message' => "Une nouvelle tâche vous a été assignée par {$this->creatorName}.",
            'url' => route('task.show', $this->taskId),
            'task_id' => $this->taskId,
            'creator_id' => $this->creatorId
        ];
    }
}
