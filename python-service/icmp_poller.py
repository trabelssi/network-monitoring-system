"""
ICMP Polling Module

Handles ICMP ping operations with RTT (Round-Trip Time) capture.
Native async implementation using icmplib.

Phase 2, Step 3: ICMP ping functionality with RTT measurement
Status: Written, NOT YET VERIFIED IN DOCKER

CRITICAL: RTT values must be captured and preserved for Phase 3 metrics.
device_response_time_ms depends on this data being available.
"""

import os
from typing import Optional, List
from dataclasses import dataclass
from enum import Enum
import asyncio


class PingStatus(Enum):
    """Ping result status"""

    SUCCESS = "success"
    TIMEOUT = "timeout"
    UNREACHABLE = "unreachable"
    ERROR = "error"


@dataclass
class ICMPConfig:
    """
    ICMP ping configuration

    Matches PHP SancellaDiscoveryService->pingDevice() behavior:
    - 1 packet (count)
    - 5 second timeout
    - Privileged mode (required for raw ICMP)
    """

    count: int = 1
    timeout: float = 5.0
    interval: float = 0.5
    privileged: bool = True

    @classmethod
    def from_env(cls) -> "ICMPConfig":
        """Load configuration from environment variables"""
        return cls(
            count=int(os.getenv("ICMP_COUNT", "1")),
            timeout=float(os.getenv("ICMP_TIMEOUT", "5.0")),
            interval=float(os.getenv("ICMP_INTERVAL", "0.5")),
            privileged=os.getenv("ICMP_PRIVILEGED", "true").lower() == "true",
        )


@dataclass
class PingResult:
    """
    Result of ICMP ping operation

    CRITICAL: RTT (response_time_ms) must be captured for Phase 3 metrics.
    This is not optional - device_response_time_ms tracking depends on it.

    Attributes:
        is_alive: Whether device responded (boolean for compatibility)
        status: Detailed status (success/timeout/unreachable/error)
        response_time_ms: Round-trip time in milliseconds (CRITICAL for Phase 3)
        packet_loss: Percentage of packets lost (0.0 to 1.0)
        packets_sent: Number of packets sent
        packets_received: Number of packets received
        error: Error message if ping failed
    """

    is_alive: bool
    status: PingStatus
    response_time_ms: Optional[float] = None  # CRITICAL: Must capture RTT
    packet_loss: float = 0.0
    packets_sent: int = 0
    packets_received: int = 0
    error: Optional[str] = None

    def to_dict(self):
        """Convert to dictionary for database storage"""
        return {
            "is_alive": self.is_alive,
            "status": self.status.value,
            "response_time_ms": self.response_time_ms,
            "packet_loss": self.packet_loss,
            "packets_sent": self.packets_sent,
            "packets_received": self.packets_received,
            "error": self.error,
        }

    @classmethod
    def from_exception(cls, error_msg: str) -> "PingResult":
        """Create error result from exception"""
        return cls(
            is_alive=False,
            status=PingStatus.ERROR,
            response_time_ms=None,
            error=error_msg,
        )


