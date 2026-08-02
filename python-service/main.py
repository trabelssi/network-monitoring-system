"""
Network Discovery Service - FastAPI Application

This service handles network device discovery and monitoring,
replacing the legacy PHP SancellaDiscoveryService.

Phase 2, Step 1: Basic scaffold with health check and database connectivity
Phase 2, Step 9: Continuous device polling via background asyncio task
"""

import os
import asyncio
import logging
from typing import Dict, Any, List
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, Response
import pymysql
from dotenv import load_dotenv

from metrics import generate_metrics, MetricsUpdater
from icmp_poller import ICMPPoller
from snmp_poller import SNMPPoller
from database_writer import DatabaseConfig, DeviceMonitor

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=os.getenv("SERVICE_NAME", "Network Discovery Service"),
    version=os.getenv("SERVICE_VERSION", "1.0.0"),
    description="Network device discovery and monitoring service",
)

# Global polling task reference
_polling_task = None


def get_db_connection():
    """
    Get a database connection using environment variables

    Returns:
        pymysql.Connection: Database connection object
    """
    return pymysql.connect(
        host=os.getenv("DB_HOST", "mysql"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USERNAME", "laravel_user"),
        password=os.getenv("DB_PASSWORD", "laravel_password"),
        database=os.getenv("DB_DATABASE", "network_monitoring"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


@app.get("/")
async def root() -> Dict[str, str]:
    """
    Root endpoint - service information

    Returns:
        Dict containing service name and version
    """
    return {
        "service": os.getenv("SERVICE_NAME", "Network Discovery Service"),
        "version": os.getenv("SERVICE_VERSION", "1.0.0"),
        "status": "operational",
    }


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint

    Verifies:
    - Service is running
    - Database connection is working

    Returns:
        Dict containing health status and database connectivity
    """
    health_status = {
        "service": "network-discovery-service",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": {"connected": False, "details": None},
    }

    # Test database connection
    try:
        connection = get_db_connection()
        with connection:
            with connection.cursor() as cursor:
                # Simple connectivity test
                cursor.execute("SELECT 1 as test")
                result = cursor.fetchone()

                # Count devices in database
                cursor.execute("SELECT COUNT(*) as device_count FROM device")
                device_count = cursor.fetchone()

                health_status["database"]["connected"] = True
                health_status["database"]["details"] = {
                    "test_query": result.get("test") == 1,
                    "device_count": device_count.get("device_count", 0),
                }

    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["database"]["error"] = str(e)
        # Don't raise exception - health check should always return, even if unhealthy

    return health_status


@app.get("/database/test")
async def test_database() -> Dict[str, Any]:
    """
    Detailed database connectivity test

    Returns:
        Dict containing detailed database information
    """
    try:
        connection = get_db_connection()
        with connection:
            with connection.cursor() as cursor:
                # Test basic query
                cursor.execute("SELECT VERSION() as version")
                mysql_version = cursor.fetchone()

                # Get device table info
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_devices,
                        SUM(CASE WHEN is_alive = 1 THEN 1 ELSE 0 END) as alive_devices,
                        SUM(CASE WHEN snmp_available = 1 THEN 1 ELSE 0 END) as snmp_devices
                    FROM device
                """)
                device_stats = cursor.fetchone()

                return {
                    "status": "success",
                    "mysql_version": mysql_version.get("version"),
                    "database": os.getenv("DB_DATABASE"),
                    "host": os.getenv("DB_HOST"),
                    "device_statistics": {
                        "total": device_stats.get("total_devices", 0),
                        "alive": device_stats.get("alive_devices", 0),
                        "snmp_available": device_stats.get("snmp_devices", 0),
                    },
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": "Database connection failed", "message": str(e)},
        )


def get_devices_to_monitor() -> List[Dict[str, Any]]:
    """
    Fetch all devices from the database that should be monitored.
    
    Returns:
        List of device dictionaries with id, ip_address, hostname
    """
    try:
        connection = get_db_connection()
        with connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id, ip_address, hostname FROM device ORDER BY id"
                )
                devices = cursor.fetchall()
                return devices
    except Exception as e:
        logger.error(f"Failed to fetch devices: {e}")
        return []


async def poll_device(
    device: Dict[str, Any],
    icmp_poller: ICMPPoller,
    snmp_poller: SNMPPoller,
    device_monitor: DeviceMonitor
) -> None:
    """
    Poll a single device: ping, optionally SNMP, update DB and metrics.
    
    Args:
        device: Device dict with id, ip_address, hostname
        icmp_poller: ICMP poller instance
        snmp_poller: SNMP poller instance  
        device_monitor: Database writer instance
    """
    device_id = device["id"]
    ip_address = device["ip_address"]
    hostname = device["hostname"] or f"device-{device_id}"
    
    try:
        # ICMP ping
        ping_result = await icmp_poller.async_ping(ip_address)
        is_alive = ping_result.is_alive
        response_time_ms = ping_result.response_time_ms if ping_result.response_time_ms is not None else 0.0
        
        # SNMP query (only if device is alive)
        snmp_result = None
        if is_alive:
            snmp_result = snmp_poller.query_device(ip_address)
        
        # Update database
        device_monitor.monitor_device(
            device_id=device_id,
            ping_result=ping_result,
            snmp_result=snmp_result
        )
        
        # Update Prometheus metrics
        MetricsUpdater.update_device_metrics(
            device_id=device_id,
            hostname=hostname,
            is_alive=is_alive,
            response_time_ms=response_time_ms if is_alive else None,
            snmp_available_status=snmp_result.available if snmp_result else None
        )
        
        logger.info(
            f"Polled device {device_id} ({ip_address}): "
            f"alive={is_alive}, rtt={response_time_ms:.2f}ms, snmp={snmp_result.available if snmp_result else None}"
        )
        
    except Exception as e:
        logger.error(f"Error polling device {device_id} ({ip_address}): {e}")


async def polling_loop() -> None:
    """
    Continuous background polling loop.
    Polls all devices every POLL_INTERVAL seconds (default 30s to align with Prometheus scrape).
    """
    poll_interval = int(os.getenv("POLL_INTERVAL", "30"))
    logger.info(f"Starting polling loop with {poll_interval}s interval")
    
    # Initialize pollers and database writer
    db_config = DatabaseConfig.from_env()
    icmp_poller = ICMPPoller()
    snmp_poller = SNMPPoller()
    device_monitor = DeviceMonitor(db_config)
    
    while True:
        try:
            devices = get_devices_to_monitor()
            
            if not devices:
                logger.debug("No devices to monitor")
            else:
                logger.info(f"Polling {len(devices)} device(s)")
                
                # Poll all devices concurrently
                tasks = [
                    poll_device(device, icmp_poller, snmp_poller, device_monitor)
                    for device in devices
                ]
                await asyncio.gather(*tasks, return_exceptions=True)
                
        except Exception as e:
            logger.error(f"Error in polling loop cycle: {e}")
        
        # Wait for next cycle
        await asyncio.sleep(poll_interval)


@app.on_event("startup")
async def startup_event():
    """
    FastAPI startup event - launches background polling task.
    """
    global _polling_task
    logger.info("Starting background polling task")
    _polling_task = asyncio.create_task(polling_loop())


@app.on_event("shutdown")
async def shutdown_event():
    """
    FastAPI shutdown event - cancels background polling task.
    """
    global _polling_task
    if _polling_task:
        logger.info("Cancelling background polling task")
        _polling_task.cancel()
        try:
            await _polling_task
        except asyncio.CancelledError:
            logger.info("Background polling task cancelled successfully")


@app.get("/metrics")
async def metrics() -> Response:
    """
    Prometheus metrics endpoint

    Returns metrics in Prometheus exposition format:
    - device_up{device_id, hostname} - Device availability (1=up, 0=down)
    - device_response_time_ms{device_id, hostname} - ICMP RTT in milliseconds
    - snmp_available{device_id, hostname} - SNMP availability (1=available, 0=unavailable)
    - device_status_changes_total{device_id, hostname} - Counter of status transitions

    Phase 3, Step 1: Prometheus instrumentation
    """
    return Response(
        content=generate_metrics(),
        media_type="text/plain; version=0.0.4; charset=utf-8",
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("SERVICE_PORT", "8000"))
    debug = os.getenv("DEBUG", "false").lower() == "true"

    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=debug)
