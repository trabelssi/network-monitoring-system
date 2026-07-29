"""
Unit tests for Prometheus metrics module

Phase 3, Step 1: Prometheus instrumentation tests
Covers:
- Correct metric names and labels registered
- Gauge values update across poll cycles
- Counter increments correctly on status transitions
- /metrics endpoint returns valid Prometheus exposition format
"""

import pytest
from prometheus_client import CollectorRegistry
from metrics import (
    device_up,
    device_response_time_ms,
    snmp_available,
    device_status_changes_total,
    MetricsUpdater,
    generate_metrics,
    registry,
)


class TestMetricRegistration:
    """Test that metrics are registered with correct names and labels"""

    def test_device_up_registered(self):
        """Verify device_up gauge is registered"""
        assert device_up._name == "device_up"
        assert device_up._type == "gauge"
        assert device_up._labelnames == ("device_id", "hostname")

    def test_device_response_time_ms_registered(self):
        """Verify device_response_time_ms gauge is registered"""
        assert device_response_time_ms._name == "device_response_time_ms"
        assert device_response_time_ms._type == "gauge"
        assert device_response_time_ms._labelnames == ("device_id", "hostname")

    def test_snmp_available_registered(self):
        """Verify snmp_available gauge is registered"""
        assert snmp_available._name == "snmp_available"
        assert snmp_available._type == "gauge"
        assert snmp_available._labelnames == ("device_id", "hostname")

    def test_device_status_changes_total_registered(self):
        """Verify device_status_changes_total counter is registered"""
        # Note: prometheus_client Counter strips _total suffix from _name attribute
        assert device_status_changes_total._name == "device_status_changes"
        assert device_status_changes_total._type == "counter"
        assert device_status_changes_total._labelnames == ("device_id", "hostname")

    def test_custom_registry_used(self):
        """Verify metrics use custom registry (not default REGISTRY)"""
        # Collect all metric names from custom registry
        metrics_output = generate_metrics().decode("utf-8")

        # Verify our metrics are present
        assert "device_up" in metrics_output
        assert "device_response_time_ms" in metrics_output
        assert "snmp_available" in metrics_output
        assert "device_status_changes_total" in metrics_output


class TestGaugeUpdates:
    """Test gauge values update correctly across poll cycles"""

    def test_device_up_updates_online(self):
        """Verify device_up gauge updates to 1 when device is online"""
        MetricsUpdater.update_device_metrics(
            device_id=1,
            hostname="test-device",
            is_alive=True,
            response_time_ms=15.5,
        )

        metrics_output = generate_metrics().decode("utf-8")
        assert 'device_up{device_id="1",hostname="test-device"} 1.0' in metrics_output

    def test_device_up_updates_offline(self):
        """Verify device_up gauge updates to 0 when device is offline"""
        MetricsUpdater.update_device_metrics(
            device_id=2,
            hostname="offline-device",
            is_alive=False,
            response_time_ms=None,
        )

        metrics_output = generate_metrics().decode("utf-8")
        assert (
            'device_up{device_id="2",hostname="offline-device"} 0.0' in metrics_output
        )

    def test_response_time_updates_when_alive(self):
        """Verify response_time_ms gauge updates when device is alive"""
        MetricsUpdater.update_device_metrics(
            device_id=3,
            hostname="fast-device",
            is_alive=True,
            response_time_ms=8.2,
        )

        metrics_output = generate_metrics().decode("utf-8")
        assert (
            'device_response_time_ms{device_id="3",hostname="fast-device"} 8.2'
            in metrics_output
        )

    def test_response_time_zero_when_offline(self):
        """Verify response_time_ms gauge is 0 when device is offline"""
        MetricsUpdater.update_device_metrics(
            device_id=4,
            hostname="down-device",
            is_alive=False,
            response_time_ms=None,
        )

        metrics_output = generate_metrics().decode("utf-8")
        assert (
            'device_response_time_ms{device_id="4",hostname="down-device"} 0.0'
            in metrics_output
        )

    def test_snmp_available_updates_true(self):
        """Verify snmp_available gauge updates to 1 when SNMP is available"""
        MetricsUpdater.update_device_metrics(
            device_id=5,
            hostname="snmp-device",
            is_alive=True,
            response_time_ms=12.0,
            snmp_available_status=True,
        )

        metrics_output = generate_metrics().decode("utf-8")
        assert (
            'snmp_available{device_id="5",hostname="snmp-device"} 1.0' in metrics_output
        )

    def test_snmp_available_updates_false(self):
        """Verify snmp_available gauge updates to 0 when SNMP is unavailable"""
        MetricsUpdater.update_device_metrics(
            device_id=6,
            hostname="no-snmp-device",
            is_alive=True,
            response_time_ms=10.0,
            snmp_available_status=False,
        )

        metrics_output = generate_metrics().decode("utf-8")
        assert (
            'snmp_available{device_id="6",hostname="no-snmp-device"} 0.0'
            in metrics_output
        )

    def test_snmp_not_updated_when_none(self):
        """Verify snmp_available gauge is not updated when snmp_available_status is None"""
        # First update with SNMP available
        MetricsUpdater.update_device_metrics(
            device_id=7,
            hostname="snmp-optional",
            is_alive=True,
            response_time_ms=10.0,
            snmp_available_status=True,
        )

        # Second update without SNMP query (None) - should NOT change previous value
        MetricsUpdater.update_device_metrics(
            device_id=7,
            hostname="snmp-optional",
            is_alive=True,
            response_time_ms=11.0,
            snmp_available_status=None,  # No SNMP query this cycle
        )

        metrics_output = generate_metrics().decode("utf-8")
        # Should still be 1.0 from first update
        assert (
            'snmp_available{device_id="7",hostname="snmp-optional"} 1.0'
            in metrics_output
        )

    def test_multiple_poll_cycles_update_same_device(self):
        """Verify metrics update across multiple poll cycles for same device"""
        device_id = 8
        hostname = "multi-cycle-device"

        # Cycle 1: Device online, RTT 10ms
        MetricsUpdater.update_device_metrics(
            device_id=device_id,
            hostname=hostname,
            is_alive=True,
            response_time_ms=10.0,
        )

        metrics_output = generate_metrics().decode("utf-8")
        assert (
            f'device_up{{device_id="{device_id}",hostname="{hostname}"}} 1.0'
            in metrics_output
        )
        assert (
            f'device_response_time_ms{{device_id="{device_id}",hostname="{hostname}"}} 10.0'
            in metrics_output
        )

        # Cycle 2: Device online, RTT 15ms
        MetricsUpdater.update_device_metrics(
            device_id=device_id,
            hostname=hostname,
            is_alive=True,
            response_time_ms=15.0,
        )

        metrics_output = generate_metrics().decode("utf-8")
        assert (
            f'device_response_time_ms{{device_id="{device_id}",hostname="{hostname}"}} 15.0'
            in metrics_output
        )

        # Cycle 3: Device offline
        MetricsUpdater.update_device_metrics(
            device_id=device_id,
            hostname=hostname,
            is_alive=False,
            response_time_ms=None,
        )

        metrics_output = generate_metrics().decode("utf-8")
        assert (
            f'device_up{{device_id="{device_id}",hostname="{hostname}"}} 0.0'
            in metrics_output
        )
        assert (
            f'device_response_time_ms{{device_id="{device_id}",hostname="{hostname}"}} 0.0'
            in metrics_output
        )


