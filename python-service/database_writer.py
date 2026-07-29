"""
Database Writer Module

Writes discovery and monitoring results to MySQL.
Matches Laravel schema exactly - no new columns invented.

Phase 2, Step 4: Discovery and monitoring database writes
Status: Written, NOT YET VERIFIED IN DOCKER

CRITICAL SCHEMA VERIFICATION (2026-07-29):
- discovery_queue: Verified against 2025_01_15_000000_create_discovery_queue_table.php
- device_status_history: Verified against 2025_08_28_072103_create_device_status_history_table.php
- device: Verified against 2025_08_28_072100_create_device_table.php
"""

from typing import Optional, Dict, Any
from datetime import datetime
from dataclasses import dataclass
import pymysql
from pymysql.cursors import DictCursor

from snmp_poller import SNMPResult
from icmp_poller import PingResult
from metrics import MetricsUpdater


@dataclass
class DatabaseConfig:
    """Database connection configuration"""

    host: str
    port: int
    database: str
    username: str
    password: str
    charset: str = "utf8mb4"

    @classmethod
    def from_env(cls) -> "DatabaseConfig":
        """Load from environment variables (matches main.py)"""
        import os

        return cls(
            host=os.getenv("DB_HOST", "mysql"),
            port=int(os.getenv("DB_PORT", "3306")),
            database=os.getenv("DB_DATABASE", "network_monitoring"),
            username=os.getenv("DB_USERNAME", "laravel_user"),
            password=os.getenv("DB_PASSWORD", "laravel_password"),
            charset="utf8mb4",
        )


class DiscoveryQueueWriter:
    """
    Writes new device discoveries to discovery_queue table

    Matches DeviceDiscoveryService->storeInQueue() behavior.
    Does NOT touch AutoAssignmentService - that stays in Laravel.

    Schema: database/migrations/2025_01_15_000000_create_discovery_queue_table.php
    Columns verified: 2026-07-29
    """

    def __init__(self, db_config: Optional[DatabaseConfig] = None):
        """Initialize writer with database configuration"""
        self.db_config = db_config or DatabaseConfig.from_env()

    def get_connection(self):
        """Get database connection"""
        return pymysql.connect(
            host=self.db_config.host,
            port=self.db_config.port,
            user=self.db_config.username,
            password=self.db_config.password,
            database=self.db_config.database,
            charset=self.db_config.charset,
            cursorclass=DictCursor,
        )

    def write_discovery(
        self,
        ip_address: str,
        ping_result: PingResult,
        snmp_result: Optional[SNMPResult] = None,
    ) -> int:
        """
        Write discovery result to discovery_queue

        Args:
            ip_address: Device IP address
            ping_result: ICMP ping result
            snmp_result: SNMP query result (optional)

        Returns:
            ID of inserted/updated discovery_queue row

        Note:
            Uses updateOrCreate pattern (INSERT ... ON DUPLICATE KEY UPDATE)
            Matches Laravel's DiscoveryQueue::updateOrCreate() behavior
        """
        connection = self.get_connection()
        try:
            with connection.cursor() as cursor:
                # Prepare data matching discovery_queue schema EXACTLY
                # Schema columns (2025_01_15_000000):
                # id, ip_address, is_alive, snmp_available, sys_descr, sys_name,
                # sys_contact, sys_object_id, sys_location, discovered_at,
                # discovery_status, error_message, created_at, updated_at

                data = {
                    "ip_address": ip_address,
                    "is_alive": ping_result.is_alive,
                    "snmp_available": snmp_result.available if snmp_result else False,
                    "sys_descr": snmp_result.sys_descr if snmp_result else None,
                    "sys_name": snmp_result.sys_name if snmp_result else None,
                    "sys_contact": snmp_result.sys_contact if snmp_result else None,
                    "sys_object_id": snmp_result.sys_object_id if snmp_result else None,
                    "sys_location": snmp_result.sys_location if snmp_result else None,
                    "discovered_at": datetime.now(),
                    "discovery_status": "pending",  # Always pending, AutoAssignmentService processes it
                    "error_message": ping_result.error
                    or (snmp_result.error if snmp_result else None),
                    "updated_at": datetime.now(),
                }

                # Insert or update (matches Laravel updateOrCreate)
                sql = """
                INSERT INTO discovery_queue 
                (ip_address, is_alive, snmp_available, sys_descr, sys_name, 
                 sys_contact, sys_object_id, sys_location, discovered_at, 
                 discovery_status, error_message, created_at, updated_at)
                VALUES (%(ip_address)s, %(is_alive)s, %(snmp_available)s, %(sys_descr)s, %(sys_name)s,
                        %(sys_contact)s, %(sys_object_id)s, %(sys_location)s, %(discovered_at)s,
                        %(discovery_status)s, %(error_message)s, NOW(), %(updated_at)s)
                ON DUPLICATE KEY UPDATE
                    is_alive = VALUES(is_alive),
                    snmp_available = VALUES(snmp_available),
                    sys_descr = VALUES(sys_descr),
                    sys_name = VALUES(sys_name),
                    sys_contact = VALUES(sys_contact),
                    sys_object_id = VALUES(sys_object_id),
                    sys_location = VALUES(sys_location),
                    discovered_at = VALUES(discovered_at),
                    discovery_status = VALUES(discovery_status),
                    error_message = VALUES(error_message),
                    updated_at = VALUES(updated_at)
                """

                cursor.execute(sql, data)
                connection.commit()

                # Return inserted/updated ID
                return cursor.lastrowid or self._get_id_by_ip(cursor, ip_address)

        finally:
            connection.close()

    def _get_id_by_ip(self, cursor, ip_address: str) -> int:
        """Get discovery_queue ID by IP address (for updates)"""
        cursor.execute(
            "SELECT id FROM discovery_queue WHERE ip_address = %s", (ip_address,)
        )
        result = cursor.fetchone()
        return result["id"] if result else 0


