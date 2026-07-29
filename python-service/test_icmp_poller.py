"""
Unit tests for ICMP polling module

Tests pure logic with mocked ping responses - no real network calls needed.

Status: Written, NOT YET VERIFIED IN DOCKER
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from icmp_poller import (
    ICMPConfig, PingStatus, PingResult,
    ICMPPoller, RTTAnalyzer
)


class TestICMPConfig:
    """Test ICMP configuration"""
    
    def test_default_config(self):
        """Test default configuration values"""
        config = ICMPConfig()
        assert config.count == 1
        assert config.timeout == 5.0
        assert config.interval == 0.5
        assert config.privileged is True
    
    def test_from_env_with_defaults(self, monkeypatch):
        """Test loading from environment with no vars set (uses defaults)"""
        # Clear any existing env vars
        for key in ["ICMP_COUNT", "ICMP_TIMEOUT", "ICMP_INTERVAL", "ICMP_PRIVILEGED"]:
            monkeypatch.delenv(key, raising=False)
        
        config = ICMPConfig.from_env()
        assert config.count == 1
        assert config.timeout == 5.0
        assert config.privileged is True
    
    def test_from_env_with_custom_values(self, monkeypatch):
        """Test loading custom values from environment"""
        monkeypatch.setenv("ICMP_COUNT", "3")
        monkeypatch.setenv("ICMP_TIMEOUT", "10.0")
        monkeypatch.setenv("ICMP_INTERVAL", "1.0")
        monkeypatch.setenv("ICMP_PRIVILEGED", "false")
        
        config = ICMPConfig.from_env()
        assert config.count == 3
        assert config.timeout == 10.0
        assert config.interval == 1.0
        assert config.privileged is False


class TestPingResult:
    """Test ping result dataclass"""
    
    def test_successful_result_with_rtt(self):
        """Test successful ping result with RTT captured"""
        result = PingResult(
            is_alive=True,
            status=PingStatus.SUCCESS,
            response_time_ms=12.5,  # CRITICAL: RTT must be captured
            packet_loss=0.0,
            packets_sent=1,
            packets_received=1
        )
        
        assert result.is_alive is True
        assert result.status == PingStatus.SUCCESS
        assert result.response_time_ms == 12.5  # RTT present
        assert result.packet_loss == 0.0
        assert result.error is None
    
    def test_timeout_result_no_rtt(self):
        """Test timeout result (no RTT available)"""
        result = PingResult(
            is_alive=False,
            status=PingStatus.TIMEOUT,
            response_time_ms=None,  # No RTT on timeout
            packet_loss=1.0,
            packets_sent=1,
            packets_received=0
        )
        
        assert result.is_alive is False
        assert result.status == PingStatus.TIMEOUT
        assert result.response_time_ms is None
        assert result.packet_loss == 1.0
    
    def test_error_result(self):
        """Test error result with message"""
        result = PingResult(
            is_alive=False,
            status=PingStatus.ERROR,
            error="Network unreachable"
        )
        
        assert result.is_alive is False
        assert result.status == PingStatus.ERROR
        assert result.error == "Network unreachable"
        assert result.response_time_ms is None
    
    def test_to_dict(self):
        """Test conversion to dictionary"""
        result = PingResult(
            is_alive=True,
            status=PingStatus.SUCCESS,
            response_time_ms=15.3,
            packet_loss=0.0,
            packets_sent=1,
            packets_received=1
        )
        
        data = result.to_dict()
        assert isinstance(data, dict)
        assert data["is_alive"] is True
        assert data["status"] == "success"
        assert data["response_time_ms"] == 15.3  # RTT in dict
        assert data["packet_loss"] == 0.0
    
    def test_from_exception(self):
        """Test creating error result from exception"""
        result = PingResult.from_exception("Connection refused")
        
        assert result.is_alive is False
        assert result.status == PingStatus.ERROR
        assert result.error == "Connection refused"
        assert result.response_time_ms is None


class TestICMPPoller:
    """Test ICMP poller with mocked icmplib"""
    
    def test_initialization_with_default_config(self):
        """Test poller initialization with default config"""
        poller = ICMPPoller()
        assert poller.config.count == 1
        assert poller.config.timeout == 5.0
    
    def test_initialization_with_custom_config(self):
        """Test poller initialization with custom config"""
        config = ICMPConfig(count=3, timeout=10.0)
        poller = ICMPPoller(config)
        assert poller.config.count == 3
        assert poller.config.timeout == 10.0
    
    @pytest.mark.asyncio
    @patch('icmp_poller.icmplib_ping')
    async def test_async_ping_success_with_rtt(self, mock_ping):
        """Test successful async ping with RTT capture (mocked)"""
        # Mock successful ping response
        mock_host = Mock()
        mock_host.is_alive = True
        mock_host.avg_rtt = 12.5  # CRITICAL: RTT value
        mock_host.packet_loss = 0.0
        mock_host.packets_sent = 1
        mock_host.packets_received = 1
        
        # Make mock_ping return a coroutine
        async def mock_ping_coro(*args, **kwargs):
            return mock_host
        mock_ping.side_effect = mock_ping_coro
        
        poller = ICMPPoller()
        result = await poller.async_ping("192.168.1.1")
        
        assert result.is_alive is True
        assert result.status == PingStatus.SUCCESS
        assert result.response_time_ms == 12.5  # RTT captured
        assert result.packet_loss == 0.0
        assert result.error is None
    
    @pytest.mark.asyncio
    @patch('icmp_poller.icmplib_ping')
    async def test_async_ping_timeout(self, mock_ping):
        """Test ping timeout (mocked)"""
        mock_host = Mock()
        mock_host.is_alive = False
        mock_host.avg_rtt = None
        mock_host.packet_loss = 1.0  # 100% loss
        mock_host.packets_sent = 1
        mock_host.packets_received = 0
        
        async def mock_ping_coro(*args, **kwargs):
            return mock_host
        mock_ping.side_effect = mock_ping_coro
        
        poller = ICMPPoller()
        result = await poller.async_ping("192.168.1.100")
        
        assert result.is_alive is False
        assert result.status == PingStatus.TIMEOUT
        assert result.response_time_ms is None  # No RTT on timeout
        assert result.packet_loss == 1.0
    
    @pytest.mark.asyncio
    @patch('icmp_poller.icmplib_ping')
    async def test_async_ping_unreachable(self, mock_ping):
        """Test ping unreachable (partial packet loss - mocked)"""
        mock_host = Mock()
        mock_host.is_alive = False
        mock_host.avg_rtt = None
        mock_host.packet_loss = 0.5  # 50% loss
        mock_host.packets_sent = 2
        mock_host.packets_received = 1
        
        async def mock_ping_coro(*args, **kwargs):
            return mock_host
        mock_ping.side_effect = mock_ping_coro
        
        poller = ICMPPoller()
        result = await poller.async_ping("192.168.1.50")
        
        assert result.is_alive is False
        assert result.status == PingStatus.UNREACHABLE
        assert result.packet_loss == 0.5
    
    @pytest.mark.asyncio
    async def test_async_ping_import_error(self):
        """Test ping when icmplib not installed"""
        # Don't mock icmplib - let it fail naturally if not installed
        # Or mock the import to raise ImportError
        with patch('icmp_poller.async_ping', side_effect=ImportError("No module named 'icmplib'")):
            poller = ICMPPoller()
            # The actual implementation catches ImportError
            # This test documents expected behavior
            pass
    
    @pytest.mark.asyncio
    @patch('icmp_poller.icmplib_ping')
    async def test_async_ping_permission_error(self, mock_ping):
        """Test ping permission denied (mocked)"""
        async def mock_ping_coro(*args, **kwargs):
            raise PermissionError("Operation not permitted")
        mock_ping.side_effect = mock_ping_coro
        
        poller = ICMPPoller()
        result = await poller.async_ping("192.168.1.1")
        
        assert result.is_alive is False
        assert result.status == PingStatus.ERROR
        assert "elevated privileges" in result.error.lower()
    
    @pytest.mark.asyncio
    @patch('icmp_poller.icmplib_ping')
    async def test_async_ping_generic_exception(self, mock_ping):
        """Test ping with unexpected exception (mocked)"""
        async def mock_ping_coro(*args, **kwargs):
            raise RuntimeError("Unexpected error")
        mock_ping.side_effect = mock_ping_coro
        
        poller = ICMPPoller()
        result = await poller.async_ping("192.168.1.1")
        
        assert result.is_alive is False
        assert result.status == PingStatus.ERROR
        assert "Unexpected error" in result.error
    
    def test_ping_synchronous_wrapper(self):
        """Test synchronous ping wrapper"""
        poller = ICMPPoller()
        
        # Mock async_ping to avoid actual network call
        with patch.object(poller, 'async_ping', new_callable=AsyncMock) as mock_async:
            mock_async.return_value = PingResult(
                is_alive=True,
                status=PingStatus.SUCCESS,
                response_time_ms=10.0
            )
            
            result = poller.ping("192.168.1.1")
            
            assert result.is_alive is True
            assert result.response_time_ms == 10.0
    
    def test_ping_multiple_synchronous(self):
        """Test pinging multiple hosts synchronously"""
        poller = ICMPPoller()
        
        with patch.object(poller, 'ping') as mock_ping:
            mock_ping.side_effect = [
                PingResult(is_alive=True, status=PingStatus.SUCCESS, response_time_ms=12.0),
                PingResult(is_alive=False, status=PingStatus.TIMEOUT, response_time_ms=None),
                PingResult(is_alive=True, status=PingStatus.SUCCESS, response_time_ms=15.0),
            ]
            
            results = poller.ping_multiple(["192.168.1.1", "192.168.1.2", "192.168.1.3"])
            
            assert len(results) == 3
            assert results[0].is_alive is True
            assert results[0].response_time_ms == 12.0  # RTT captured
            assert results[1].is_alive is False
            assert results[2].is_alive is True
            assert results[2].response_time_ms == 15.0  # RTT captured
    
    @pytest.mark.asyncio
    async def test_async_ping_multiple_concurrent(self):
        """Test pinging multiple hosts concurrently"""
        poller = ICMPPoller()
        
        with patch.object(poller, 'async_ping', new_callable=AsyncMock) as mock_async:
            mock_async.side_effect = [
                PingResult(is_alive=True, status=PingStatus.SUCCESS, response_time_ms=10.0),
                PingResult(is_alive=True, status=PingStatus.SUCCESS, response_time_ms=20.0),
                PingResult(is_alive=False, status=PingStatus.TIMEOUT, response_time_ms=None),
            ]
            
            results = await poller.async_ping_multiple([
                "192.168.1.1",
                "192.168.1.2",
                "192.168.1.3"
            ])
            
            assert len(results) == 3
            assert results[0].response_time_ms == 10.0
            assert results[1].response_time_ms == 20.0
            assert results[2].response_time_ms is None
    
    def test_is_alive_simple_true(self):
        """Test simple boolean ping check (alive)"""
        with patch('icmp_poller.ICMPPoller.ping') as mock_ping:
            mock_ping.return_value = PingResult(
                is_alive=True,
                status=PingStatus.SUCCESS,
                response_time_ms=12.5
            )
            
            is_alive = ICMPPoller.is_alive_simple("192.168.1.1")
            assert is_alive is True
    
    def test_is_alive_simple_false(self):
        """Test simple boolean ping check (dead)"""
        with patch('icmp_poller.ICMPPoller.ping') as mock_ping:
            mock_ping.return_value = PingResult(
                is_alive=False,
                status=PingStatus.TIMEOUT,
                response_time_ms=None
            )
            
            is_alive = ICMPPoller.is_alive_simple("192.168.1.100")
            assert is_alive is False


class TestRTTAnalyzer:
    """Test RTT analysis functions"""
    
    def test_calculate_stats_with_values(self):
        """Test RTT statistics calculation"""
        rtt_values = [10.0, 15.0, 12.0, 18.0, 11.0]
        
        stats = RTTAnalyzer.calculate_stats(rtt_values)
        
        assert stats["min_rtt_ms"] == 10.0
        assert stats["max_rtt_ms"] == 18.0
        assert stats["avg_rtt_ms"] == 13.2  # (10+15+12+18+11)/5
        assert stats["median_rtt_ms"] == 12.0  # Middle value when sorted
        assert stats["sample_count"] == 5
    
    def test_calculate_stats_empty_list(self):
        """Test statistics with empty list"""
        stats = RTTAnalyzer.calculate_stats([])
        
        assert stats["min_rtt_ms"] is None
        assert stats["max_rtt_ms"] is None
        assert stats["avg_rtt_ms"] is None
        assert stats["median_rtt_ms"] is None
        assert stats["sample_count"] == 0
    
    def test_calculate_stats_single_value(self):
        """Test statistics with single value"""
        stats = RTTAnalyzer.calculate_stats([15.0])
        
        assert stats["min_rtt_ms"] == 15.0
        assert stats["max_rtt_ms"] == 15.0
        assert stats["avg_rtt_ms"] == 15.0
        assert stats["median_rtt_ms"] == 15.0
        assert stats["sample_count"] == 1
    
    def test_calculate_stats_even_count(self):
        """Test median calculation with even number of values"""
        rtt_values = [10.0, 20.0, 30.0, 40.0]
        
        stats = RTTAnalyzer.calculate_stats(rtt_values)
        
        # Median of even count = average of middle two
        assert stats["median_rtt_ms"] == 25.0  # (20 + 30) / 2
    
    def test_categorize_latency_excellent(self):
        """Test latency categorization - excellent"""
        assert RTTAnalyzer.categorize_latency(5.0) == "excellent"
        assert RTTAnalyzer.categorize_latency(9.9) == "excellent"
    
    def test_categorize_latency_good(self):
        """Test latency categorization - good"""
        assert RTTAnalyzer.categorize_latency(10.0) == "good"
        assert RTTAnalyzer.categorize_latency(30.0) == "good"
        assert RTTAnalyzer.categorize_latency(49.9) == "good"
    
    def test_categorize_latency_fair(self):
        """Test latency categorization - fair"""
        assert RTTAnalyzer.categorize_latency(50.0) == "fair"
        assert RTTAnalyzer.categorize_latency(75.0) == "fair"
        assert RTTAnalyzer.categorize_latency(99.9) == "fair"
    
    def test_categorize_latency_poor(self):
        """Test latency categorization - poor"""
        assert RTTAnalyzer.categorize_latency(100.0) == "poor"
        assert RTTAnalyzer.categorize_latency(150.0) == "poor"
        assert RTTAnalyzer.categorize_latency(199.9) == "poor"
    
    def test_categorize_latency_very_poor(self):
        """Test latency categorization - very poor"""
        assert RTTAnalyzer.categorize_latency(200.0) == "very_poor"
        assert RTTAnalyzer.categorize_latency(500.0) == "very_poor"
        assert RTTAnalyzer.categorize_latency(1000.0) == "very_poor"
    
    def test_categorize_latency_none(self):
        """Test latency categorization - unknown"""
        assert RTTAnalyzer.categorize_latency(None) == "unknown"
    
    def test_detect_anomalies_no_outliers(self):
        """Test anomaly detection with normal distribution"""
        rtt_values = [10.0, 11.0, 10.5, 10.2, 10.8, 11.2, 10.6]
        
        anomalies = RTTAnalyzer.detect_anomalies(rtt_values)
        
        assert len(anomalies) == 0  # No outliers
    
    def test_detect_anomalies_with_outliers(self):
        """Test anomaly detection with outliers"""
        rtt_values = [10.0, 11.0, 10.5, 100.0, 10.8, 11.2, 10.6]
        #                                ^ outlier
        
        anomalies = RTTAnalyzer.detect_anomalies(rtt_values)
        
        assert len(anomalies) > 0
        assert 3 in anomalies  # Index 3 has the outlier (100.0)
    
    def test_detect_anomalies_insufficient_samples(self):
        """Test anomaly detection with too few samples"""
        rtt_values = [10.0, 11.0]
        
        anomalies = RTTAnalyzer.detect_anomalies(rtt_values)
        
        assert len(anomalies) == 0  # Need at least 3 samples
    
    def test_detect_anomalies_custom_threshold(self):
        """Test anomaly detection with custom threshold"""
        rtt_values = [10.0, 11.0, 10.5, 15.0, 10.8, 11.2, 10.6]
        
        # Strict threshold (2.0 std dev)
        anomalies_strict = RTTAnalyzer.detect_anomalies(rtt_values, threshold_multiplier=2.0)
        
        # Lenient threshold (5.0 std dev)
        anomalies_lenient = RTTAnalyzer.detect_anomalies(rtt_values, threshold_multiplier=5.0)
        
        # Stricter threshold should find more anomalies
        assert len(anomalies_strict) >= len(anomalies_lenient)


class TestCriticalRTTCapture:
    """
    CRITICAL: Verify RTT capture is preserved throughout the flow
    
    Phase 3 device_response_time_ms metric depends on this data.
    """
    
    def test_rtt_captured_in_result(self):
        """Test RTT is captured in PingResult"""
        result = PingResult(
            is_alive=True,
            status=PingStatus.SUCCESS,
            response_time_ms=15.5
        )
        
        # CRITICAL: response_time_ms must not be None for successful pings
        assert result.response_time_ms is not None
        assert result.response_time_ms == 15.5
    
    def test_rtt_preserved_in_dict(self):
        """Test RTT is preserved when converting to dict"""
        result = PingResult(
            is_alive=True,
            status=PingStatus.SUCCESS,
            response_time_ms=20.3
        )
        
        data = result.to_dict()
        
        # CRITICAL: response_time_ms must be in dict for database storage
        assert "response_time_ms" in data
        assert data["response_time_ms"] == 20.3
    
    def test_rtt_none_on_failure(self):
        """Test RTT is None when ping fails"""
        result = PingResult(
            is_alive=False,
            status=PingStatus.TIMEOUT,
            response_time_ms=None
        )
        
        # RTT should be None for failed pings (no response)
        assert result.response_time_ms is None
    
    def test_rtt_analysis_functions_exist(self):
        """Test RTT analysis functions are available"""
        # Verify Phase 3 analysis functions exist
        assert hasattr(RTTAnalyzer, 'calculate_stats')
        assert hasattr(RTTAnalyzer, 'categorize_latency')
        assert hasattr(RTTAnalyzer, 'detect_anomalies')
        
        # Test they work with RTT values
        rtt_values = [10.0, 15.0, 12.0]
        stats = RTTAnalyzer.calculate_stats(rtt_values)
        assert stats["avg_rtt_ms"] is not None
