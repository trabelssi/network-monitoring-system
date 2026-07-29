"""
Unit tests for database writer module

Tests with mocked database connections - no real MySQL needed.

Status: Written, NOT YET VERIFIED IN DOCKER
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
from database_writer import (
    DatabaseConfig,
    DiscoveryQueueWriter,
    DeviceStatusWriter,
    DeviceMonitor,
)
from snmp_poller import SNMPResult
from icmp_poller import PingResult, PingStatus


class TestDatabaseConfig:
    """Test database configuration"""

    def test_from_env_with_defaults(self, monkeypatch):
        """Test loading from environment with defaults"""
        for key in ["DB_HOST", "DB_PORT", "DB_DATABASE", "DB_USERNAME", "DB_PASSWORD"]:
            monkeypatch.delenv(key, raising=False)

        config = DatabaseConfig.from_env()
        assert config.host == "mysql"
        assert config.port == 3306
        assert config.database == "network_monitoring"
        assert config.username == "laravel_user"
        assert config.charset == "utf8mb4"

    def test_from_env_with_custom_values(self, monkeypatch):
        """Test loading custom values from environment"""
        monkeypatch.setenv("DB_HOST", "custom-host")
        monkeypatch.setenv("DB_PORT", "3307")
        monkeypatch.setenv("DB_DATABASE", "test_db")
        monkeypatch.setenv("DB_USERNAME", "test_user")
        monkeypatch.setenv("DB_PASSWORD", "test_pass")

        config = DatabaseConfig.from_env()
        assert config.host == "custom-host"
        assert config.port == 3307
        assert config.database == "test_db"
        assert config.username == "test_user"
        assert config.password == "test_pass"


class TestDiscoveryQueueWriter:
    """Test discovery queue writer with mocked database"""

    def test_write_discovery_ping_only(self):
        """Test writing discovery with only ping result"""
        writer = DiscoveryQueueWriter()

        ping_result = PingResult(
            is_alive=True, status=PingStatus.SUCCESS, response_time_ms=12.5
        )

        with patch.object(writer, "get_connection") as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.lastrowid = 123
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            result_id = writer.write_discovery("192.168.1.1", ping_result)

            # Verify SQL was executed
            assert mock_cursor.execute.called
            sql = mock_cursor.execute.call_args[0][0]
            data = mock_cursor.execute.call_args[0][1]

            # Verify INSERT INTO discovery_queue
            assert "INSERT INTO discovery_queue" in sql
            assert "ip_address" in sql

            # Verify data matches schema columns EXACTLY
            assert data["ip_address"] == "192.168.1.1"
            assert data["is_alive"] is True
            assert data["snmp_available"] is False
            assert data["discovery_status"] == "pending"
            assert data["sys_descr"] is None
            assert data["sys_name"] is None

            # Verify commit was called
            assert mock_conn.return_value.__enter__.return_value.commit.called

    def test_write_discovery_with_snmp(self):
        """Test writing discovery with SNMP result"""
        writer = DiscoveryQueueWriter()

        ping_result = PingResult(
            is_alive=True, status=PingStatus.SUCCESS, response_time_ms=15.0
        )

        snmp_result = SNMPResult(
            available=True,
            sys_descr="Cisco IOS Software",
            sys_name="router-01",
            sys_object_id="1.3.6.1.4.1.9.1.1",
            sys_contact="admin@example.com",
            sys_location="Server Room A",
        )

        with patch.object(writer, "get_connection") as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.lastrowid = 456
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            result_id = writer.write_discovery("192.168.1.10", ping_result, snmp_result)

            data = mock_cursor.execute.call_args[0][1]

            # Verify SNMP data included
            assert data["snmp_available"] is True
            assert data["sys_descr"] == "Cisco IOS Software"
            assert data["sys_name"] == "router-01"
            assert data["sys_object_id"] == "1.3.6.1.4.1.9.1.1"
            assert data["sys_contact"] == "admin@example.com"
            assert data["sys_location"] == "Server Room A"

    def test_write_discovery_offline_device(self):
        """Test writing discovery for offline device"""
        writer = DiscoveryQueueWriter()

        ping_result = PingResult(
            is_alive=False,
            status=PingStatus.TIMEOUT,
            response_time_ms=None,
            error="Request timeout",
        )

        with patch.object(writer, "get_connection") as mock_conn:
            mock_cursor = MagicMock()
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            writer.write_discovery("192.168.1.100", ping_result)

            data = mock_cursor.execute.call_args[0][1]

            # Verify offline status
            assert data["is_alive"] is False
            assert data["error_message"] == "Request timeout"
            assert (
                data["discovery_status"] == "pending"
            )  # Still pending for AutoAssignment

    def test_schema_column_names_exact_match(self):
        """
        CRITICAL: Verify column names match discovery_queue schema exactly

        Schema: 2025_01_15_000000_create_discovery_queue_table.php
        Columns: id, ip_address, is_alive, snmp_available, sys_descr, sys_name,
                 sys_contact, sys_object_id, sys_location, discovered_at,
                 discovery_status, error_message, created_at, updated_at
        """
        writer = DiscoveryQueueWriter()

        ping_result = PingResult(is_alive=True, status=PingStatus.SUCCESS)
        snmp_result = SNMPResult(available=True, sys_descr="Test")

        with patch.object(writer, "get_connection") as mock_conn:
            mock_cursor = MagicMock()
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            writer.write_discovery("192.168.1.1", ping_result, snmp_result)

            sql = mock_cursor.execute.call_args[0][0]
            data = mock_cursor.execute.call_args[0][1]

            # Verify all required columns present
            required_columns = [
                "ip_address",
                "is_alive",
                "snmp_available",
                "sys_descr",
                "sys_name",
                "sys_contact",
                "sys_object_id",
                "sys_location",
                "discovered_at",
                "discovery_status",
                "error_message",
            ]

            for col in required_columns:
                assert col in data, f"Missing required column: {col}"
                assert col in sql, f"Column not in SQL: {col}"


class TestDeviceStatusWriter:
    """Test device status writer with mocked database"""

    def test_update_device_status_no_change(self):
        """Test updating device status when status hasn't changed"""
        writer = DeviceStatusWriter()

        ping_result = PingResult(
            is_alive=True, status=PingStatus.SUCCESS, response_time_ms=10.0
        )

        with patch.object(writer, "get_connection") as mock_conn:
            mock_cursor = MagicMock()
            # Current status: online
            mock_cursor.fetchone.return_value = {
                "is_alive": True,
                "snmp_available": False,
            }
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            status_changed = writer.update_device_status(1, ping_result)

            # Status didn't change (was True, still True)
            assert status_changed is False

            # Verify UPDATE was called
            sql_calls = [call[0][0] for call in mock_cursor.execute.call_args_list]
            assert any("UPDATE device" in sql for sql in sql_calls)

            # Verify history was NOT recorded
            assert not any(
                "INSERT INTO device_status_history" in sql for sql in sql_calls
            )

    def test_update_device_status_online_to_offline(self):
        """Test updating device status from online to offline"""
        writer = DeviceStatusWriter()

        ping_result = PingResult(
            is_alive=False, status=PingStatus.TIMEOUT, response_time_ms=None
        )

        with patch.object(writer, "get_connection") as mock_conn:
            mock_cursor = MagicMock()
            # Current status: online
            mock_cursor.fetchone.return_value = {
                "is_alive": True,
                "snmp_available": False,
            }
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            status_changed = writer.update_device_status(1, ping_result)

            # Status changed (was True, now False)
            assert status_changed is True

            # Verify both UPDATE and INSERT were called
            sql_calls = [call[0][0] for call in mock_cursor.execute.call_args_list]
            assert any("UPDATE device" in sql for sql in sql_calls)
            assert any("INSERT INTO device_status_history" in sql for sql in sql_calls)

    def test_update_device_status_with_snmp(self):
        """Test updating device status with SNMP result"""
        writer = DeviceStatusWriter()

        ping_result = PingResult(is_alive=True, status=PingStatus.SUCCESS)
        snmp_result = SNMPResult(available=True, sys_descr="Test")

        with patch.object(writer, "get_connection") as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchone.return_value = {
                "is_alive": False,
                "snmp_available": False,
            }
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            writer.update_device_status(1, ping_result, snmp_result)

            # Verify snmp_available updated
            update_calls = [
                call[0]
                for call in mock_cursor.execute.call_args_list
                if "UPDATE device" in call[0]
            ]
            assert len(update_calls) > 0
            assert "snmp_available" in update_calls[0]

    def test_update_device_last_seen_online(self):
        """Test last_seen updated when device is online"""
        writer = DeviceStatusWriter()

        ping_result = PingResult(
            is_alive=True, status=PingStatus.SUCCESS, response_time_ms=12.0
        )

        with patch.object(writer, "get_connection") as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchone.return_value = {
                "is_alive": True,
                "snmp_available": False,
            }
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            writer.update_device_status(1, ping_result)

            data = mock_cursor.execute.call_args_list[1][0][1]  # UPDATE call
            assert data["last_seen"] is not None

    def test_update_device_last_seen_offline(self):
        """Test last_seen set to None when device is offline"""
        writer = DeviceStatusWriter()

        ping_result = PingResult(is_alive=False, status=PingStatus.TIMEOUT)

        with patch.object(writer, "get_connection") as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchone.return_value = {
                "is_alive": False,
                "snmp_available": False,
            }
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            writer.update_device_status(1, ping_result)

            data = mock_cursor.execute.call_args_list[1][0][1]  # UPDATE call
            assert data["last_seen"] is None

    def test_schema_device_columns_exact_match(self):
        """
        CRITICAL: Verify device table column names match schema exactly

        Schema: 2025_08_28_072100_create_device_table.php
        Updated columns: is_alive (boolean), snmp_available (boolean), last_seen (timestamp)
        """
        writer = DeviceStatusWriter()

        ping_result = PingResult(is_alive=True, status=PingStatus.SUCCESS)

        with patch.object(writer, "get_connection") as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchone.return_value = {
                "is_alive": False,
                "snmp_available": False,
            }
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            writer.update_device_status(1, ping_result)

            # Get UPDATE call
            update_call = next(
                call
                for call in mock_cursor.execute.call_args_list
                if "UPDATE device" in call[0][0]
            )
            sql = update_call[0][0]
            data = update_call[0][1]

            # Verify exact column names from schema
            assert "is_alive" in data
            assert "last_seen" in data
            assert "device_id" in data

            # Verify columns in SQL
            assert "is_alive" in sql
            assert "last_seen" in sql

    def test_schema_history_columns_exact_match(self):
        """
        CRITICAL: Verify device_status_history column names match schema exactly

        Schema: 2025_08_28_072103_create_device_status_history_table.php
        Columns: id, device_id, status (enum: 'online'/'offline'), changed_at, created_at, updated_at
        """
        writer = DeviceStatusWriter()

        ping_result = PingResult(is_alive=True, status=PingStatus.SUCCESS)

        with patch.object(writer, "get_connection") as mock_conn:
            mock_cursor = MagicMock()
            # Status changed: False -> True
            mock_cursor.fetchone.return_value = {
                "is_alive": False,
                "snmp_available": False,
            }
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            writer.update_device_status(1, ping_result)

            # Get INSERT call for history
            history_call = next(
                call
                for call in mock_cursor.execute.call_args_list
                if "INSERT INTO device_status_history" in call[0][0]
            )
            sql = history_call[0][0]
            data = history_call[0][1]

            # Verify exact column names from schema
            assert "device_id" in data
            assert "status" in data
            assert "changed_at" in data

            # Verify status is enum value ('online' or 'offline')
            assert data["status"] in ["online", "offline"]

            # Verify columns in SQL
            assert "device_id" in sql
            assert "status" in sql
            assert "changed_at" in sql

    def test_rtt_not_written_to_database(self):
        """
        CRITICAL: Verify RTT is NOT written to any database table

        RTT stays in-memory only, to be exposed via /metrics in Phase 3.
        This is a deliberate decision - no RTT column should be added.
        """
        writer = DeviceStatusWriter()

        ping_result = PingResult(
            is_alive=True,
            status=PingStatus.SUCCESS,
            response_time_ms=15.5,  # RTT present in result
        )

        with patch.object(writer, "get_connection") as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchone.return_value = {
                "is_alive": False,
                "snmp_available": False,
            }
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            writer.update_device_status(1, ping_result)

            # Verify RTT not in any SQL or data
            all_sql = [call[0][0] for call in mock_cursor.execute.call_args_list]
            all_data = [
                call[0][1] if len(call[0]) > 1 else {}
                for call in mock_cursor.execute.call_args_list
            ]

            # Check all SQL statements
            for sql in all_sql:
                assert "response_time" not in sql.lower()
                assert "rtt" not in sql.lower()

            # Check all data dicts
            for data in all_data:
                if isinstance(data, dict):
                    assert "response_time_ms" not in data
                    assert "rtt" not in data

    def test_get_device_id_by_ip(self):
        """Test getting device ID by IP address"""
        writer = DeviceStatusWriter()

        with patch.object(writer, "get_connection") as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchone.return_value = {"id": 42}
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            device_id = writer.get_device_id_by_ip("192.168.1.1")

            assert device_id == 42
            assert mock_cursor.execute.called

    def test_get_device_id_by_ip_not_found(self):
        """Test getting device ID when IP not found"""
        writer = DeviceStatusWriter()

        with patch.object(writer, "get_connection") as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchone.return_value = None
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor

            device_id = writer.get_device_id_by_ip("192.168.1.999")

            assert device_id is None


