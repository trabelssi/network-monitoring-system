"""
SNMP Polling Module

Handles SNMP queries for network device discovery.
Matches Laravel config/snmp.php OID definitions exactly.

Phase 2, Step 2: SNMP query functionality
Status: Written, NOT YET VERIFIED IN DOCKER
"""

import os
from typing import Dict, Optional, Any, List
from dataclasses import dataclass
from enum import Enum


class SNMPVersion(Enum):
    """SNMP protocol versions"""

    V1 = 0
    V2C = 1
    V3 = 3


@dataclass
class SNMPConfig:
    """
    SNMP configuration matching Laravel .env settings

    Matches config/snmp.php structure
    """

    community: str = "public"
    version: SNMPVersion = SNMPVersion.V2C
    timeout: int = 5  # seconds (converted from microseconds in PHP)
    retries: int = 3
    port: int = 161

    @classmethod
    def from_env(cls) -> "SNMPConfig":
        """Load configuration from environment variables"""
        version_str = os.getenv("SNMP_VERSION", "v2c").lower()
        version_map = {
            "v1": SNMPVersion.V1,
            "v2c": SNMPVersion.V2C,
            "v3": SNMPVersion.V3,
        }

        return cls(
            community=os.getenv("SNMP_COMMUNITY", "public"),
            version=version_map.get(version_str, SNMPVersion.V2C),
            timeout=int(os.getenv("SNMP_TIMEOUT", "5")),
            retries=int(os.getenv("SNMP_RETRIES", "3")),
            port=int(os.getenv("SNMP_PORT", "161")),
        )


class SNMPOIDs:
    """
    Standard SNMP OIDs

    CRITICAL: These MUST match config/snmp.php 'common_oids' exactly
    Verified against Laravel config on 2026-07-29
    """

    # System MIB (RFC 1213)
    SYSTEM_DESCRIPTION = "1.3.6.1.2.1.1.1.0"  # sysDescr
    SYSTEM_OBJECT_ID = "1.3.6.1.2.1.1.2.0"  # sysObjectID
    SYSTEM_UPTIME = "1.3.6.1.2.1.1.3.0"  # sysUpTime
    SYSTEM_CONTACT = "1.3.6.1.2.1.1.4.0"  # sysContact
    SYSTEM_NAME = "1.3.6.1.2.1.1.5.0"  # sysName
    SYSTEM_LOCATION = "1.3.6.1.2.1.1.6.0"  # sysLocation
    SYSTEM_SERVICES = "1.3.6.1.2.1.1.7.0"  # sysServices


