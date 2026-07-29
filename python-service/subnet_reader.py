"""
Subnet Reader Module

Reads monitored_subnets table to determine which subnets to scan.
Replaces hardcoded subnet arrays with database-driven configuration.

Phase 2, Step 5: Subnet targets from database
Status: Written, NOT YET VERIFIED IN DOCKER

CRITICAL SCHEMA VERIFICATION (2026-07-29):
- monitored_subnets: Verified against 2026_07_29_151937_create_monitored_subnets_table.php
- Columns: id, subnet (string), name (string), enabled (boolean), created_at, updated_at
"""

from typing import List, Optional
from dataclasses import dataclass
import pymysql
from pymysql.cursors import DictCursor


@dataclass
class MonitoredSubnet:
    """Represents a subnet to be monitored"""

    id: int
    subnet: str
    name: str
    enabled: bool

    def __str__(self) -> str:
        status = "enabled" if self.enabled else "disabled"
        return f"{self.subnet} ({self.name}) - {status}"


class SubnetReader:
    """
    Reads monitored subnets from database

    This is the source of truth for what subnets Python should scan.
    Replaces hardcoded arrays in DiscoverNetworkDevices.php

    Schema: database/migrations/2026_07_29_151937_create_monitored_subnets_table.php
    Columns verified: 2026-07-29
    """

    def __init__(self, db_config=None):
        """
        Initialize reader with database configuration

        Args:
            db_config: DatabaseConfig instance (from database_writer.py)
                       If None, loads from environment
        """
        if db_config is None:
            # Import here to avoid circular dependency
            from database_writer import DatabaseConfig

            db_config = DatabaseConfig.from_env()

        self.db_config = db_config

    def get_connection(self):
        """Get database connection (same pattern as database_writer.py)"""
        return pymysql.connect(
            host=self.db_config.host,
            port=self.db_config.port,
            user=self.db_config.username,
            password=self.db_config.password,
            database=self.db_config.database,
            charset=self.db_config.charset,
            cursorclass=DictCursor,
        )

    def get_enabled_subnets(self) -> List[MonitoredSubnet]:
        """
        Get all enabled subnets for scanning

        Returns:
            List of MonitoredSubnet objects where enabled=true

        Note:
            Results are ordered by subnet for consistent processing order
        """
        connection = self.get_connection()
        try:
            with connection.cursor() as cursor:
                sql = """
                SELECT id, subnet, name, enabled
                FROM monitored_subnets
                WHERE enabled = TRUE
                ORDER BY subnet
                """

                cursor.execute(sql)
                rows = cursor.fetchall()

                return [
                    MonitoredSubnet(
                        id=row["id"],
                        subnet=row["subnet"],
                        name=row["name"],
                        enabled=bool(row["enabled"]),
                    )
                    for row in rows
                ]
        finally:
            connection.close()

    def get_all_subnets(self, include_disabled: bool = False) -> List[MonitoredSubnet]:
        """
        Get all subnets (enabled and/or disabled)

        Args:
            include_disabled: If True, includes disabled subnets in results

        Returns:
            List of MonitoredSubnet objects
        """
        connection = self.get_connection()
        try:
            with connection.cursor() as cursor:
                if include_disabled:
                    sql = """
                    SELECT id, subnet, name, enabled
                    FROM monitored_subnets
                    ORDER BY subnet
                    """
                else:
                    sql = """
                    SELECT id, subnet, name, enabled
                    FROM monitored_subnets
                    WHERE enabled = TRUE
                    ORDER BY subnet
                    """

                cursor.execute(sql)
                rows = cursor.fetchall()

                return [
                    MonitoredSubnet(
                        id=row["id"],
                        subnet=row["subnet"],
                        name=row["name"],
                        enabled=bool(row["enabled"]),
                    )
                    for row in rows
                ]
        finally:
            connection.close()

    def get_subnet_by_cidr(self, cidr: str) -> Optional[MonitoredSubnet]:
        """
        Get a specific subnet by CIDR notation

        Args:
            cidr: CIDR notation (e.g., "192.168.1.0/24")

        Returns:
            MonitoredSubnet if found, None otherwise
        """
        connection = self.get_connection()
        try:
            with connection.cursor() as cursor:
                sql = """
                SELECT id, subnet, name, enabled
                FROM monitored_subnets
                WHERE subnet = %s
                """

                cursor.execute(sql, (cidr,))
                row = cursor.fetchone()

                if not row:
                    return None

                return MonitoredSubnet(
                    id=row["id"],
                    subnet=row["subnet"],
                    name=row["name"],
                    enabled=bool(row["enabled"]),
                )
        finally:
            connection.close()

    def count_enabled_subnets(self) -> int:
        """
        Count how many subnets are currently enabled

        Returns:
            Number of enabled subnets
        """
        connection = self.get_connection()
        try:
            with connection.cursor() as cursor:
                sql = "SELECT COUNT(*) as count FROM monitored_subnets WHERE enabled = TRUE"
                cursor.execute(sql)
                result = cursor.fetchone()
                return result["count"] if result else 0
        finally:
            connection.close()


def get_subnets_to_scan(db_config=None) -> List[str]:
    """
    Convenience function: Get list of subnet CIDR strings to scan

    Args:
        db_config: Optional DatabaseConfig instance

    Returns:
        List of subnet CIDR strings (e.g., ["192.168.1.0/24", "192.168.10.0/24"])

    Usage:
        subnets = get_subnets_to_scan()
        for subnet in subnets:
            scan_subnet(subnet)
    """
    reader = SubnetReader(db_config)
    monitored_subnets = reader.get_enabled_subnets()
    return [subnet.subnet for subnet in monitored_subnets]