class DeviceStatusWriter:
    """
    Writes device status changes to device_status_history
    and updates device.is_alive and device.last_seen

    Matches PingService behavior (monitoring existing devices).

    Schemas verified: 2026-07-29
    - device_status_history: 2025_08_28_072103_create_device_status_history_table.php
    - device: 2025_08_28_072100_create_device_table.php
    """

    def __init__(self, db_config: Optional[DatabaseConfig] = None):
        """Initialize writer with database configuration"""
        self.db_config = db_config or DatabaseConfig.from_env()

    def get_connection(self):
        """Get database connection"""
        return pymysql.connect(
            host=self.db_config.host,
            port=self.db_config.port,
            user=self.db_config.username,
            password=self.db_config.password,
            database=self.db_config.database,
            charset=self.db_config.charset,
            cursorclass=DictCursor,
        )

    def update_device_status(
        self,
        device_id: int,
        ping_result: PingResult,
        snmp_result: Optional[SNMPResult] = None,
        hostname: Optional[str] = None,
    ) -> bool:
        """
        Update device status and record history if status changed

        Args:
            device_id: Device ID (from device table)
            ping_result: ICMP ping result
            snmp_result: SNMP query result (optional, updates snmp_available)
            hostname: Device hostname (optional, for Prometheus labels)

        Returns:
            True if status changed (history recorded), False if no change

        Note:
            CRITICAL: RTT (ping_result.response_time_ms) is NOT written to database.
            RTT stays in-memory only, to be exposed via /metrics in Phase 3.
            This is a deliberate decision - do not add RTT column without Phase 3 approval.

            Phase 3 Integration: Prometheus metrics are updated in-memory during
            the same poll cycle that writes to device_status_history (no second loop).
        """
        connection = self.get_connection()
        try:
            with connection.cursor() as cursor:
                # Get current device status and hostname
                cursor.execute(
                    "SELECT is_alive, snmp_available, hostname FROM device WHERE id = %s",
                    (device_id,),
                )
                current = cursor.fetchone()

                if not current:
                    return False  # Device doesn't exist

                previous_is_alive = current["is_alive"]
                current_is_alive = ping_result.is_alive

                # Use hostname from DB if not provided
                if hostname is None:
                    hostname = current.get("hostname") or f"device_{device_id}"

                # Update device table
                # Columns from device schema (2025_08_28_072100):
                # is_alive (boolean), snmp_available (boolean), last_seen (timestamp)
                update_data = {
                    "is_alive": current_is_alive,
                    "last_seen": datetime.now() if current_is_alive else None,
                    "device_id": device_id,
                }

                # Update snmp_available if SNMP query was performed
                if snmp_result is not None:
                    update_data["snmp_available"] = snmp_result.available
                    sql = """
                    UPDATE device 
                    SET is_alive = %(is_alive)s,
                        snmp_available = %(snmp_available)s,
                        last_seen = %(last_seen)s,
                        updated_at = NOW()
                    WHERE id = %(device_id)s
                    """
                else:
                    sql = """
                    UPDATE device 
                    SET is_alive = %(is_alive)s,
                        last_seen = %(last_seen)s,
                        updated_at = NOW()
                    WHERE id = %(device_id)s
                    """

                cursor.execute(sql, update_data)

                # Record status change in history if changed
                status_changed = previous_is_alive != current_is_alive

                if status_changed:
                    self._record_status_change(
                        cursor, device_id, "online" if current_is_alive else "offline"
                    )

                    # Phase 3: Increment status change counter (same cycle as DB write)
                    MetricsUpdater.increment_status_change(device_id, hostname)

                connection.commit()

                # Phase 3: Update Prometheus metrics (same cycle as DB write)
                MetricsUpdater.update_device_metrics(
                    device_id=device_id,
                    hostname=hostname,
                    is_alive=current_is_alive,
                    response_time_ms=ping_result.response_time_ms,
                    snmp_available_status=snmp_result.available
                    if snmp_result
                    else None,
                )

                return status_changed

        finally:
            connection.close()

    def _record_status_change(self, cursor, device_id: int, status: str):
        """
        Record status change to device_status_history

        Schema columns (2025_08_28_072103):
        id, device_id, status (enum: 'online'/'offline'), changed_at, created_at, updated_at

        Note: No RTT column exists or will be added here. RTT is Phase 3 concern.
        """
        sql = """
        INSERT INTO device_status_history
        (device_id, status, changed_at, created_at, updated_at)
        VALUES (%(device_id)s, %(status)s, %(changed_at)s, NOW(), NOW())
        """

        cursor.execute(
            sql,
            {"device_id": device_id, "status": status, "changed_at": datetime.now()},
        )

    def get_device_id_by_ip(self, ip_address: str) -> Optional[int]:
        """
        Get device ID by IP address

        Args:
            ip_address: Device IP address

        Returns:
            Device ID if found, None otherwise
        """
        connection = self.get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id FROM device WHERE ip_address = %s", (ip_address,)
                )
                result = cursor.fetchone()
                return result["id"] if result else None
        finally:
            connection.close()


