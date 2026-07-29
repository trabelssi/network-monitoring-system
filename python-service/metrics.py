"""
Prometheus Metrics Module

Exposes device monitoring metrics in Prometheus format.
Metrics are updated in-memory during poll cycles (no separate polling loop).

Phase 3, Step 1: Prometheus instrumentation
Status: Written, NOT YET VERIFIED IN DOCKER
"""

from typing import Optional
from prometheus_client import Gauge, Counter, CollectorRegistry, generate_latest

# Create registry for all metrics
# Using a custom registry allows for better testing isolation
registry = CollectorRegistry()

# Device availability gauge (1=up, 0=down)
device_up = Gauge(
    "device_up",
    "Device availability status (1=up, 0=down)",
    ["device_id", "hostname"],
    registry=registry,
)

# Device response time gauge (milliseconds)
device_response_time_ms = Gauge(
    "device_response_time_ms",
    "Device ICMP response time in milliseconds",
    ["device_id", "hostname"],
    registry=registry,
)

# SNMP availability gauge (1=available, 0=unavailable)
snmp_available = Gauge(
    "snmp_available",
    "SNMP availability status (1=available, 0=unavailable)",
    ["device_id", "hostname"],
    registry=registry,
)

# Status change counter (increments on online/offline transitions)
device_status_changes_total = Counter(
    "device_status_changes_total",
    "Total number of device status changes (online/offline transitions)",
    ["device_id", "hostname"],
    registry=registry,
)


class MetricsUpdater:
    """
    Updates Prometheus metrics from device monitoring data

    Integrates with DeviceStatusWriter to track status changes.
    All metrics are updated in-memory during the same poll cycle that writes to DB.
    """

    @staticmethod
    def update_device_metrics(
        device_id: int,
        hostname: str,
        is_alive: bool,
        response_time_ms: Optional[float],
        snmp_available_status: Optional[bool] = None,
    ):
        """
        Update device metrics from poll cycle

        Args:
            device_id: Device ID
            hostname: Device hostname (for label)
            is_alive: Whether device is alive (ICMP response)
            response_time_ms: ICMP response time in milliseconds (None if down)
            snmp_available_status: SNMP availability (optional, None = no update)

        Note:
            This is called during the same cycle that writes to device_status_history.
            No separate polling loop - metrics updated alongside DB writes.
        """
        labels = {"device_id": str(device_id), "hostname": hostname}

        # Update device_up gauge (1=up, 0=down)
        device_up.labels(**labels).set(1 if is_alive else 0)

        # Update response_time_ms gauge (only if device is alive and RTT captured)
        if is_alive and response_time_ms is not None:
            device_response_time_ms.labels(**labels).set(response_time_ms)
        else:
            # Set to 0 or NaN when device is down?
            # Decision: Set to 0 to indicate "no response"
            # Grafana can filter out zeros or distinguish from actual 0ms RTT
            device_response_time_ms.labels(**labels).set(0)

        # Update snmp_available gauge (only if SNMP query was performed)
        if snmp_available_status is not None:
            snmp_available.labels(**labels).set(1 if snmp_available_status else 0)

    @staticmethod
    def increment_status_change(device_id: int, hostname: str):
        """
        Increment status change counter

        Args:
            device_id: Device ID
            hostname: Device hostname (for label)

        Note:
            Called by DeviceStatusWriter when a transition is written to
            device_status_history. Reuses the same status change detection logic.
        """
        labels = {"device_id": str(device_id), "hostname": hostname}
        device_status_changes_total.labels(**labels).inc()


def generate_metrics() -> bytes:
    """
    Generate Prometheus exposition format output

    Returns:
        Bytes containing all metrics in Prometheus text format

    Note:
        This is called by the /metrics endpoint.
        Uses the custom registry to isolate metrics for testing.
    """
    return generate_latest(registry)