class ICMPPoller:
    """
    ICMP ping client with RTT capture

    Replaces PHP exec("ping ...") with native async implementation.
    Uses icmplib for cross-platform ICMP support.

    CRITICAL: Must preserve RTT values for Phase 3 device_response_time_ms metric.
    """

    def __init__(self, config: Optional[ICMPConfig] = None):
        """
        Initialize ICMP poller

        Args:
            config: ICMP configuration (defaults to environment-based config)
        """
        self.config = config or ICMPConfig.from_env()

    def ping(self, ip_address: str) -> PingResult:
        """
        Synchronous ping operation

        Args:
            ip_address: Target IP address

        Returns:
            PingResult with is_alive status and RTT

        Note:
            This is a synchronous wrapper around async_ping for compatibility.
            Use async_ping directly in async contexts for better performance.
        """
        try:
            # Run async ping in a new event loop
            return asyncio.run(self.async_ping(ip_address))
        except RuntimeError as e:
            # Event loop already running (e.g., in FastAPI context)
            # Fall back to creating a new loop
            loop = asyncio.new_event_loop()
            try:
                asyncio.set_event_loop(loop)
                return loop.run_until_complete(self.async_ping(ip_address))
            finally:
                loop.close()

    async def async_ping(self, ip_address: str) -> PingResult:
        """
        Async ping operation with RTT capture

        Args:
            ip_address: Target IP address

        Returns:
            PingResult with is_alive status and RTT in milliseconds

        Note:
            Requires icmplib library and may require privileged mode.
            NOT YET VERIFIED - requires Docker environment for testing.
        """
        try:
            # Import icmplib here to allow module import without library installed
            from icmplib import async_ping as icmplib_ping

            # Execute ping
            host = await icmplib_ping(
                ip_address,
                count=self.config.count,
                timeout=self.config.timeout,
                interval=self.config.interval,
                privileged=self.config.privileged,
            )

            # Extract results
            is_alive = host.is_alive

            # CRITICAL: Capture RTT for Phase 3 metrics
            # icmplib returns avg_rtt in milliseconds
            response_time_ms = host.avg_rtt if is_alive else None

            # Determine detailed status
            if is_alive:
                status = PingStatus.SUCCESS
            elif host.packet_loss == 1.0:
                # 100% packet loss = timeout or unreachable
                status = PingStatus.TIMEOUT
            else:
                status = PingStatus.UNREACHABLE

            return PingResult(
                is_alive=is_alive,
                status=status,
                response_time_ms=response_time_ms,  # CRITICAL: RTT captured
                packet_loss=host.packet_loss,
                packets_sent=host.packets_sent,
                packets_received=host.packets_received,
            )

        except ImportError:
            return PingResult.from_exception("icmplib library not installed")
        except PermissionError:
            return PingResult.from_exception(
                "ICMP requires elevated privileges - run with sudo or CAP_NET_RAW"
            )
        except Exception as e:
            return PingResult.from_exception(f"Ping failed: {str(e)}")

    def ping_multiple(self, ip_addresses: List[str]) -> List[PingResult]:
        """
        Ping multiple hosts synchronously

        Args:
            ip_addresses: List of IP addresses to ping

        Returns:
            List of PingResult objects (one per IP)
        """
        return [self.ping(ip) for ip in ip_addresses]

    async def async_ping_multiple(self, ip_addresses: List[str]) -> List[PingResult]:
        """
        Ping multiple hosts concurrently

        Args:
            ip_addresses: List of IP addresses to ping

        Returns:
            List of PingResult objects (one per IP)

        Note:
            Uses asyncio.gather for concurrent execution.
            Much faster than sequential pings for large IP ranges.
        """
        tasks = [self.async_ping(ip) for ip in ip_addresses]
        return await asyncio.gather(*tasks)

    @staticmethod
    def is_alive_simple(ip_address: str) -> bool:
        """
        Simple boolean ping check (backward compatibility)

        Matches PHP SancellaDiscoveryService->pingDevice() return type.

        Args:
            ip_address: Target IP address

        Returns:
            True if device responds, False otherwise

        Note:
            This method discards RTT data. Use ping() to capture RTT.
        """
        poller = ICMPPoller()
        result = poller.ping(ip_address)
        return result.is_alive


class RTTAnalyzer:
    """
    Analyze RTT values for network performance metrics

    Supports Phase 3 device_response_time_ms tracking and analysis.
    """

    @staticmethod
    def calculate_stats(rtt_values: List[float]) -> dict:
        """
        Calculate RTT statistics

        Args:
            rtt_values: List of RTT measurements in milliseconds

        Returns:
            Dict with min, max, avg, median RTT values
        """
        if not rtt_values:
            return {
                "min_rtt_ms": None,
                "max_rtt_ms": None,
                "avg_rtt_ms": None,
                "median_rtt_ms": None,
                "sample_count": 0,
            }

        sorted_values = sorted(rtt_values)
        count = len(sorted_values)

        return {
            "min_rtt_ms": min(sorted_values),
            "max_rtt_ms": max(sorted_values),
            "avg_rtt_ms": sum(sorted_values) / count,
            "median_rtt_ms": sorted_values[count // 2]
            if count % 2 == 1
            else (sorted_values[count // 2 - 1] + sorted_values[count // 2]) / 2,
            "sample_count": count,
        }

    @staticmethod
    def categorize_latency(rtt_ms: Optional[float]) -> str:
        """
        Categorize latency for network quality assessment

        Args:
            rtt_ms: Round-trip time in milliseconds

        Returns:
            Category: "excellent", "good", "fair", "poor", "very_poor", or "unknown"
        """
        if rtt_ms is None:
            return "unknown"

        if rtt_ms < 10:
            return "excellent"  # < 10ms
        elif rtt_ms < 50:
            return "good"  # 10-50ms
        elif rtt_ms < 100:
            return "fair"  # 50-100ms
        elif rtt_ms < 200:
            return "poor"  # 100-200ms
        else:
            return "very_poor"  # > 200ms

    @staticmethod
    def detect_anomalies(
        rtt_values: List[float], threshold_multiplier: float = 3.0
    ) -> List[int]:
        """
        Detect RTT anomalies (outliers)

        Args:
            rtt_values: List of RTT measurements
            threshold_multiplier: Multiplier for standard deviation threshold

        Returns:
            List of indices where anomalies were detected
        """
        if len(rtt_values) < 3:
            return []  # Need at least 3 samples for meaningful detection

        # Calculate mean and standard deviation
        mean = sum(rtt_values) / len(rtt_values)
        variance = sum((x - mean) ** 2 for x in rtt_values) / len(rtt_values)
        std_dev = variance**0.5

        # Detect outliers beyond threshold
        threshold = threshold_multiplier * std_dev
        anomalies = []

        for i, rtt in enumerate(rtt_values):
            if abs(rtt - mean) > threshold:
                anomalies.append(i)

        return anomalies