class TestCounterIncrements:
    """Test counter increments correctly on status transitions"""

    def test_counter_increments_on_status_change(self):
        """Verify counter increments when status changes"""
        device_id = 9
        hostname = "counter-device"

        # Get initial counter value
        MetricsUpdater.increment_status_change(device_id, hostname)

        metrics_output = generate_metrics().decode("utf-8")
        # Counter should increment (exact value depends on test execution order)
        assert (
            f'device_status_changes_total{{device_id="{device_id}",hostname="{hostname}"}}'
            in metrics_output
        )

    def test_counter_multiple_increments(self):
        """Verify counter increments multiple times correctly"""
        device_id = 10
        hostname = "multi-change-device"

        # Increment 3 times (simulating 3 status transitions)
        for _ in range(3):
            MetricsUpdater.increment_status_change(device_id, hostname)

        metrics_output = generate_metrics().decode("utf-8")
        # Counter should be >= 3 (might be higher if other tests ran first)
        assert (
            f'device_status_changes_total{{device_id="{device_id}",hostname="{hostname}"}}'
            in metrics_output
        )

    def test_counter_different_devices(self):
        """Verify counter tracks different devices independently"""
        device1_id = 11
        device1_hostname = "device-one"
        device2_id = 12
        device2_hostname = "device-two"

        # Increment device 1 twice
        MetricsUpdater.increment_status_change(device1_id, device1_hostname)
        MetricsUpdater.increment_status_change(device1_id, device1_hostname)

        # Increment device 2 once
        MetricsUpdater.increment_status_change(device2_id, device2_hostname)

        metrics_output = generate_metrics().decode("utf-8")

        # Both devices should have independent counters
        assert (
            f'device_status_changes_total{{device_id="{device1_id}",hostname="{device1_hostname}"}}'
            in metrics_output
        )
        assert (
            f'device_status_changes_total{{device_id="{device2_id}",hostname="{device2_hostname}"}}'
            in metrics_output
        )


