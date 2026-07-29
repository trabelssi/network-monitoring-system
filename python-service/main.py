"""
Network Discovery Service - FastAPI Application

This service handles network device discovery and monitoring,
replacing the legacy PHP SancellaDiscoveryService.

Phase 2, Step 1: Basic scaffold with health check and database connectivity
"""

import os
from typing import Dict, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import pymysql
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title=os.getenv("SERVICE_NAME", "Network Discovery Service"),
    version=os.getenv("SERVICE_VERSION", "1.0.0"),
    description="Network device discovery and monitoring service"
)


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
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
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
        "status": "operational"
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
        "database": {
            "connected": False,
            "details": None
        }
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
                    "device_count": device_count.get("device_count", 0)
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
                        "snmp_available": device_stats.get("snmp_devices", 0)
                    }
                }
                
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Database connection failed",
                "message": str(e)
            }
        )


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("SERVICE_PORT", "8000"))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=debug
    )