@dataclass
class SNMPResult:
    """
    Result of SNMP query operation

    Matches the structure returned by SancellaDiscoveryService->querySNMP()
    """

    available: bool
    sys_descr: Optional[str] = None
    sys_name: Optional[str] = None
    sys_object_id: Optional[str] = None
    sys_contact: Optional[str] = None
    sys_location: Optional[str] = None
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database storage"""
        return {
            "available": self.available,
            "sys_descr": self.sys_descr,
            "sys_name": self.sys_name,
            "sys_object_id": self.sys_object_id,
            "sys_contact": self.sys_contact,
            "sys_location": self.sys_location,
            "error": self.error,
        }


class SNMPPoller:
    """
    SNMP polling client

    Replacement for PHP SNMP extension used in SancellaDiscoveryService
    Uses pysnmp library for SNMP operations
    """

    def __init__(self, config: Optional[SNMPConfig] = None):
        """
        Initialize SNMP poller

        Args:
            config: SNMP configuration (defaults to environment-based config)
        """
        self.config = config or SNMPConfig.from_env()

    def query_device(
        self, ip_address: str, community: Optional[str] = None
    ) -> SNMPResult:
        """
        Query SNMP device for system information

        Matches the behavior of SancellaDiscoveryService->querySNMP()

        Args:
            ip_address: Target device IP address
            community: SNMP community string (overrides config default)

        Returns:
            SNMPResult with device information or error

        Note:
            This method requires pysnmp to be installed and a reachable SNMP device.
            NOT YET VERIFIED - requires Docker environment for testing.
        """
        try:
            # Import pysnmp here to allow module import without library installed
            from pysnmp.hlapi import (
                getCmd,
                SnmpEngine,
                CommunityData,
                UdpTransportTarget,
                ContextData,
                ObjectType,
                ObjectIdentity,
            )

            # Use provided community or default from config
            community_str = community or self.config.community

            # Build SNMP GET request for all system OIDs
            oids_to_query = [
                ObjectType(ObjectIdentity(SNMPOIDs.SYSTEM_DESCRIPTION)),
                ObjectType(ObjectIdentity(SNMPOIDs.SYSTEM_NAME)),
                ObjectType(ObjectIdentity(SNMPOIDs.SYSTEM_OBJECT_ID)),
                ObjectType(ObjectIdentity(SNMPOIDs.SYSTEM_CONTACT)),
                ObjectType(ObjectIdentity(SNMPOIDs.SYSTEM_LOCATION)),
            ]

            # Execute SNMP GET
            error_indication, error_status, error_index, var_binds = next(
                getCmd(
                    SnmpEngine(),
                    CommunityData(community_str, mpModel=self.config.version.value),
                    UdpTransportTarget(
                        (ip_address, self.config.port),
                        timeout=self.config.timeout,
                        retries=self.config.retries,
                    ),
                    ContextData(),
                    *oids_to_query,
                )
            )

            # Check for errors
            if error_indication:
                return SNMPResult(
                    available=False, error=f"SNMP error: {error_indication}"
                )

            if error_status:
                return SNMPResult(
                    available=False,
                    error=f"SNMP error: {error_status.prettyPrint()} at {error_index}",
                )

            # Parse results
            values = [var_bind[1].prettyPrint() for var_bind in var_binds]

            return SNMPResult(
                available=True,
                sys_descr=self._clean_snmp_value(values[0]),
                sys_name=self._clean_snmp_value(values[1]),
                sys_object_id=self._clean_snmp_value(values[2]),
                sys_contact=self._clean_snmp_value(values[3]),
                sys_location=self._clean_snmp_value(values[4]),
            )

        except ImportError:
            return SNMPResult(available=False, error="pysnmp library not installed")
        except Exception as e:
            return SNMPResult(available=False, error=f"SNMP query failed: {str(e)}")

    def query_with_communities(
        self, ip_address: str, communities: Optional[List[str]] = None
    ) -> SNMPResult:
        """
        Try multiple SNMP community strings

        Matches Laravel config/snmp.php 'communities' array behavior

        Args:
            ip_address: Target device IP address
            communities: List of community strings to try (defaults to ['public', 'private'])

        Returns:
            SNMPResult from first successful query, or last error if all fail
        """
        if communities is None:
            communities = ["public", "private", "community"]

        last_result = None

        for community in communities:
            result = self.query_device(ip_address, community)
            if result.available:
                return result
            last_result = result

        # All communities failed - return last error
        return last_result or SNMPResult(
            available=False, error="No community strings provided"
        )

    @staticmethod
    def _clean_snmp_value(value: str) -> Optional[str]:
        """
        Clean SNMP response value

        Matches SancellaDiscoveryService->cleanSNMPValue() behavior:
        - Remove type indicators (STRING:, INTEGER:, OID:)
        - Strip quotes
        - Return None for empty values

        Args:
            value: Raw SNMP response string

        Returns:
            Cleaned string or None
        """
        if not value:
            return None

        # Remove common SNMP type prefixes
        cleaned = value
        for prefix in ["STRING: ", "INTEGER: ", "OID: ", "Hex-STRING: "]:
            if cleaned.startswith(prefix):
                cleaned = cleaned[len(prefix) :]

        # Strip quotes
        cleaned = cleaned.strip('"').strip("'")

        # Return None for empty strings
        return cleaned if cleaned else None


class DeviceClassifier:
    """
    Classify network devices based on sysDescr patterns

    Matches Laravel config/snmp.php 'device_patterns' definitions
    """

    # Device patterns from config/snmp.php (verified 2026-07-29)
    PATTERNS = {
        "cisco": {
            "patterns": ["cisco ios", "cisco nx-os", "cisco ios xe"],
            "vendor": "Cisco",
            "default_type": "router",
        },
        "juniper": {
            "patterns": ["juniper", "junos"],
            "vendor": "Juniper",
            "default_type": "router",
        },
        "fortinet": {
            "patterns": ["fortigate", "fortinet"],
            "vendor": "Fortinet",
            "default_type": "firewall",
        },
        "palo_alto": {
            "patterns": ["palo alto", "pan-os"],
            "vendor": "Palo Alto",
            "default_type": "firewall",
        },
        "hp": {
            "patterns": ["hp procurve", "hp officejet"],
            "vendor": "HP",
            "default_type": "switch",
        },
        "ubiquiti": {
            "patterns": ["ubiquiti", "airmax"],
            "vendor": "Ubiquiti",
            "default_type": "access_point",
        },
    }

    @classmethod
    def classify(cls, sys_descr: Optional[str]) -> Dict[str, Optional[str]]:
        """
        Classify device based on sysDescr string

        Args:
            sys_descr: SNMP sysDescr value

        Returns:
            Dict with 'vendor' and 'device_type' keys (or None if unknown)
        """
        if not sys_descr:
            return {"vendor": None, "device_type": None}

        sys_descr_lower = sys_descr.lower()

        for pattern_group in cls.PATTERNS.values():
            for pattern in pattern_group["patterns"]:
                if pattern in sys_descr_lower:
                    return {
                        "vendor": pattern_group["vendor"],
                        "device_type": pattern_group["default_type"],
                    }

        return {"vendor": None, "device_type": "unknown"}