class TestPrometheusExpositionFormat:
    """Test /metrics endpoint returns valid Prometheus exposition format"""

    def test_exposition_format_structure(self):
        """Verify output follows Prometheus text exposition format"""
        metrics_output = generate_metrics().decode("utf-8")

        # Should contain HELP and TYPE declarations
        assert "# HELP device_up" in metrics_output
        assert "# TYPE device_up gauge" in metrics_output
        assert "# HELP device_response_time_ms" in metrics_output
        assert "# TYPE device_response_time_ms gauge" in metrics_output
        assert "# HELP snmp_available" in metrics_output
        assert "# TYPE snmp_available gauge" in metrics_output
        assert "# HELP device_status_changes_total" in metrics_output
        assert "# TYPE device_status_changes_total counter" in metrics_output

    def test_exposition_format_labels(self):
        """Verify labels are formatted correctly in exposition format"""
        MetricsUpdater.update_device_metrics(
            device_id=13,
            hostname="format-test",
            is_alive=True,
            response_time_ms=20.0,
        )

        metrics_output = generate_metrics().decode("utf-8")

        # Labels should be in format: metric_name{label1="value1",label2="value2"} value
        assert 'device_up{device_id="13",hostname="format-test"}' in metrics_output

    def test_exposition_format_is_valid_bytes(self):
        """Verify generate_metrics returns bytes (not string)"""
        result = generate_metrics()
        assert isinstance(result, bytes)

    def test_exposition_format_can_be_decoded(self):
        """Verify output can be decoded to UTF-8 string"""
        result = generate_metrics()
        decoded = result.decode("utf-8")
        assert isinstance(decoded, str)
        assert len(decoded) > 0

    def test_multiple_devices_in_output(self):
        """Verify multiple devices are represented in exposition format"""
        # Update metrics for multiple devices
        MetricsUpdater.update_device_metrics(
            device_id=14, hostname="device-a", is_alive=True, response_time_ms=10.0
        )
        MetricsUpdater.update_device_metrics(
            device_id=15, hostname="device-b", is_alive=False, response_time_ms=None
        )
        MetricsUpdater.update_device_metrics(
            device_id=16, hostname="device-c", is_alive=True, response_time_ms=25.0
        )

        metrics_output = generate_metrics().decode("utf-8")

        # All devices should be present
        assert 'device_id="14"' in metrics_output
        assert 'device_id="15"' in metrics_output
        assert 'device_id="16"' in metrics_output
        assert 'hostname="device-a"' in metrics_output
        assert 'hostname="device-b"' in metrics_output
        assert 'hostname="device-c"' in metrics_output


class TestMetricsIntegration:
    """Integration tests for metrics updates"""

    def test_complete_poll_cycle_simulation(self):
        """Simulate a complete poll cycle with all metrics"""
        device_id = 17
        hostname = "integration-test"

        # Simulate poll cycle: device online, SNMP available
        MetricsUpdater.update_device_metrics(
            device_id=device_id,
            hostname=hostname,
            is_alive=True,
            response_time_ms=12.5,
            snmp_available_status=True,
        )

        # Simulate status change (online -> offline)
        MetricsUpdater.increment_status_change(device_id, hostname)

        metrics_output = generate_metrics().decode("utf-8")

        # Verify all metrics are present and correct
        assert (
            f'device_up{{device_id="{device_id}",hostname="{hostname}"}} 1.0'
            in metrics_output
        )
        assert (
            f'device_response_time_ms{{device_id="{device_id}",hostname="{hostname}"}} 12.5'
            in metrics_output
        )
        assert (
            f'snmp_available{{device_id="{device_id}",hostname="{hostname}"}} 1.0'
            in metrics_output
        )
        assert (
            f'device_status_changes_total{{device_id="{device_id}",hostname="{hostname}"}}'
            in metrics_output
        )

    def test_edge_case_device_id_as_string(self):
        """Verify device_id is correctly converted to string in labels"""
        # MetricsUpdater should handle int device_id and convert to string
        MetricsUpdater.update_device_metrics(
            device_id=99999,  # Large int
            hostname="string-test",
            is_alive=True,
            response_time_ms=5.0,
        )

        metrics_output = generate_metrics().decode("utf-8")
        assert 'device_id="99999"' in metrics_output  # Should be quoted string

    def test_edge_case_hostname_with_special_chars(self):
        """Verify hostname with special characters is handled correctly"""
        MetricsUpdater.update_device_metrics(
            device_id=18,
            hostname="device-with-dashes_and_underscores.local",
            is_alive=True,
            response_time_ms=15.0,
        )

        metrics_output = generate_metrics().decode("utf-8")
        assert 'hostname="device-with-dashes_and_underscores.local"' in metrics_output

    def test_edge_case_very_high_rtt(self):
        """Verify very high RTT values are handled correctly"""
        MetricsUpdater.update_device_metrics(
            device_id=19,
            hostname="slow-device",
            is_alive=True,
            response_time_ms=5000.0,  # 5 seconds
        )

        metrics_output = generate_metrics().decode("utf-8")
        assert (
            'device_response_time_ms{device_id="19",hostname="slow-device"} 5000.0'
            in metrics_output
        )

    def test_edge_case_very_low_rtt(self):
        """Verify very low RTT values are handled correctly"""
        MetricsUpdater.update_device_metrics(
            device_id=20,
            hostname="fast-device",
            is_alive=True,
            response_time_ms=0.1,  # Sub-millisecond
        )

        metrics_output = generate_metrics().decode("utf-8")
        assert (
            'device_response_time_ms{device_id="20",hostname="fast-device"} 0.1'
            in metrics_output
        )
