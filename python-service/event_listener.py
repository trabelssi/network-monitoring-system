"""
Event Listener Module

SNMP trap receiver (UDP 162) and syslog listener (UDP 514).
Receives network device events and triggers appropriate actions.

Phase 2, Step 6: Trap/syslog listener
Status: Written, NOT YET VERIFIED IN DOCKER

On event:
1. Write to device_status_history via DeviceStatusWriter (Step 4 - reused)
2. Call Laravel API endpoint (Step 7 - stubbed for now)
"""

import asyncio
import socket
import logging
from typing import Optional, Dict, Any, Callable
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

# Reuse Step 4's database writer - no duplication
from database_writer import DeviceStatusWriter, DatabaseConfig
from icmp_poller import PingResult, PingStatus


logger = logging.getLogger(__name__)


class EventSeverity(Enum):
    """Event severity levels"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass
class DeviceEvent:
    """Represents a device event from trap or syslog"""
    device_id: Optional[int]
    ip_address: str
    event_type: str
    severity: EventSeverity
    message: str
    timestamp: datetime
    raw_data: str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dict for API call"""
        return {
            'device_id': self.device_id,
            'ip_address': self.ip_address,
            'event_type': self.event_type,
            'severity': self.severity.value,
            'message': self.message,
            'timestamp': self.timestamp.isoformat(),
        }


class LaravelAPIClient:
    """
    Client for calling Laravel internal API endpoints
    
    Step 7: Laravel API endpoint implemented.
    Sends device events to POST /api/internal/device-events
    """
    
    def __init__(self, base_url: str = "http://php:80", api_token: Optional[str] = None):
        """
        Initialize API client
        
        Args:
            base_url: Laravel base URL (default: http://php:80 in Docker)
            api_token: Optional API token for authentication (reads from env if None)
        """
        import os
        self.base_url = base_url
        self.api_token = api_token or os.getenv('INTERNAL_API_TOKEN')
        
        if not self.api_token:
            logger.warning('INTERNAL_API_TOKEN not set - API calls will fail authentication')
    
    async def send_device_event(self, event: DeviceEvent) -> bool:
        """
        Send device event to Laravel API
        
        Args:
            event: DeviceEvent to send
            
        Returns:
            True if successful, False otherwise
            
        Note:
            POSTs to /api/internal/device-events with Bearer token authentication.
            Laravel endpoint creates Task and sends notifications.
        """
        try:
            import httpx
            
            headers = {}
            if self.api_token:
                headers['Authorization'] = f'Bearer {self.api_token}'
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/internal/device-events",
                    json=event.to_dict(),
                    headers=headers
                )
                
                if response.status_code == 201:
                    logger.info(
                        f"Device event sent successfully: device_id={event.device_id}, "
                        f"event_type={event.event_type}"
                    )
                    return True
                else:
                    logger.error(
                        f"Failed to send device event: HTTP {response.status_code}, "
                        f"response={response.text}"
                    )
                    return False
                    
        except Exception as e:
            logger.error(f"Exception sending device event to Laravel API: {e}")
            return False


