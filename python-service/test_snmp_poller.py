"""
Unit tests for SNMP polling module

Tests pure logic with mocked SNMP responses - no real devices or Docker needed.

Status: Written, NOT YET VERIFIED IN DOCKER
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from snmp_poller import (
    SNMPConfig,
    SNMPVersion,
    SNMPOIDs,
    SNMPResult,
    SNMPPoller,
    DeviceClassifier,
)


class TestSNMPConfig:
    """Test SNMP configuration"""

    def test_default_config(self):
        """Test default configuration values"""
        config = SNMPConfig()
        assert config.community == "public"
        assert config.version == SNMPVersion.V2C
        assert config.timeout == 5
        assert config.retries == 3
        assert config.port == 161

    def test_from_env_with_defaults(self, monkeypatch):
        """Test loading from environment with no vars set (uses defaults)"""
        # Clear any existing env vars
        for key in [
            "SNMP_COMMUNITY",
            "SNMP_VERSION",
            "SNMP_TIMEOUT",
            "SNMP_RETRIES",
            "SNMP_PORT",
        ]:
            monkeypatch.delenv(key, raising=False)

        config = SNMPConfig.from_env()
        assert config.community == "public"
        assert config.version == SNMPVersion.V2C

    def test_from_env_with_custom_values(self, monkeypatch):
        """Test loading custom values from environment"""
        monkeypatch.setenv("SNMP_COMMUNITY", "private")
        monkeypatch.setenv("SNMP_VERSION", "v1")
        monkeypatch.setenv("SNMP_TIMEOUT", "10")
        monkeypatch.setenv("SNMP_RETRIES", "5")
        monkeypatch.setenv("SNMP_PORT", "162")

        config = SNMPConfig.from_env()
        assert config.community == "private"
        assert config.version == SNMPVersion.V1
        assert config.timeout == 10
        assert config.retries == 5
        assert config.port == 162

    def test_version_mapping(self, monkeypatch):
        """Test SNMP version string to enum mapping"""
        test_cases = [
            ("v1", SNMPVersion.V1),
            ("v2c", SNMPVersion.V2C),
            ("V2C", SNMPVersion.V2C),  # Case insensitive
            ("v3", SNMPVersion.V3),
            ("invalid", SNMPVersion.V2C),  # Defaults to V2C
        ]

        for version_str, expected_enum in test_cases:
            monkeypatch.setenv("SNMP_VERSION", version_str)
            config = SNMPConfig.from_env()
            assert config.version == expected_enum


class TestSNMPOIDs:
    """Test OID definitions match Laravel config"""

    def test_oid_values_match_laravel(self):
        """
        CRITICAL: Verify OIDs match config/snmp.php exactly

        These values were verified against Laravel config on 2026-07-29
        """
        # Must match config/snmp.php 'common_oids' array
        assert SNMPOIDs.SYSTEM_DESCRIPTION == "1.3.6.1.2.1.1.1.0"
        assert SNMPOIDs.SYSTEM_OBJECT_ID == "1.3.6.1.2.1.1.2.0"
        assert SNMPOIDs.SYSTEM_UPTIME == "1.3.6.1.2.1.1.3.0"
        assert SNMPOIDs.SYSTEM_CONTACT == "1.3.6.1.2.1.1.4.0"
        assert SNMPOIDs.SYSTEM_NAME == "1.3.6.1.2.1.1.5.0"
        assert SNMPOIDs.SYSTEM_LOCATION == "1.3.6.1.2.1.1.6.0"
        assert SNMPOIDs.SYSTEM_SERVICES == "1.3.6.1.2.1.1.7.0"


class TestSNMPResult:
    """Test SNMP result dataclass"""

    def test_successful_result(self):
        """Test successful SNMP query result"""
        result = SNMPResult(
            available=True,
            sys_descr="Cisco IOS Software",
            sys_name="router-01",
            sys_object_id="1.3.6.1.4.1.9.1.1",
            sys_contact="admin@example.com",
            sys_location="Server Room A",
        )

        assert result.available is True
        assert result.error is None
        assert "Cisco" in result.sys_descr

    def test_failed_result(self):
        """Test failed SNMP query result"""
        result = SNMPResult(available=False, error="Connection timeout")

        assert result.available is False
        assert result.error == "Connection timeout"
        assert result.sys_descr is None

    def test_to_dict(self):
        """Test conversion to dictionary"""
        result = SNMPResult(available=True, sys_descr="Test Device", sys_name="test-01")

        data = result.to_dict()
        assert isinstance(data, dict)
        assert data["available"] is True
        assert data["sys_descr"] == "Test Device"
        assert data["sys_name"] == "test-01"
        assert data["sys_object_id"] is None


class TestSNMPPoller:
    """Test SNMP poller with mocked pysnmp"""

    def test_initialization_with_default_config(self):
        """Test poller initialization with default config"""
        poller = SNMPPoller()
        assert poller.config.community == "public"
        assert poller.config.version == SNMPVersion.V2C

    def test_initialization_with_custom_config(self):
        """Test poller initialization with custom config"""
        config = SNMPConfig(community="private", timeout=10)
        poller = SNMPPoller(config)
        assert poller.config.community == "private"
        assert poller.config.timeout == 10

    def test_clean_snmp_value_with_string_prefix(self):
        """Test cleaning SNMP values with STRING: prefix"""
        test_cases = [
            ('STRING: "Cisco IOS"', "Cisco IOS"),
            ("STRING: Router", "Router"),
            ('"Quoted Value"', "Quoted Value"),
            ("'Single Quotes'", "Single Quotes"),
            ("", None),
            (None, None),
        ]

        for input_val, expected in test_cases:
            result = SNMPPoller._clean_snmp_value(input_val)
            assert result == expected

    def test_clean_snmp_value_with_integer_prefix(self):
        """Test cleaning SNMP values with INTEGER: prefix"""
        assert SNMPPoller._clean_snmp_value("INTEGER: 42") == "42"
        assert SNMPPoller._clean_snmp_value("INTEGER: 0") == "0"

    def test_clean_snmp_value_with_oid_prefix(self):
        """Test cleaning SNMP values with OID: prefix"""
        assert SNMPPoller._clean_snmp_value("OID: 1.3.6.1.4.1.9") == "1.3.6.1.4.1.9"

    def test_clean_snmp_value_with_hex_prefix(self):
        """Test cleaning SNMP values with Hex-STRING: prefix"""
        assert SNMPPoller._clean_snmp_value("Hex-STRING: 48656C6C6F") == "48656C6C6F"

    @patch("snmp_poller.getCmd")
    def test_query_device_success(self, mock_getcmd):
        """Test successful SNMP query (mocked)"""
        # Mock successful SNMP response
        mock_varbind_1 = (Mock(), Mock(prettyPrint=lambda: "Cisco IOS Software"))
        mock_varbind_2 = (Mock(), Mock(prettyPrint=lambda: "router-01"))
        mock_varbind_3 = (Mock(), Mock(prettyPrint=lambda: "1.3.6.1.4.1.9.1.1"))
        mock_varbind_4 = (Mock(), Mock(prettyPrint=lambda: "admin@example.com"))
        mock_varbind_5 = (Mock(), Mock(prettyPrint=lambda: "Server Room A"))

        mock_getcmd.return_value = iter(
            [
                (
                    None,  # error_indication
                    None,  # error_status
                    None,  # error_index
                    [
                        mock_varbind_1,
                        mock_varbind_2,
                        mock_varbind_3,
                        mock_varbind_4,
                        mock_varbind_5,
                    ],
                )
            ]
        )

        poller = SNMPPoller()
        result = poller.query_device("192.168.1.1")

        assert result.available is True
        assert result.sys_descr == "Cisco IOS Software"
        assert result.sys_name == "router-01"
        assert result.sys_object_id == "1.3.6.1.4.1.9.1.1"
        assert result.sys_contact == "admin@example.com"
        assert result.sys_location == "Server Room A"
        assert result.error is None

    @patch("snmp_poller.getCmd")
    def test_query_device_with_error_indication(self, mock_getcmd):
        """Test SNMP query with error indication (mocked)"""
        mock_getcmd.return_value = iter(
            [
                (
                    "Request timeout",  # error_indication
                    None,
                    None,
                    [],
                )
            ]
        )

        poller = SNMPPoller()
        result = poller.query_device("192.168.1.1")

        assert result.available is False
        assert "Request timeout" in result.error

    @patch("snmp_poller.getCmd")
    def test_query_device_with_error_status(self, mock_getcmd):
        """Test SNMP query with error status (mocked)"""
        mock_error_status = Mock()
        mock_error_status.prettyPrint.return_value = "No such name"

        mock_getcmd.return_value = iter(
            [
                (
                    None,
                    mock_error_status,  # error_status
                    1,  # error_index
                    [],
                )
            ]
        )

        poller = SNMPPoller()
        result = poller.query_device("192.168.1.1")

        assert result.available is False
        assert "No such name" in result.error

    def test_query_device_without_pysnmp(self):
        """Test query when pysnmp is not installed"""
        # This will naturally fail to import pysnmp in query_device
        # and should return an error result
        poller = SNMPPoller()

        # We can't easily mock the import failure, so this test
        # documents the expected behavior
        # In real execution without pysnmp: result.error would be
        # "pysnmp library not installed"

    def test_query_with_communities_first_succeeds(self):
        """Test community string iteration when first succeeds"""
        poller = SNMPPoller()

        # Mock query_device to succeed on first community
        with patch.object(poller, "query_device") as mock_query:
            mock_query.return_value = SNMPResult(
                available=True, sys_descr="Test Device"
            )

            result = poller.query_with_communities("192.168.1.1", ["public", "private"])

            assert result.available is True
            assert mock_query.call_count == 1
            mock_query.assert_called_with("192.168.1.1", "public")

    def test_query_with_communities_second_succeeds(self):
        """Test community string iteration when second succeeds"""
        poller = SNMPPoller()

        with patch.object(poller, "query_device") as mock_query:
            # First call fails, second succeeds
            mock_query.side_effect = [
                SNMPResult(available=False, error="Auth failed"),
                SNMPResult(available=True, sys_descr="Test Device"),
            ]

            result = poller.query_with_communities("192.168.1.1", ["public", "private"])

            assert result.available is True
            assert mock_query.call_count == 2

    def test_query_with_communities_all_fail(self):
        """Test community string iteration when all fail"""
        poller = SNMPPoller()

        with patch.object(poller, "query_device") as mock_query:
            mock_query.return_value = SNMPResult(available=False, error="Auth failed")

            result = poller.query_with_communities(
                "192.168.1.1", ["public", "private", "community"]
            )

            assert result.available is False
            assert "Auth failed" in result.error
            assert mock_query.call_count == 3

    def test_query_with_default_communities(self):
        """Test using default community list"""
        poller = SNMPPoller()

        with patch.object(poller, "query_device") as mock_query:
            mock_query.return_value = SNMPResult(available=False)

            poller.query_with_communities("192.168.1.1")  # No communities specified

            # Should try: public, private, community
            assert mock_query.call_count == 3


class TestDeviceClassifier:
    """Test device classification based on sysDescr patterns"""

    def test_classify_cisco_device(self):
        """Test Cisco device classification"""
        test_cases = [
            "Cisco IOS Software, C2960 Software",
            "Cisco NX-OS System Software",
            "CISCO IOS XE Software, Catalyst",
        ]

        for sys_descr in test_cases:
            result = DeviceClassifier.classify(sys_descr)
            assert result["vendor"] == "Cisco"
            assert result["device_type"] == "router"

    def test_classify_juniper_device(self):
        """Test Juniper device classification"""
        test_cases = [
            "Juniper Networks, Inc. srx240h2",
            "JUNOS 12.1X46-D20.5",
        ]

        for sys_descr in test_cases:
            result = DeviceClassifier.classify(sys_descr)
            assert result["vendor"] == "Juniper"
            assert result["device_type"] == "router"

    def test_classify_fortinet_device(self):
        """Test Fortinet device classification"""
        test_cases = [
            "FortiGate-100D v5.2.4",
            "Fortinet FortiWiFi-60D",
        ]

        for sys_descr in test_cases:
            result = DeviceClassifier.classify(sys_descr)
            assert result["vendor"] == "Fortinet"
            assert result["device_type"] == "firewall"

    def test_classify_palo_alto_device(self):
        """Test Palo Alto device classification"""
        test_cases = [
            "Palo Alto Networks PA-220",
            "PAN-OS 8.1.0",
        ]

        for sys_descr in test_cases:
            result = DeviceClassifier.classify(sys_descr)
            assert result["vendor"] == "Palo Alto"
            assert result["device_type"] == "firewall"

    def test_classify_hp_device(self):
        """Test HP device classification"""
        test_cases = [
            "HP ProCurve Switch 2626",
            "HP Officejet Pro 8600",
        ]

        for sys_descr in test_cases:
            result = DeviceClassifier.classify(sys_descr)
            assert result["vendor"] == "HP"
            assert result["device_type"] == "switch"

    def test_classify_ubiquiti_device(self):
        """Test Ubiquiti device classification"""
        test_cases = [
            "Ubiquiti Networks UniFi AP AC Pro",
            "AirMax NanoStation M5",
        ]

        for sys_descr in test_cases:
            result = DeviceClassifier.classify(sys_descr)
            assert result["vendor"] == "Ubiquiti"
            assert result["device_type"] == "access_point"

    def test_classify_unknown_device(self):
        """Test unknown device classification"""
        test_cases = [
            "Unknown Manufacturer Device",
            "Generic Router v1.0",
            None,
            "",
        ]

        for sys_descr in test_cases:
            result = DeviceClassifier.classify(sys_descr)
            if sys_descr:
                assert result["device_type"] == "unknown"
            else:
                assert result["device_type"] is None
            assert result["vendor"] is None

    def test_pattern_matching_case_insensitive(self):
        """Test pattern matching is case-insensitive"""
        # Uppercase should still match
        result = DeviceClassifier.classify("CISCO IOS SOFTWARE")
        assert result["vendor"] == "Cisco"

        # Mixed case should still match
        result = DeviceClassifier.classify("JuNiPeR Networks")
        assert result["vendor"] == "Juniper"

    def test_patterns_match_laravel_config(self):
        """
        CRITICAL: Verify patterns match config/snmp.php exactly

        Patterns verified against Laravel config on 2026-07-29
        """
        assert "cisco ios" in DeviceClassifier.PATTERNS["cisco"]["patterns"]
        assert "cisco nx-os" in DeviceClassifier.PATTERNS["cisco"]["patterns"]
        assert "cisco ios xe" in DeviceClassifier.PATTERNS["cisco"]["patterns"]

        assert "juniper" in DeviceClassifier.PATTERNS["juniper"]["patterns"]
        assert "junos" in DeviceClassifier.PATTERNS["juniper"]["patterns"]

        assert "fortigate" in DeviceClassifier.PATTERNS["fortinet"]["patterns"]
        assert "fortinet" in DeviceClassifier.PATTERNS["fortinet"]["patterns"]

        assert "palo alto" in DeviceClassifier.PATTERNS["palo_alto"]["patterns"]
        assert "pan-os" in DeviceClassifier.PATTERNS["palo_alto"]["patterns"]

        assert "hp procurve" in DeviceClassifier.PATTERNS["hp"]["patterns"]
        assert "hp officejet" in DeviceClassifier.PATTERNS["hp"]["patterns"]

        assert "ubiquiti" in DeviceClassifier.PATTERNS["ubiquiti"]["patterns"]
        assert "airmax" in DeviceClassifier.PATTERNS["ubiquiti"]["patterns"]


class TestIntegrationScenarios:
    """Test realistic integration scenarios (still mocked)"""

    def test_successful_discovery_flow(self):
        """Test complete successful discovery flow"""
        poller = SNMPPoller()

        with patch.object(poller, "query_device") as mock_query:
            # Simulate successful SNMP response
            mock_query.return_value = SNMPResult(
                available=True,
                sys_descr="Cisco IOS Software, C3560 Software",
                sys_name="switch-floor-3",
                sys_object_id="1.3.6.1.4.1.9.1.516",
                sys_contact="network-admin@company.com",
                sys_location="Building A, Floor 3, IDF-3",
            )

            result = poller.query_device("192.168.3.10")

            # Verify SNMP data collected
            assert result.available is True
            assert result.sys_name == "switch-floor-3"

            # Classify the device
            classification = DeviceClassifier.classify(result.sys_descr)
            assert classification["vendor"] == "Cisco"
            assert classification["device_type"] == "router"

    def test_failed_discovery_with_fallback(self):
        """Test discovery failure with community fallback"""
        poller = SNMPPoller()

        with patch.object(poller, "query_device") as mock_query:
            # First two communities fail, third succeeds
            mock_query.side_effect = [
                SNMPResult(available=False, error="Timeout"),
                SNMPResult(available=False, error="Auth failed"),
                SNMPResult(available=True, sys_descr="HP ProCurve Switch"),
            ]

            result = poller.query_with_communities(
                "192.168.1.100", ["public", "private", "hp_community"]
            )

            assert result.available is True
            assert "HP" in result.sys_descr
