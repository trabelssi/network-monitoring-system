# Network Monitoring System

A comprehensive enterprise-grade network monitoring and IT service management system built with Laravel and React. This platform provides real-time network device discovery, monitoring, and complete IT ticket management capabilities.

> **Internship Project** - Developed during an internship at **Sancella Tunisia**

![Main Dashboard](app%20images/main-dashboard.png)

## 🏢 About the Project

This project was developed as part of an internship program at **Sancella Tunisia** (SO.TU.PA), a leading company in the hygiene and personal care products industry in Tunisia. The system was designed to streamline IT operations, improve network infrastructure monitoring, and enhance the overall IT service management processes within the organization.

### Company Information
- **Company**: Sancella Tunisia (SO.TU.PA)
- **Industry**: Manufacturing - Hygiene & Personal Care Products
- **Location**: 52, Rue 8601, ZI Charguia 1, Tunis, Tunisia
- **Website**: [www.sancella.com.tn](https://www.sancella.com.tn)
- **Products**: Libero, Peaudouce, Nana, Lotus, Tena, Tork

## 🌟 Features

### 📡 Network Monitoring & Discovery
- **Automated Device Discovery**: SNMP-based network device discovery with automatic registration
- **Real-time Status Monitoring**: Live monitoring of network device status and availability
- **Device Management**: Comprehensive device information including IP, MAC, vendor, and product details
- **Network Visualization**: Interactive 3D network topology visualization
- **Status History**: Complete historical tracking of device status changes

### 🎫 IT Service Management
- **Task Management**: Create, assign, and track IT tasks with priority levels
- **Intervention System**: Full intervention lifecycle management with approval workflows
- **Project Tracking**: Organize tasks and interventions within projects
- **Observer System**: Add observers to tasks and interventions for team collaboration
- **Rating System**: Rate completed interventions for quality tracking

### 👥 User & Department Management
- **Multi-level Authentication**: Role-based access control (Admin, User)
- **Department Organization**: Organize users and resources by departments
- **User Activity Tracking**: Comprehensive activity logs for all user actions
- **User Statistics**: Real-time statistics on active/inactive users

### 🔔 Notification System
- **Real-time Notifications**: Instant in-app notifications for all activities
- **Email Notifications**: Automated email alerts for task assignments and updates
- **Observer Notifications**: Keep observers informed of all changes
- **Custom Notification Channels**: Extensible notification system

### 📊 Advanced Dashboard
- **Executive Dashboard**: High-level overview with key metrics and charts
- **Network Dashboard**: Dedicated network monitoring dashboard
- **Interactive Charts**: Beautiful data visualizations using Chart.js
- **Real-time Updates**: Live data updates without page refresh

## 📸 Screenshots

### Welcome & Authentication
![Authentication](app%20images/login-singup-passwordforget.png)
*Secure login, registration, and password recovery*

### Main Dashboard
![Main Dashboard](app%20images/main-dashboard.png)
*Comprehensive overview with statistics and recent activities*

### Network Monitoring Dashboard
![Network Dashboard](app%20images/network-dashboard.png)
*Real-time network monitoring with device status overview*

### Device Discovery
![Device Discovery](app%20images/device-discovery.png)
*SNMP-based automatic device discovery interface*

### Device Details
![Device Details](app%20images/device-show.png)
*Detailed device information and status history*

### Machine Management
![Machine Management](app%20images/machine-show.png)
*Complete hardware and equipment management*

### Task Management
![Task Details](app%20images/ticket-show.png)
*Comprehensive task tracking with assignments and priorities*

### Intervention Management
![Intervention Details](app%20images/intervention-show.png)
*Full intervention workflow with approval system*

### Department Management
![Departments](app%20images/departments-index.png)
*Department organization and user assignment*

### Real-time Notifications
![Notifications](app%20images/notifications.png)
*Instant notifications for all system activities*

### Welcome Page
![Welcome](app%20images/Welcome.png)
*Professional landing page*

## 🛠️ Technology Stack

### Backend
- **Framework**: Laravel 11.x
- **Language**: PHP 8.2+
- **Database**: MySQL/PostgreSQL
- **Queue System**: Laravel Queue with Redis/Database driver
- **Authentication**: Laravel Sanctum
- **API**: RESTful API with Inertia.js integration

### Frontend
- **Framework**: React 18.x
- **UI Library**: Inertia.js for SPA experience
- **Styling**: Tailwind CSS 3.x
- **Icons**: Heroicons & Lucide React
- **Charts**: Chart.js with date-fns adapter
- **3D Visualization**: Three.js with React Three Fiber
- **Animations**: Framer Motion
- **Build Tool**: Vite

### Additional Technologies
- **SNMP**: PHP SNMP extension for network device discovery
- **Real-time**: Laravel Echo for live updates
- **Email**: Laravel Mail with queued jobs
- **Notifications**: Multi-channel notification system

## 📋 Prerequisites

- PHP 8.2 or higher
- Composer
- Node.js 18.x or higher
- npm or yarn
- MySQL 8.0+ or PostgreSQL 13+
- Redis (optional, for queue and cache)
- PHP SNMP extension

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/trabelssi/network-monitoring-system.git
cd network-monitoring-system
```

### 2. Install PHP Dependencies
```bash
composer install
```

### 3. Install Node Dependencies
```bash
npm install
```

### 4. Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### 5. Configure Database
Edit `.env` file with your database credentials:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=network_monitoring
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### 6. Configure SNMP (Optional)
Edit `.env` file with SNMP settings:
```env
SNMP_ENABLED=true
SNMP_VERSION=2
SNMP_COMMUNITY=public
SNMP_TIMEOUT=3000000
SNMP_RETRIES=3
```

### 7. Configure Mail
Edit `.env` file with mail settings:
```env
MAIL_MAILER=smtp
MAIL_HOST=your_smtp_host
MAIL_PORT=587
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"
```

### 8. Run Database Migrations
```bash
php artisan migrate
```

### 9. Seed Database (Optional)
```bash
php artisan db:seed
```

### 10. Create Storage Link
```bash
php artisan storage:link
```

### 11. Build Frontend Assets
```bash
# For development
npm run dev

# For production
npm run build
```

### 12. Start the Application
```bash
# Development server
php artisan serve

# Queue worker (in separate terminal)
php artisan queue:work

# Schedule (for monitoring tasks)
php artisan schedule:work
```

Visit `http://localhost:8000` in your browser.

## 📖 Usage

### Default Admin Credentials
After seeding the database, you can login with:
- **Email**: admin@example.com
- **Password**: password

⚠️ **Important**: Change these credentials immediately after first login!

### Network Discovery
1. Navigate to **Network > Device Discovery**
2. Enter the IP range to scan (e.g., 192.168.1.0/24)
3. Click **Start Discovery**
4. Monitor the discovery progress in real-time
5. View discovered devices in **Network > Devices**

### Creating Tasks
1. Go to **Tasks > Create New Task**
2. Fill in task details (title, description, priority)
3. Assign to a user and/or project
4. Add observers if needed
5. Submit and track progress

### Managing Interventions
1. Navigate to **Interventions > New Intervention**
2. Complete intervention details
3. Submit for approval
4. Track approval status
5. Rate completed interventions

## 🔧 Configuration

### Queue Configuration
For background jobs (email notifications, device monitoring):
```bash
# Configure in .env
QUEUE_CONNECTION=database
# or use Redis for better performance
QUEUE_CONNECTION=redis
```

### Task Scheduling
Add to your crontab for automated monitoring:
```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

### Discovery Settings
Configure in `config/discovery.php`:
- Ping timeout
- SNMP timeout
- Concurrent discovery limit
- Device registration settings

## 🧪 Testing

```bash
# Run all tests
php artisan test

# Run specific test suite
php artisan test --filter=DeviceDiscoveryTest

# Run with coverage
php artisan test --coverage
```

## 📁 Project Structure

```
├── app/
│   ├── Http/Controllers/     # Application controllers
│   ├── Models/              # Eloquent models
│   ├── Jobs/                # Queue jobs
│   ├── Notifications/       # Notification classes
│   ├── Services/            # Business logic services
│   └── Policies/            # Authorization policies
├── resources/
│   ├── js/
│   │   ├── Pages/          # React page components
│   │   ├── Components/     # Reusable React components
│   │   └── Layouts/        # Layout components
│   └── views/              # Blade templates
├── routes/
│   ├── web.php             # Web routes
│   └── auth.php            # Authentication routes
├── database/
│   ├── migrations/         # Database migrations
│   └── seeders/            # Database seeders
└── config/                 # Configuration files
```

## 🔒 Security

- CSRF protection enabled on all forms
- XSS protection with escaped output
- SQL injection prevention via Eloquent ORM
- Password hashing using bcrypt
- Rate limiting on authentication routes
- Role-based access control
- Input validation on all requests

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Amine Trabelsi**
- GitHub: [@trabelssi](https://github.com/trabelssi)
- **Role**: Intern Software Developer
- **Company**: Sancella Tunisia

## 🏢 Internship Details

This project was developed during an internship at **Sancella Tunisia** as part of a comprehensive IT infrastructure improvement initiative. The system successfully addressed the company's needs for automated network monitoring, device management, and streamlined IT service operations.

**Key Achievements:**
- Implemented automated SNMP-based network device discovery
- Developed complete IT ticket management system
- Created real-time monitoring dashboard
- Integrated multi-channel notification system
- Established role-based access control for security

## 🙏 Acknowledgments

- **Sancella Tunisia (SO.TU.PA)** for the internship opportunity and support
- Internship supervisor and IT team at Sancella Tunisia
- Laravel Framework
- React & Inertia.js community
- Tailwind CSS
- All open-source contributors

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

**⭐ If you find this project useful, please consider giving it a star!**