class SNMPTrapReceiver:
    """
    SNMP trap receiver (UDP 162)
    
    Listens for SNMP traps and converts them to DeviceEvent objects.
    """
    
    def __init__(
        self,
        host: str = "0.0.0.0",
        port: int = 162,
        db_config: Optional[DatabaseConfig] = None
    ):
        """
        Initialize SNMP trap receiver
        
        Args:
            host: Host to bind to (default: 0.0.0.0 for all interfaces)
            port: Port to listen on (default: 162 for SNMP traps)
            db_config: Database configuration for DeviceStatusWriter
        """
        self.host = host
        self.port = port
        self.status_writer = DeviceStatusWriter(db_config)
        self.api_client = LaravelAPIClient()
        self.running = False
    
    def parse_trap(self, data: bytes, addr: tuple) -> Optional[DeviceEvent]:
        """
        Parse SNMP trap packet
        
        Args:
            data: Raw UDP packet data
            addr: Source address (ip, port)
            
        Returns:
            DeviceEvent if parseable, None otherwise
            
        Note:
            Basic parsing for MVP. Production would use pysnmp's decoder.
        """
        try:
            source_ip = addr[0]
            
            # Basic trap parsing - in production, use pysnmp's trap decoder
            # For MVP, extract basic info from raw packet
            raw_str = data.decode('utf-8', errors='ignore')
            
            # Determine severity from trap type
            severity = EventSeverity.WARNING
            if 'linkDown' in raw_str or 'down' in raw_str.lower():
                severity = EventSeverity.CRITICAL
            elif 'linkUp' in raw_str or 'up' in raw_str.lower():
                severity = EventSeverity.INFO
            
            event_type = self._extract_event_type(raw_str)
            message = f"SNMP trap received from {source_ip}: {event_type}"
            
            return DeviceEvent(
                device_id=None,  # Will be looked up by IP
                ip_address=source_ip,
                event_type=event_type,
                severity=severity,
                message=message,
                timestamp=datetime.now(),
                raw_data=raw_str[:500]  # Truncate for storage
            )
        except Exception as e:
            logger.error(f"Failed to parse SNMP trap from {addr}: {e}")
            return None
    
    def _extract_event_type(self, raw_str: str) -> str:
        """Extract event type from trap data"""
        # Simple keyword matching for MVP
        if 'linkDown' in raw_str:
            return 'link_down'
        elif 'linkUp' in raw_str:
            return 'link_up'
        elif 'coldStart' in raw_str:
            return 'device_reboot'
        elif 'warmStart' in raw_str:
            return 'device_restart'
        else:
            return 'trap_received'
    
    async def handle_event(self, event: DeviceEvent):
        """
        Handle received device event
        
        Args:
            event: DeviceEvent to process
            
        Actions:
            1. Write to device_status_history (via Step 4's DeviceStatusWriter)
            2. Call Laravel API endpoint (stubbed for Step 7)
        """
        # Look up device ID by IP
        device_id = self.status_writer.get_device_id_by_ip(event.ip_address)
        
        if device_id is None:
            logger.warning(f"Device not found for IP {event.ip_address}, skipping event")
            return
        
        event.device_id = device_id
        
        # 1. Write to device_status_history (reuse Step 4's writer)
        # Convert event to PingResult for compatibility with DeviceStatusWriter
        is_alive = event.event_type not in ['link_down', 'device_offline']
        
        ping_result = PingResult(
            is_alive=is_alive,
            status=PingStatus.SUCCESS if is_alive else PingStatus.UNREACHABLE,
            response_time_ms=None,  # No RTT from trap
            error=None if is_alive else event.message
        )
        
        status_changed = self.status_writer.update_device_status(device_id, ping_result)
        
        if status_changed:
            logger.info(
                f"Device {device_id} ({event.ip_address}) status changed via trap: "
                f"{event.event_type}"
            )
        
        # 2. Call Laravel API endpoint (stubbed for Step 7)
        await self.api_client.send_device_event(event)
    
    async def start(self):
        """Start listening for SNMP traps"""
        self.running = True
        
        # Create UDP socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind((self.host, self.port))
        sock.setblocking(False)
        
        logger.info(f"SNMP trap receiver listening on {self.host}:{self.port}")
        
        loop = asyncio.get_event_loop()
        
        while self.running:
            try:
                # Non-blocking receive with timeout
                data, addr = await loop.sock_recvfrom(sock, 4096)
                
                event = self.parse_trap(data, addr)
                if event:
                    await self.handle_event(event)
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in trap receiver: {e}")
                await asyncio.sleep(0.1)
        
        sock.close()
        logger.info("SNMP trap receiver stopped")
    
    def stop(self):
        """Stop listening for traps"""
        self.running = False


