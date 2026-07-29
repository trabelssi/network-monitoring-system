# Network Discovery Service (Python)

FastAPI-based network device discovery and monitoring service.

## Phase 2 Implementation

This service is being built in phases to replace the legacy PHP `SancellaDiscoveryService`:

- **Step 1** (Current): Basic scaffold, health check, database connectivity ✅
- **Step 2**: ICMP ping functionality
- **Step 3**: SNMP query functionality
- **Step 4**: Discovery workflow (write to discovery_queue)
- **Step 5**: Monitoring workflow (write to device_status_history)
- **Step 6**: FastAPI endpoints (discover IP, discover subnet)
- **Step 7**: Scheduled jobs (via cron or APScheduler)
- **Step 8**: Testing and verification

## Quick Start (Docker)

The service runs as part of the main docker-compose stack:

```bash
# Start all services (from repo root)
docker compose up -d

# Check Python service logs
docker compose logs python-service

# Test health endpoint
curl http://localhost:8000/health
```

## Endpoints (Step 1)

- `GET /` - Service information
- `GET /health` - Health check with database connectivity test
- `GET /database/test` - Detailed database statistics

## Development (Local)

```bash
cd python-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run service
python main.py
```

## Configuration

Environment variables (set in `.env` or docker-compose.yml):

- `SERVICE_NAME` - Service identifier
- `SERVICE_VERSION` - Version string
- `DEBUG` - Enable debug mode (true/false)
- `DB_HOST` - MySQL host (docker: `mysql`)
- `DB_PORT` - MySQL port (default: 3306)
- `DB_DATABASE` - Database name (`network_monitoring`)
- `DB_USERNAME` - Database user
- `DB_PASSWORD` - Database password
- `SERVICE_PORT` - HTTP port (default: 8000)

## Database

Shares the same MySQL database as the Laravel application:

- Tables: `device`, `discovery_queue`, `device_status_history`
- Connection via PyMySQL
- Same credentials as Laravel `.env`

## Health Check

The `/health` endpoint verifies:

1. Service is running
2. Database connection is active
3. Can query the `device` table
4. Returns device count

Example response:

```json
{
  "service": "network-discovery-service",
  "status": "healthy",
  "timestamp": "2026-07-29T10:30:00",
  "database": {
    "connected": true,
    "details": {
      "test_query": true,
      "device_count": 42
    }
  }
}
```

## Next Steps

See `phase2-python-service-revised.md` in the repo root for the full implementation plan.