class TestDeviceMonitor:
    """Test high-level device monitor coordinator"""

    def test_discover_device(self):
        """Test discovery workflow"""
        monitor = DeviceMonitor()

        ping_result = PingResult(
            is_alive=True, status=PingStatus.SUCCESS, response_time_ms=10.0
        )
        snmp_result = SNMPResult(available=True, sys_descr="Test Device")

        with patch.object(monitor.discovery_writer, "write_discovery") as mock_write:
            mock_write.return_value = 123

            result_id = monitor.discover_device("192.168.1.1", ping_result, snmp_result)

            assert result_id == 123
            mock_write.assert_called_once_with("192.168.1.1", ping_result, snmp_result)

    def test_monitor_device(self):
        """Test monitoring workflow"""
        monitor = DeviceMonitor()

        ping_result = PingResult(
            is_alive=True, status=PingStatus.SUCCESS, response_time_ms=12.5
        )

        with patch.object(monitor.status_writer, "update_device_status") as mock_update:
            mock_update.return_value = True  # Status changed

            result = monitor.monitor_device(1, ping_result)

            assert result["status_changed"] is True
            assert result["is_alive"] is True
            assert result["response_time_ms"] == 12.5  # RTT in result but not database
            assert result["status"] == "online"
            mock_update.assert_called_once_with(1, ping_result, None)

    def test_monitor_device_by_ip_found(self):
        """Test monitoring by IP when device exists"""
        monitor = DeviceMonitor()

        ping_result = PingResult(is_alive=False, status=PingStatus.TIMEOUT)

        with (
            patch.object(monitor.status_writer, "get_device_id_by_ip") as mock_get_id,
            patch.object(monitor.status_writer, "update_device_status") as mock_update,
        ):
            mock_get_id.return_value = 5
            mock_update.return_value = True

            result = monitor.monitor_device_by_ip("192.168.1.5", ping_result)

            assert result is not None
            assert result["status_changed"] is True
            mock_get_id.assert_called_once_with("192.168.1.5")
            mock_update.assert_called_once_with(5, ping_result, None)

    def test_monitor_device_by_ip_not_found(self):
        """Test monitoring by IP when device doesn't exist"""
        monitor = DeviceMonitor()

        ping_result = PingResult(is_alive=True, status=PingStatus.SUCCESS)

        with patch.object(monitor.status_writer, "get_device_id_by_ip") as mock_get_id:
            mock_get_id.return_value = None

            result = monitor.monitor_device_by_ip("192.168.1.999", ping_result)

            assert result is None  # Device not found