class SyslogListener:
    """
    Syslog listener (UDP 514)
    
    Listens for syslog messages and converts them to DeviceEvent objects.
    """
    
    def __init__(
        self,
        host: str = "0.0.0.0",
        port: int = 514,
        db_config: Optional[DatabaseConfig] = None
    ):
        """
        Initialize syslog listener
        
        Args:
            host: Host to bind to (default: 0.0.0.0 for all interfaces)
            port: Port to listen on (default: 514 for syslog)
            db_config: Database configuration for DeviceStatusWriter
        """
        self.host = host
        self.port = port
        self.status_writer = DeviceStatusWriter(db_config)
        self.api_client = LaravelAPIClient()
        self.running = False
    
    def parse_syslog(self, data: bytes, addr: tuple) -> Optional[DeviceEvent]:
        """
        Parse syslog message
        
        Args:
            data: Raw UDP packet data
            addr: Source address (ip, port)
            
        Returns:
            DeviceEvent if parseable, None otherwise
            
        Note:
            Basic RFC 3164 syslog parsing for MVP.
        """
        try:
            source_ip = addr[0]
            message = data.decode('utf-8', errors='ignore').strip()
            
            # Parse priority (first number in angle brackets)
            priority = 0
            if message.startswith('<'):
                end = message.find('>')
                if end > 0:
                    priority = int(message[1:end])
                    message = message[end+1:]
            
            # Extract facility and severity from priority
            # priority = facility * 8 + severity
            severity_num = priority % 8
            
            # Map syslog severity to our EventSeverity
            if severity_num <= 3:  # Emergency, Alert, Critical, Error
                severity = EventSeverity.CRITICAL
            elif severity_num <= 5:  # Warning, Notice
                severity = EventSeverity.WARNING
            else:  # Informational, Debug
                severity = EventSeverity.INFO
            
            event_type = self._classify_syslog_event(message)
            
            return DeviceEvent(
                device_id=None,  # Will be looked up by IP
                ip_address=source_ip,
                event_type=event_type,
                severity=severity,
                message=message[:500],  # Truncate
                timestamp=datetime.now(),
                raw_data=message[:500]
            )
        except Exception as e:
            logger.error(f"Failed to parse syslog from {addr}: {e}")
            return None
    
    def _classify_syslog_event(self, message: str) -> str:
        """Classify syslog message into event type"""
        msg_lower = message.lower()
        
        if 'interface' in msg_lower and 'down' in msg_lower:
            return 'interface_down'
        elif 'interface' in msg_lower and 'up' in msg_lower:
            return 'interface_up'
        elif 'link' in msg_lower and 'down' in msg_lower:
            return 'link_down'
        elif 'link' in msg_lower and 'up' in msg_lower:
            return 'link_up'
        elif any(word in msg_lower for word in ['reboot', 'restart', 'reload']):
            return 'device_reboot'
        elif 'configuration' in msg_lower or 'config' in msg_lower:
            return 'config_change'
        elif any(word in msg_lower for word in ['error', 'fail', 'critical']):
            return 'device_error'
        else:
            return 'syslog_event'
    
    async def handle_event(self, event: DeviceEvent):
        """
        Handle received device event
        
        Args:
            event: DeviceEvent to process
            
        Actions:
            1. Write to device_status_history (via Step 4's DeviceStatusWriter)
            2. Call Laravel API endpoint (stubbed for Step 7)
        """
        # Look up device ID by IP
        device_id = self.status_writer.get_device_id_by_ip(event.ip_address)
        
        if device_id is None:
            logger.warning(f"Device not found for IP {event.ip_address}, skipping event")
            return
        
        event.device_id = device_id
        
        # 1. Write to device_status_history (reuse Step 4's writer)
        # Determine device status from event type
        offline_events = ['link_down', 'interface_down', 'device_offline']
        is_alive = event.event_type not in offline_events
        
        ping_result = PingResult(
            is_alive=is_alive,
            status=PingStatus.SUCCESS if is_alive else PingStatus.UNREACHABLE,
            response_time_ms=None,  # No RTT from syslog
            error=None if is_alive else event.message
        )
        
        status_changed = self.status_writer.update_device_status(device_id, ping_result)
        
        if status_changed:
            logger.info(
                f"Device {device_id} ({event.ip_address}) status changed via syslog: "
                f"{event.event_type}"
            )
        
        # 2. Call Laravel API endpoint (stubbed for Step 7)
        await self.api_client.send_device_event(event)
    
    async def start(self):
        """Start listening for syslog messages"""
        self.running = True
        
        # Create UDP socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind((self.host, self.port))
        sock.setblocking(False)
        
        logger.info(f"Syslog listener started on {self.host}:{self.port}")
        
        loop = asyncio.get_event_loop()
        
        while self.running:
            try:
                # Non-blocking receive with timeout
                data, addr = await loop.sock_recvfrom(sock, 4096)
                
                event = self.parse_syslog(data, addr)
                if event:
                    await self.handle_event(event)
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in syslog listener: {e}")
                await asyncio.sleep(0.1)
        
        sock.close()
        logger.info("Syslog listener stopped")
    
    def stop(self):
        """Stop listening for syslog"""
        self.running = False


class EventListenerManager:
    """
    Manages both SNMP trap receiver and syslog listener
    
    Provides unified start/stop for both listeners.
    """
    
    def __init__(
        self,
        enable_traps: bool = True,
        enable_syslog: bool = True,
        db_config: Optional[DatabaseConfig] = None
    ):
        """
        Initialize event listener manager
        
        Args:
            enable_traps: Enable SNMP trap receiver
            enable_syslog: Enable syslog listener
            db_config: Database configuration
        """
        self.enable_traps = enable_traps
        self.enable_syslog = enable_syslog
        
        self.trap_receiver = SNMPTrapReceiver(db_config=db_config) if enable_traps else None
        self.syslog_listener = SyslogListener(db_config=db_config) if enable_syslog else None
        
        self.tasks = []
    
    async def start(self):
        """Start all enabled listeners"""
        if self.trap_receiver:
            task = asyncio.create_task(self.trap_receiver.start())
            self.tasks.append(task)
            logger.info("SNMP trap receiver enabled")
        
        if self.syslog_listener:
            task = asyncio.create_task(self.syslog_listener.start())
            self.tasks.append(task)
            logger.info("Syslog listener enabled")
        
        if not self.tasks:
            logger.warning("No event listeners enabled")
            return
        
        # Wait for all tasks
        await asyncio.gather(*self.tasks)
    
    def stop(self):
        """Stop all listeners"""
        if self.trap_receiver:
            self.trap_receiver.stop()
        
        if self.syslog_listener:
            self.syslog_listener.stop()
        
        # Cancel all tasks
        for task in self.tasks:
            task.cancel()
        
        logger.info("All event listeners stopped")