class DeviceMonitor:
    """
    High-level device monitoring coordinator

    Combines ICMP/SNMP polling with database writes.
    Handles discovery vs. monitoring logic.
    """

    def __init__(self, db_config: Optional[DatabaseConfig] = None):
        """Initialize monitor with database configuration"""
        self.discovery_writer = DiscoveryQueueWriter(db_config)
        self.status_writer = DeviceStatusWriter(db_config)

    def discover_device(
        self,
        ip_address: str,
        ping_result: PingResult,
        snmp_result: Optional[SNMPResult] = None,
    ) -> int:
        """
        Discover new device and write to discovery_queue

        Args:
            ip_address: Device IP address
            ping_result: ICMP ping result
            snmp_result: SNMP query result (optional)

        Returns:
            Discovery queue entry ID

        Note:
            Device will have discovery_status='pending'.
            AutoAssignmentService (Laravel) processes pending entries.
        """
        return self.discovery_writer.write_discovery(
            ip_address, ping_result, snmp_result
        )

    def monitor_device(
        self,
        device_id: int,
        ping_result: PingResult,
        snmp_result: Optional[SNMPResult] = None,
    ) -> Dict[str, Any]:
        """
        Monitor existing device and update status

        Args:
            device_id: Device ID (from device table)
            ping_result: ICMP ping result
            snmp_result: SNMP query result (optional)

        Returns:
            Dict with status_changed (bool) and current status
        """
        status_changed = self.status_writer.update_device_status(
            device_id, ping_result, snmp_result
        )

        return {
            "status_changed": status_changed,
            "is_alive": ping_result.is_alive,
            "response_time_ms": ping_result.response_time_ms,  # In-memory only, not persisted
            "status": "online" if ping_result.is_alive else "offline",
        }

    def monitor_device_by_ip(
        self,
        ip_address: str,
        ping_result: PingResult,
        snmp_result: Optional[SNMPResult] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Monitor device by IP address (looks up device_id first)

        Args:
            ip_address: Device IP address
            ping_result: ICMP ping result
            snmp_result: SNMP query result (optional)

        Returns:
            Monitoring result dict if device exists, None if not found
        """
        device_id = self.status_writer.get_device_id_by_ip(ip_address)

        if device_id is None:
            return None  # Device not in device table yet

        return self.monitor_device(device_id, ping_result, snmp_result)
