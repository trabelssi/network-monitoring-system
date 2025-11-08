<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Illuminate\Notifications\DatabaseNotification;
use App\Mail\NotificationEmail;

class NotificationController extends Controller
{
    public function index()
    {
        try {
            $user = Auth::user();
            
            // Get all notifications with proper ordering
            $notifications = $user->notifications()
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($notification) {
                    return [
                        'id' => $notification->id,
                        'type' => $notification->type,
                        'data' => $notification->data,
                        'read_at' => $notification->read_at,
                        'created_at' => $notification->created_at,
                    ];
                });

            Log::info('Notifications retrieved:', [
                'user_id' => $user->id,
                'count' => $notifications->count()
            ]);

            return Inertia::render('Notification', [
                'notifications' => $notifications
            ]);
        } catch (\Exception $e) {
            Log::error('Error in notifications index:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return Inertia::render('Notification', [
                'notifications' => [],
                'errors' => ['error' => 'Échec du chargement des notifications']
            ]);
        }
    }

    /**
     * Send both database and email notification
     */
    public function sendNotification($user, $title, $message, $actionUrl = '', $actionText = '')
    {
        try {
            // Send email notification
            Mail::to($user->email)->send(new NotificationEmail(
                $user->email,
                $title,
                $message,
                $actionUrl,
                $actionText
            ));

            // Create database notification
            $user->notify(new \App\Notifications\GeneralNotification([
                'title' => $title,
                'message' => $message,
                'action_url' => $actionUrl,
                'action_text' => $actionText
            ]));

            Log::info('Notification sent successfully:', [
                'user_id' => $user->id,
                'title' => $title
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Error sending notification:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->id
            ]);
            return false;
        }
    }

    public function markAsRead(Request $request)
    {
        try {
            $user = Auth::user();
            $notificationId = $request->input('notification_id');
            $redirectUrl = $request->input('redirect_url');

            if ($notificationId) {
                // Mark specific notification as read
                $notification = $user->notifications()
                    ->where('id', $notificationId)
                    ->first();

                if ($notification) {
                    $notification->markAsRead();
                    Log::info('Notification marked as read:', [
                        'notification_id' => $notificationId,
                        'user_id' => $user->id
                    ]);

                    if ($redirectUrl) {
                        return redirect()->to($redirectUrl);
                    }

                    // Get updated notifications for the response
                    $notifications = $user->notifications()
                        ->orderBy('created_at', 'desc')
                        ->get()
                        ->map(function ($notification) {
                            return [
                                'id' => $notification->id,
                                'type' => $notification->type,
                                'data' => $notification->data,
                                'read_at' => $notification->read_at,
                                'created_at' => $notification->created_at,
                            ];
                        });

                    return Inertia::render('Notification', [
                        'notifications' => $notifications,
                        'message' => 'Notification marquée comme lue avec succès'
                    ]);
                }
            }

            return Inertia::render('Notification', [
                'notifications' => [],
                'error' => 'Notification non trouvée'
            ]);

        } catch (\Exception $e) {
            Log::error('Error marking notification as read:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return Inertia::render('Notification', [
                'notifications' => [],
                'error' => 'Échec du marquage de la notification comme lue : ' . $e->getMessage()
            ]);
        }
    }

    public function markAllAsRead()
    {
        try {
            $user = Auth::user();
            $user->unreadNotifications->markAsRead();

            Log::info('All notifications marked as read:', [
                'user_id' => $user->id
            ]);

            // Get updated notifications for the response
            $notifications = $user->notifications()
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($notification) {
                    return [
                        'id' => $notification->id,
                        'type' => $notification->type,
                        'data' => $notification->data,
                        'read_at' => $notification->read_at,
                        'created_at' => $notification->created_at,
                    ];
                });

            return Inertia::render('Notification', [
                'notifications' => $notifications,
                'message' => 'Toutes les notifications ont été marquées comme lues'
            ]);
        } catch (\Exception $e) {
            Log::error('Error marking all notifications as read:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return Inertia::render('Notification', [
                'notifications' => [],
                'error' => 'Échec du marquage des notifications : ' . $e->getMessage()
            ]);
        }
    }

    public function clearAll()
    {
        try {
            $user = Auth::user();
            
            // Delete all notifications for the user
            $user->notifications()->delete();

            Log::info('All notifications cleared:', [
                'user_id' => $user->id
            ]);

            return redirect()->route('notifications.index')
                ->with('message', 'Toutes les notifications ont été supprimées avec succès');

        } catch (\Exception $e) {
            Log::error('Error clearing all notifications:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->with('error', 'Échec de la suppression des notifications : ' . $e->getMessage());
        }
    }
} 