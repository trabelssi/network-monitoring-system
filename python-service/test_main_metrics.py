"""
Integration tests for /metrics endpoint in main.py

Phase 3, Step 1: Prometheus endpoint integration tests
Tests the FastAPI /metrics endpoint returns valid Prometheus format
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from metrics import MetricsUpdater


class TestMetricsEndpoint:
    """Test /metrics endpoint via FastAPI TestClient"""

    @pytest.fixture
    def client(self):
        """Create FastAPI test client"""
        return TestClient(app)

    def test_metrics_endpoint_exists(self, client):
        """Verify /metrics endpoint is accessible"""
        response = client.get("/metrics")
        assert response.status_code == 200

    def test_metrics_endpoint_content_type(self, client):
        """Verify /metrics returns correct content type"""
        response = client.get("/metrics")
        assert response.status_code == 200
        assert "text/plain" in response.headers["content-type"]
        assert "charset=utf-8" in response.headers["content-type"]

    def test_metrics_endpoint_returns_prometheus_format(self, client):
        """Verify /metrics returns valid Prometheus exposition format"""
        response = client.get("/metrics")
        assert response.status_code == 200

        content = response.text

        # Verify metric definitions are present
        assert "# HELP device_up" in content
        assert "# TYPE device_up gauge" in content
        assert "# HELP device_response_time_ms" in content
        assert "# TYPE device_response_time_ms gauge" in content
        assert "# HELP snmp_available" in content
        assert "# TYPE snmp_available gauge" in content
        assert "# HELP device_status_changes_total" in content
        assert "# TYPE device_status_changes_total counter" in content

    def test_metrics_endpoint_with_data(self, client):
        """Verify /metrics endpoint includes device data after metrics update"""
        # Update some metrics
        MetricsUpdater.update_device_metrics(
            device_id=100,
            hostname="test-endpoint-device",
            is_alive=True,
            response_time_ms=22.5,
            snmp_available_status=True,
        )

        # Fetch metrics
        response = client.get("/metrics")
        assert response.status_code == 200

        content = response.text

        # Verify device metrics are in output
        assert 'device_id="100"' in content
        assert 'hostname="test-endpoint-device"' in content
        assert "device_up" in content
        assert "device_response_time_ms" in content

    def test_metrics_endpoint_multiple_requests(self, client):
        """Verify /metrics endpoint can be called multiple times"""
        # First request
        response1 = client.get("/metrics")
        assert response1.status_code == 200

        # Second request
        response2 = client.get("/metrics")
        assert response2.status_code == 200

        # Both should succeed
        assert len(response1.text) > 0
        assert len(response2.text) > 0

    def test_metrics_endpoint_after_status_change(self, client):
        """Verify /metrics reflects status change counter increments"""
        device_id = 101
        hostname = "counter-test-device"

        # Increment counter
        MetricsUpdater.increment_status_change(device_id, hostname)

        # Fetch metrics
        response = client.get("/metrics")
        assert response.status_code == 200

        content = response.text

        # Verify counter is present
        assert f'device_id="{device_id}"' in content
        assert f'hostname="{hostname}"' in content
        assert "device_status_changes_total" in content

    def test_root_endpoint_still_works(self, client):
        """Verify root endpoint still works after adding /metrics"""
        response = client.get("/")
        assert response.status_code == 200
        assert "service" in response.json()

    def test_health_endpoint_still_works(self, client):
        """Verify health endpoint still works after adding /metrics"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "service" in data
        assert "status" in data
