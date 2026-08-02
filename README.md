# Network Monitoring System

<div align="center">

![Network Monitoring](app%20images/Welcome.png)

**Enterprise-grade network monitoring and IT service management platform**

[![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Docker](https://img.shields.io/badge/Docker-24.x-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Prometheus](https://img.shields.io/badge/Prometheus-3.13-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)](https://prometheus.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Application Gallery](#-application-gallery)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Usage Guide](#-usage-guide)
- [Security Features](#-security-features)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)
- [Acknowledgments](#-acknowledgments)

---

## 🌟 Overview

A comprehensive network monitoring and IT service management system that provides real-time device discovery, intelligent alerting, and complete ticket management capabilities. Built with a modern microservices architecture combining Laravel's robust backend with Python's high-performance network monitoring capabilities.

<div align="center">

### 🏢 Developed for Sancella Tunisia

**Industry**: Manufacturing - Hygiene & Personal Care Products  
**Location**: Charguia 1, Tunis, Tunisia  
**Products**: Libero, Peaudouce, Nana, Lotus, Tena, Tork

</div>

---

## ✨ Key Features

### 🔍 Intelligent Network Monitoring

<table>
<tr>
<td width="50%">

**Automated Discovery**
- SNMP-based device scanning
- Automatic device classification
- Network topology mapping
- Real-time device registration

</td>
<td width="50%">

**Continuous Monitoring**
- 30-second polling intervals
- ICMP ping + SNMP health checks
- Historical status tracking
- Response time metrics

</td>
</tr>
</table>

![Network Dashboard](app%20images/network-dashboard.png)

### 🚨 Smart Alerting System

- **Prometheus-powered metrics** - Industry-standard monitoring
- **Alertmanager integration** - Intelligent alert routing and grouping
- **Multi-channel notifications** - Email, in-app, and webhook support
- **Escalation policies** - Automatic task creation on device failures
- **Configurable intervals** - Group wait, group interval, and repeat interval controls

### 🎫 Complete IT Service Management

<table>
<tr>
<td width="33%">

**Task Management**
- Priority-based workflows
- Assignment tracking
- Observer notifications
- Project organization

</td>
<td width="33%">

**Intervention System**
- Approval workflows
- Quality ratings
- Status tracking
- Team collaboration

</td>
<td width="33%">

**Department Structure**
- Organizational hierarchy
- Resource allocation
- User management
- Access control

</td>
</tr>
</table>

![Task Management](app%20images/ticket-show.png)

### 📊 Advanced Analytics

- **Grafana dashboards** - Professional visualization
- **Custom metrics** - Device availability, response times, status changes
- **Historical analysis** - 90-day data retention
- **Real-time charts** - Live metric updates

---

## 🖼️ Application Gallery

<details>
<summary><b>👤 Authentication & Security</b></summary>

![Authentication](app%20images/login-singup-passwordforget.png)

Multi-factor authentication, password recovery, and secure session management.

</details>

<details>
<summary><b>📈 Executive Dashboard</b></summary>

![Main Dashboard](app%20images/main-dashboard.png)

Comprehensive overview with key metrics, recent activities, and system health indicators.

</details>

<details>
<summary><b>🔍 Device Discovery</b></summary>

![Device Discovery](app%20images/device-discovery.png)

Automated SNMP-based network scanning with intelligent device classification.

</details>

<details>
<summary><b>💻 Device Management</b></summary>

![Device Details](app%20images/device-show.png)

Detailed device information including SNMP data, status history, and network topology position.

</details>

<details>
<summary><b>🏭 Equipment Management</b></summary>

![Machine Management](app%20images/machine-show.png)

Complete hardware inventory with maintenance tracking and assignment management.

</details>

<details>
<summary><b>📋 Intervention Workflows</b></summary>

![Intervention Details](app%20images/intervention-show.png)

Full intervention lifecycle with approval systems, status tracking, and quality ratings.

</details>

<details>
<summary><b>🏢 Department Organization</b></summary>

![Departments](app%20images/departments-index.png)

Hierarchical organization structure with user and resource management.

</details>

<details>
<summary><b>🔔 Real-time Notifications</b></summary>

![Notifications](app%20images/notifications.png)

Instant notifications for tasks, interventions, device alerts, and system events.

</details>

---

## 🏗️ Technology Stack

### Backend Services

<table>
<tr>
<td width="50%" valign="top">

#### Laravel Application
![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?style=flat-square&logo=php&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?style=flat-square&logo=laravel&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=flat-square&logo=mysql&logoColor=white)

- RESTful API with Inertia.js
- Laravel Sanctum authentication
- Queue system with Redis
- Multi-channel notifications
- Observer pattern for events

</td>
<td width="50%" valign="top">

#### Python Monitoring Service
![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)

- Async ICMP ping (icmplib)
- SNMP polling (pysnmp)
- Prometheus metrics exporter
- 30-second polling loops
- Database write operations

</td>
</tr>
</table>

### Monitoring & Observability

<table>
<tr>
<td width="33%" align="center">

![Prometheus](https://img.shields.io/badge/Prometheus-3.13-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)

Time-series metrics database  
90-day retention  
Custom alert rules

</td>
<td width="33%" align="center">

![Alertmanager](https://img.shields.io/badge/Alertmanager-0.32-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)

Alert routing engine  
Webhook integration  
Alert grouping

</td>
<td width="33%" align="center">

![Grafana](https://img.shields.io/badge/Grafana-11.x-F46800?style=for-the-badge&logo=grafana&logoColor=white)

Visualization platform  
Custom dashboards  
Real-time updates

</td>
</tr>
</table>

### Frontend

<table>
<tr>
<td width="50%">

![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white)

</td>
<td width="50%">

- Inertia.js for SPA experience
- Chart.js for data visualization
- Three.js for 3D topology
- Framer Motion animations
- Heroicons & Lucide icons

</td>
</tr>
</table>

### Infrastructure

<table>
<tr>
<td width="25%" align="center">

![Docker](https://img.shields.io/badge/Docker-24.x-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Multi-container  
orchestration

</td>
<td width="25%" align="center">

![Nginx](https://img.shields.io/badge/Nginx-Alpine-009639?style=for-the-badge&logo=nginx&logoColor=white)

Reverse proxy  
Load balancing

</td>
<td width="25%" align="center">

![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?style=for-the-badge&logo=redis&logoColor=white)

Cache, queue  
sessions

</td>
<td width="25%" align="center">

![Supervisor](https://img.shields.io/badge/Supervisor-4.x-97CA00?style=for-the-badge)

Process  
management

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose 24.x+
- Git
- 4GB RAM minimum (8GB recommended)

### Installation

```bash
# Clone repository
git clone https://github.com/trabelssi/network-monitoring-system.git
cd network-monitoring-system

# Configure environment
cp .env.example .env
cp docker/alertmanager/alertmanager.yml.example docker/alertmanager/alertmanager.yml

# Generate application key
docker compose exec php php artisan key:generate

# IMPORTANT: Edit docker/alertmanager/alertmanager.yml
# Replace CHANGE_ME_MATCH_INTERNAL_API_TOKEN with your INTERNAL_API_TOKEN from .env

# Start Docker stack
docker compose up -d

# Run migrations
docker compose exec php php artisan migrate

# (Optional) Seed database with demo data
docker compose exec php php artisan db:seed
```

### Access the Application

- **Application**: http://localhost
- **Grafana**: http://localhost:3000 (admin/admin_password)
- **Python Service Health**: http://localhost:8000/health

**Default Credentials**:
- Email: `admin@example.com`
- Password: `password`

⚠️ **Change default credentials immediately after first login**

---

## 📊 Architecture

```mermaid
graph TB
    subgraph "Entry Point"
        Nginx[Nginx :80<br/>Reverse Proxy]
    end
    
    subgraph "Application Layer"
        PHP[Laravel/PHP<br/>- Inertia.js<br/>- Sanctum Auth<br/>- Queue Worker<br/>- Scheduler]
        Python[Python FastAPI :8000<br/>- ICMP Polling<br/>- SNMP Polling<br/>- Metrics Export]
    end
    
    subgraph "Data Layer"
        MySQL[(MySQL 8.0<br/>Persistent Storage)]
        Redis[(Redis 7.x<br/>Cache/Queue/Session)]
    end
    
    subgraph "Monitoring Stack"
        Prometheus[Prometheus 3.13<br/>- Metrics DB<br/>- Alert Rules<br/>- 90d Retention]
        Alertmanager[Alertmanager 0.32<br/>- Alert Routing<br/>- Webhook Integration<br/>- Alert Grouping]
        Grafana[Grafana 11.x<br/>Visualization]
    end
    
    subgraph "Process Management"
        Supervisor[Supervisor 4.x<br/>- PHP-FPM<br/>- Queue Worker<br/>- Scheduler]
    end
    
    Nginx --> PHP
    Nginx --> Python
    PHP --> MySQL
    Python --> MySQL
    PHP --> Redis
    Python --> Prometheus
    Prometheus --> Alertmanager
    Alertmanager -->|Webhook| PHP
    Grafana --> Prometheus
    Supervisor -.->|Manages| PHP
    
    style Nginx fill:#90EE90
    style PHP fill:#FF6B6B
    style Python fill:#4ECDC4
    style MySQL fill:#45B7D1
    style Redis fill:#DC382D
    style Prometheus fill:#E6522C
    style Alertmanager fill:#FF9F1C
    style Grafana fill:#F46800
    style Supervisor fill:#97CA00
```

---

## 🔧 Configuration

### Environment Variables

```env
# Application
APP_NAME="Network Monitoring"
APP_ENV=production
APP_DEBUG=false

# Database
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=network_monitoring
DB_USERNAME=laravel_user
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# SNMP Configuration
SNMP_ENABLED=true
SNMP_VERSION=2
SNMP_COMMUNITY=public
SNMP_TIMEOUT=3000000
SNMP_RETRIES=3

# Python Service
POLL_INTERVAL=30

# Internal API (for Alertmanager webhook)
INTERNAL_API_TOKEN=your_generated_token_here

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
```

### SNMP Community Strings

Edit `config/snmp.php` to add community strings for your network devices:

```php
'communities' => [
    'public',
    'private',
    'your_custom_community',
],
```

### Alert Rules

Customize alert thresholds in `docker/prometheus/alerts.yml`:

```yaml
groups:
  - name: device_alerts
    rules:
      - alert: DeviceDown
        expr: device_up == 0
        for: 5m  # Alert after 5 minutes down
        labels:
          severity: critical
        annotations:
          summary: "Device {{ $labels.hostname }} is down"
```

---

## 📖 Usage Guide

### Network Discovery

1. Navigate to **Network** → **Device Discovery**
2. Enter IP range (e.g., `192.168.1.0/24`)
3. Select SNMP version and community string
4. Click **Start Discovery**
5. Monitor real-time progress
6. Review discovered devices in **Network** → **Devices**

### Monitoring Dashboard

- Access Grafana at `http://localhost:3000`
- View pre-configured dashboards:
  - **Network Overview**: Device status, availability trends
  - **Device Details**: Per-device metrics and history
  - **Alert History**: Recent alerts and resolutions

### Task Management

1. **Tasks** → **Create New**
2. Enter task details (title, description, priority)
3. Assign to user/project
4. Add observers for notifications
5. Track progress and status updates

### Intervention Workflows

1. **Interventions** → **New Intervention**
2. Link to related task (optional)
3. Submit for approval
4. Track approval status
5. Rate completed interventions

---

## 🔒 Security Features

- **CSRF Protection**: All forms protected against cross-site request forgery
- **XSS Prevention**: Output escaping and Content Security Policy
- **SQL Injection Prevention**: Eloquent ORM with parameterized queries
- **Password Security**: Bcrypt hashing with configurable work factor
- **Rate Limiting**: API and authentication endpoint protection
- **Role-Based Access Control**: Admin/User permission system
- **Secure Headers**: HTTPS enforcement, HSTS, X-Frame-Options
- **Input Validation**: Server-side validation on all requests
- **Docker Security**: Non-root containers, capability restrictions

---

## 🧪 Testing

```bash
# PHP/Laravel tests
docker compose exec php php artisan test

# Python service tests
docker compose exec python-service pytest -v

# Run with coverage
docker compose exec php php artisan test --coverage
docker compose exec python-service pytest --cov=. --cov-report=html
```

---

## 📁 Project Structure

```
network-monitoring-system/
├── app/                          # Laravel application
│   ├── Http/Controllers/         # API & web controllers
│   ├── Models/                   # Eloquent models
│   ├── Jobs/                     # Background jobs
│   ├── Notifications/            # Notification classes
│   └── Services/                 # Business logic
├── python-service/               # Python monitoring service
│   ├── main.py                   # FastAPI application
│   ├── icmp_poller.py           # Ping implementation
│   ├── snmp_poller.py           # SNMP queries
│   ├── metrics.py               # Prometheus metrics
│   └── database_writer.py       # MySQL integration
├── resources/
│   ├── js/
│   │   ├── Pages/               # React pages
│   │   ├── Components/          # Reusable components
│   │   └── Layouts/             # Layout templates
│   └── views/                   # Blade templates
├── docker/
│   ├── prometheus/              # Prometheus configuration
│   ├── alertmanager/            # Alertmanager configuration
│   ├── grafana/                 # Grafana dashboards
│   └── nginx/                   # Nginx configuration
├── docker-compose.yml           # Docker orchestration
└── Dockerfile                   # PHP service image
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Amine Trabelsi**

[![GitHub](https://img.shields.io/badge/GitHub-@trabelssi-181717?style=flat-square&logo=github)](https://github.com/trabelssi)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/trabelsi-mohamed-amine)
[![Email](https://img.shields.io/badge/Email-aminetrabls021%40gmail.com-D14836?style=flat-square&logo=gmail&logoColor=white)](mailto:aminetrabls021@gmail.com)
[![Portfolio](https://img.shields.io/badge/Portfolio-trabelssi.github.io-00C7B7?style=flat-square&logo=github&logoColor=white)](https://trabelssi.github.io/)

**Role**: Software Developer  
**Company**: Sancella Tunisia

---

## 🙏 Acknowledgments

- **Sancella Tunisia (SO.TU.PA)** for project sponsorship and requirements
- IT team at Sancella Tunisia for feedback and domain expertise
- Open-source communities:
  - Laravel Framework
  - React & Inertia.js
  - Prometheus & Grafana ecosystems
  - Python FastAPI
  - Docker community

---

<div align="center">

**⭐ Star this repository if you find it useful!**

**🔗 [Documentation](https://github.com/trabelssi/network-monitoring-system/wiki) • [Report Bug](https://github.com/trabelssi/network-monitoring-system/issues) • [Request Feature](https://github.com/trabelssi/network-monitoring-system/issues)**

</div>