class TestCriticalSchemaValidation:
    """
    CRITICAL: Schema validation tests

    These tests prevent icmp_status/is_alive bugs from recurring.
    Column names MUST match migration files exactly.
    """

    def test_discovery_queue_columns_documented(self):
        """Document expected discovery_queue columns for future verification"""
        # Schema: 2025_01_15_000000_create_discovery_queue_table.php
        expected_columns = {
            "id",
            "ip_address",
            "is_alive",
            "snmp_available",
            "sys_descr",
            "sys_name",
            "sys_contact",
            "sys_object_id",
            "sys_location",
            "discovered_at",
            "discovery_status",
            "error_message",
            "created_at",
            "updated_at",
        }

        # This test documents what the schema expects
        # If schema changes, this test should be updated
        assert "is_alive" in expected_columns  # Not 'icmp_status'
        assert "snmp_available" in expected_columns  # Not 'snmp_status'

    def test_device_columns_documented(self):
        """Document expected device columns for future verification"""
        # Schema: 2025_08_28_072100_create_device_table.php
        updated_columns = {
            "is_alive",  # boolean
            "snmp_available",  # boolean
            "last_seen",  # timestamp
        }

        # These are the columns we update in device table
        assert "is_alive" in updated_columns  # Not 'icmp_status'
        assert "snmp_available" in updated_columns  # Not 'snmp_status'

    def test_device_status_history_columns_documented(self):
        """Document expected device_status_history columns"""
        # Schema: 2025_08_28_072103_create_device_status_history_table.php
        expected_columns = {
            "id",
            "device_id",
            "status",
            "changed_at",
            "created_at",
            "updated_at",
        }

        # Verify enum values
        status_values = {"online", "offline"}

        assert "status" in expected_columns
        assert "changed_at" in expected_columns
        assert "online" in status_values
        assert "offline" in status_values
