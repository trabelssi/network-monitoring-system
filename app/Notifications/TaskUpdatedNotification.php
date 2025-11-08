<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use App\Models\Task;
use App\Models\User;

class TaskUpdatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $task;
    protected $updater;
    protected $changes;

    /**
     * Create a new notification instance.
     */
    public function __construct($task, $updater, $changes)
    {
        $this->task = $task;
        $this->updater = $updater;
        $this->changes = $changes;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable)
    {
        try {
            Log::info('TaskUpdatedNotification via method:', [
                'notifiable_id' => $notifiable->id ?? 'null',
                'notifiable_email' => $notifiable->email ?? 'null',
                'task_id' => $this->task->id ?? 'null',
                'updater_id' => $this->updater->id ?? 'null'
            ]);

            if (!$notifiable->email) {
                Log::error('TaskUpdatedNotification: Notifiable has no email', [
                    'notifiable_id' => $notifiable->id ?? 'null'
                ]);
                return ['database'];
            }

            return ['database', 'mail'];
        } catch (\Exception $e) {
            Log::error('TaskUpdatedNotification via method error:', [
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
            $url = route('task.show', $this->task->id);
            
            Log::info('TaskUpdatedNotification preparing email:', [
                'to_email' => $notifiable->email,
                'task_id' => $this->task->id,
                'task_name' => $this->task->name,
                'updater_name' => $this->updater->name
            ]);
            
            $message = (new MailMessage)
                ->subject('GLPI - Mise à jour de la tâche')
                ->greeting('Bonjour ' . $notifiable->name . ',')
                ->line("La tâche \"{$this->task->name}\" a été mise à jour par {$this->updater->name}.");

            // Add lines for each changed field
            foreach ($this->changes as $field => $value) {
                $message->line("$field: $value");
            }

            return $message
                ->action('Voir la tâche', $url)
                ->line('Merci d\'utiliser notre application!');
        } catch (\Exception $e) {
            Log::error('TaskUpdatedNotification toMail error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'notifiable_id' => $notifiable->id ?? 'null',
                'task_id' => $this->task->id ?? 'null'
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
            Log::info('TaskUpdatedNotification saving to database:', [
                'notifiable_id' => $notifiable->id,
                'task_id' => $this->task->id
            ]);

            return [
                'message' => "La tâche \"{$this->task->name}\" a été mise à jour par {$this->updater->name}.",
                'url' => route('task.show', $this->task->id),
                'task_id' => $this->task->id,
                'updater_id' => $this->updater->id,
                'notifiable_id' => $notifiable->id,
                'changes' => $this->changes
            ];
        } catch (\Exception $e) {
            Log::error('TaskUpdatedNotification toDatabase error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'notifiable_id' => $notifiable->id ?? 'null',
                'task_id' => $this->task->id ?? 'null'
            ]);
            throw $e;
        }
    }
} 