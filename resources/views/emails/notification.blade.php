<!DOCTYPE html>
<html>
<head>
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .content {
            background: #ffffff;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 0 0 8px 8px;
        }
        .message {
            margin: 20px 0;
            padding: 15px;
            background: #f9fafb;
            border-radius: 6px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #4F46E5;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
        }
        .button:hover {
            background: #4338CA;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            color: #6B7280;
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
    </div>
    
    <div class="content">
        <div class="message">
            {!! nl2br(e($message)) !!}
        </div>

        @if($actionUrl && $actionText)
        <div style="text-align: center;">
            <a href="{{ $actionUrl }}" class="button">{{ $actionText }}</a>
        </div>
        @endif

        <div class="footer">
            <p>This is an automated message from GLPI. Please do not reply to this email.</p>
            <p>Time sent: {{ now() }}</p>
        </div>
    </div>
</body>
</html> 