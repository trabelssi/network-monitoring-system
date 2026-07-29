"""
Unit tests for event_listener module

Phase 2, Step 6: Event listener tests (MOCKED - no Docker required)
Status: Written, NOT YET VERIFIED IN DOCKER

Tests SNMP trap receiver and syslog listener functionality with mocked dependencies.
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime

from event_listener import (
    EventSeverity,
    DeviceEvent,
    LaravelAPIClient,
    SNMPTrapReceiver,
    SyslogListener,
    EventListenerManager,
)
from icmp_poller import PingResult, PingStatus


# Test fixtures

@pytest.fixture
def sample_device_event():
    """Sample DeviceEvent for testing"""
    return DeviceEvent(
        device_id=1,
        ip_address="192.168.1.10",
        event_type="link_down",
        severity=EventSeverity.CRITICAL,
        message="Interface down",
        timestamp=datetime(2026, 1, 1, 12, 0, 0),
        raw_data="<raw trap data>"
    )


@pytest.fixture
def mock_db_config():
    """Mock database configuration"""
    from database_writer import DatabaseConfig
    return DatabaseConfig(
        host="mysql",
        port=3306,
        user="test_user",
        password="test_pass",
        database="test_db"
    )


# DeviceEvent Tests

def test_device_event_to_dict(sample_device_event):
    """Test DeviceEvent.to_dict() serialization"""
    result = sample_device_event.to_dict()
    
    assert result['device_id'] == 1
    assert result['ip_address'] == "192.168.1.10"
    assert result['event_type'] == "link_down"
    assert result['severity'] == "critical"
    assert result['message'] == "Interface down"
    assert result['timestamp'] == "2026-01-01T12:00:00"


def test_device_event_severity_enum():
    """Test EventSeverity enum values"""
    assert EventSeverity.INFO.value == "info"
    assert EventSeverity.WARNING.value == "warning"
    assert EventSeverity.CRITICAL.value == "critical"


# LaravelAPIClient Tests

@pytest.mark.asyncio
async def test_laravel_api_client_stub():
    """Test LaravelAPIClient.send_device_event() stub behavior"""
    client = LaravelAPIClient(base_url="http://php:80", api_token="test_token")
    
    event = DeviceEvent(
        device_id=1,
        ip_address="192.168.1.10",
        event_type="link_down",
        severity=EventSeverity.CRITICAL,
        message="Test event",
        timestamp=datetime.now(),
        raw_data="test data"
    )
    
    # Stub should always return True and log
    with patch('event_listener.logger') as mock_logger:
        result = await client.send_device_event(event)
        
        assert result is True
        mock_logger.info.assert_called_once()
        call_args = mock_logger.info.call_args[0][0]
        assert "[STUB]" in call_args
        assert "device_id=1" in call_args


# SNMPTrapReceiver Tests

@pytest.mark.asyncio
async def test_snmp_trap_receiver_init(mock_db_config):
    """Test SNMPTrapReceiver initialization"""
    receiver = SNMPTrapReceiver(
        host="0.0.0.0",
        port=162,
        db_config=mock_db_config
    )
    
    assert receiver.host == "0.0.0.0"
    assert receiver.port == 162
    assert receiver.status_writer is not None
    assert receiver.api_client is not None
    assert receiver.running is False


def test_snmp_trap_parse_link_down():
    """Test parsing SNMP linkDown trap"""
    receiver = SNMPTrapReceiver()
    
    # Mock trap data containing "linkDown"
    trap_data = b"SNMPv2-MIB::linkDown 1.3.6.1.4.1.9.9.linkDown"
    addr = ("192.168.1.10", 12345)
    
    event = receiver.parse_trap(trap_data, addr)
    
    assert event is not None
    assert event.ip_address == "192.168.1.10"
    assert event.event_type == "link_down"
    assert event.severity == EventSeverity.CRITICAL
    assert "192.168.1.10" in event.message


def test_snmp_trap_parse_link_up():
    """Test parsing SNMP linkUp trap"""
    receiver = SNMPTrapReceiver()
    
    trap_data = b"SNMPv2-MIB::linkUp interface 1 is now up"
    addr = ("192.168.1.20", 12345)
    
    event = receiver.parse_trap(trap_data, addr)
    
    assert event is not None
    assert event.ip_address == "192.168.1.20"
    assert event.event_type == "link_up"
    assert event.severity == EventSeverity.INFO


def test_snmp_trap_parse_cold_start():
    """Test parsing SNMP coldStart trap"""
    receiver = SNMPTrapReceiver()
    
    trap_data = b"SNMPv2-MIB::coldStart device rebooted"
    addr = ("192.168.1.30", 12345)
    
    event = receiver.parse_trap(trap_data, addr)
    
    assert event is not None
    assert event.event_type == "device_reboot"


def test_snmp_trap_extract_event_type():
    """Test _extract_event_type() classification"""
    receiver = SNMPTrapReceiver()
    
    assert receiver._extract_event_type("linkDown") == "link_down"
    assert receiver._extract_event_type("linkUp") == "link_up"
    assert receiver._extract_event_type("coldStart") == "device_reboot"
    assert receiver._extract_event_type("warmStart") == "device_restart"
    assert receiver._extract_event_type("unknown trap") == "trap_received"


@pytest.mark.asyncio
async def test_snmp_trap_handle_event_device_found(mock_db_config):
    """Test handle_event() when device is found"""
    receiver = SNMPTrapReceiver(db_config=mock_db_config)
    
    # Mock DeviceStatusWriter
    with patch.object(receiver.status_writer, 'get_device_id_by_ip', return_value=42):
        with patch.object(receiver.status_writer, 'update_device_status', return_value=True):
            with patch.object(receiver.api_client, 'send_device_event', new_callable=AsyncMock) as mock_api:
                event = DeviceEvent(
                    device_id=None,
                    ip_address="192.168.1.10",
                    event_type="link_down",
                    severity=EventSeverity.CRITICAL,
                    message="Link down",
                    timestamp=datetime.now(),
                    raw_data="raw"
                )
                
                await receiver.handle_event(event)
                
                # Verify device_id was set
                assert event.device_id == 42
                
                # Verify API call was made
                mock_api.assert_called_once_with(event)


@pytest.mark.asyncio
async def test_snmp_trap_handle_event_device_not_found(mock_db_config):
    """Test handle_event() when device is not found"""
    receiver = SNMPTrapReceiver(db_config=mock_db_config)
    
    # Mock DeviceStatusWriter returning None (device not found)
    with patch.object(receiver.status_writer, 'get_device_id_by_ip', return_value=None):
        with patch.object(receiver.api_client, 'send_device_event', new_callable=AsyncMock) as mock_api:
            with patch('event_listener.logger') as mock_logger:
                event = DeviceEvent(
                    device_id=None,
                    ip_address="192.168.1.99",
                    event_type="link_down",
                    severity=EventSeverity.CRITICAL,
                    message="Link down",
                    timestamp=datetime.now(),
                    raw_data="raw"
                )
                
                await receiver.handle_event(event)
                
                # Verify warning was logged
                mock_logger.warning.assert_called_once()
                
                # Verify API was NOT called
                mock_api.assert_not_called()


def test_snmp_trap_stop():
    """Test SNMPTrapReceiver.stop()"""
    receiver = SNMPTrapReceiver()
    receiver.running = True
    
    receiver.stop()
    
    assert receiver.running is False


# SyslogListener Tests

@pytest.mark.asyncio
async def test_syslog_listener_init(mock_db_config):
    """Test SyslogListener initialization"""
    listener = SyslogListener(
        host="0.0.0.0",
        port=514,
        db_config=mock_db_config
    )
    
    assert listener.host == "0.0.0.0"
    assert listener.port == 514
    assert listener.status_writer is not None
    assert listener.api_client is not None
    assert listener.running is False


def test_syslog_parse_critical():
    """Test parsing critical syslog message"""
    listener = SyslogListener()
    
    # Priority 3 = critical (facility 0, severity 3)
    syslog_data = b"<3>Jan 1 12:00:00 router interface GigabitEthernet0/1 down"
    addr = ("192.168.1.10", 54321)
    
    event = listener.parse_syslog(syslog_data, addr)
    
    assert event is not None
    assert event.ip_address == "192.168.1.10"
    assert event.severity == EventSeverity.CRITICAL
    assert "interface" in event.message.lower()


def test_syslog_parse_warning():
    """Test parsing warning syslog message"""
    listener = SyslogListener()
    
    # Priority 4 = warning (facility 0, severity 4)
    syslog_data = b"<4>Jan 1 12:00:00 switch LINK-3-UPDOWN: Interface up"
    addr = ("192.168.1.20", 54321)
    
    event = listener.parse_syslog(syslog_data, addr)
    
    assert event is not None
    assert event.severity == EventSeverity.WARNING


def test_syslog_parse_info():
    """Test parsing informational syslog message"""
    listener = SyslogListener()
    
    # Priority 6 = info (facility 0, severity 6)
    syslog_data = b"<6>Jan 1 12:00:00 router SYS-5-CONFIG_I: Configured from console"
    addr = ("192.168.1.30", 54321)
    
    event = listener.parse_syslog(syslog_data, addr)
    
    assert event is not None
    assert event.severity == EventSeverity.INFO


def test_syslog_classify_interface_down():
    """Test syslog event classification for interface down"""
    listener = SyslogListener()
    
    assert listener._classify_syslog_event("interface GigabitEthernet0/1 down") == "interface_down"


def test_syslog_classify_interface_up():
    """Test syslog event classification for interface up"""
    listener = SyslogListener()
    
    assert listener._classify_syslog_event("interface FastEthernet0/1 up") == "interface_up"


def test_syslog_classify_link_down():
    """Test syslog event classification for link down"""
    listener = SyslogListener()
    
    assert listener._classify_syslog_event("LINK-3-UPDOWN: link down") == "link_down"


def test_syslog_classify_link_up():
    """Test syslog event classification for link up"""
    listener = SyslogListener()
    
    assert listener._classify_syslog_event("LINK-5-CHANGED: link up") == "link_up"


def test_syslog_classify_reboot():
    """Test syslog event classification for reboot"""
    listener = SyslogListener()
    
    assert listener._classify_syslog_event("SYS-5-RELOAD: Reload requested") == "device_reboot"
    assert listener._classify_syslog_event("System restart completed") == "device_reboot"


def test_syslog_classify_config_change():
    """Test syslog event classification for config change"""
    listener = SyslogListener()
    
    assert listener._classify_syslog_event("SYS-5-CONFIG_I: Configuration saved") == "config_change"


def test_syslog_classify_error():
    """Test syslog event classification for errors"""
    listener = SyslogListener()
    
    assert listener._classify_syslog_event("CRIT-1-ERROR: Critical error detected") == "device_error"


def test_syslog_classify_unknown():
    """Test syslog event classification for unknown messages"""
    listener = SyslogListener()
    
    assert listener._classify_syslog_event("Some random log message") == "syslog_event"


@pytest.mark.asyncio
async def test_syslog_handle_event_device_found(mock_db_config):
    """Test syslog handle_event() when device is found"""
    listener = SyslogListener(db_config=mock_db_config)
    
    # Mock DeviceStatusWriter
    with patch.object(listener.status_writer, 'get_device_id_by_ip', return_value=100):
        with patch.object(listener.status_writer, 'update_device_status', return_value=True):
            with patch.object(listener.api_client, 'send_device_event', new_callable=AsyncMock) as mock_api:
                event = DeviceEvent(
                    device_id=None,
                    ip_address="192.168.1.50",
                    event_type="interface_down",
                    severity=EventSeverity.CRITICAL,
                    message="Interface down",
                    timestamp=datetime.now(),
                    raw_data="raw"
                )
                
                await listener.handle_event(event)
                
                # Verify device_id was set
                assert event.device_id == 100
                
                # Verify API call was made
                mock_api.assert_called_once_with(event)


@pytest.mark.asyncio
async def test_syslog_handle_event_offline_detection(mock_db_config):
    """Test syslog handle_event() detects offline status correctly"""
    listener = SyslogListener(db_config=mock_db_config)
    
    with patch.object(listener.status_writer, 'get_device_id_by_ip', return_value=1):
        with patch.object(listener.status_writer, 'update_device_status', return_value=True) as mock_update:
            with patch.object(listener.api_client, 'send_device_event', new_callable=AsyncMock):
                # Test offline event
                offline_event = DeviceEvent(
                    device_id=None,
                    ip_address="192.168.1.10",
                    event_type="link_down",
                    severity=EventSeverity.CRITICAL,
                    message="Link down",
                    timestamp=datetime.now(),
                    raw_data="raw"
                )
                
                await listener.handle_event(offline_event)
                
                # Verify PingResult was created with is_alive=False
                call_args = mock_update.call_args
                ping_result = call_args[0][1]
                assert ping_result.is_alive is False
                assert ping_result.status == PingStatus.UNREACHABLE


@pytest.mark.asyncio
async def test_syslog_handle_event_online_detection(mock_db_config):
    """Test syslog handle_event() detects online status correctly"""
    listener = SyslogListener(db_config=mock_db_config)
    
    with patch.object(listener.status_writer, 'get_device_id_by_ip', return_value=1):
        with patch.object(listener.status_writer, 'update_device_status', return_value=True) as mock_update:
            with patch.object(listener.api_client, 'send_device_event', new_callable=AsyncMock):
                # Test online event
                online_event = DeviceEvent(
                    device_id=None,
                    ip_address="192.168.1.10",
                    event_type="link_up",
                    severity=EventSeverity.INFO,
                    message="Link up",
                    timestamp=datetime.now(),
                    raw_data="raw"
                )
                
                await listener.handle_event(online_event)
                
                # Verify PingResult was created with is_alive=True
                call_args = mock_update.call_args
                ping_result = call_args[0][1]
                assert ping_result.is_alive is True
                assert ping_result.status == PingStatus.SUCCESS


def test_syslog_stop():
    """Test SyslogListener.stop()"""
    listener = SyslogListener()
    listener.running = True
    
    listener.stop()
    
    assert listener.running is False


# EventListenerManager Tests

@pytest.mark.asyncio
async def test_event_listener_manager_init_all_enabled(mock_db_config):
    """Test EventListenerManager with all listeners enabled"""
    manager = EventListenerManager(
        enable_traps=True,
        enable_syslog=True,
        db_config=mock_db_config
    )
    
    assert manager.trap_receiver is not None
    assert manager.syslog_listener is not None


@pytest.mark.asyncio
async def test_event_listener_manager_init_traps_only(mock_db_config):
    """Test EventListenerManager with only traps enabled"""
    manager = EventListenerManager(
        enable_traps=True,
        enable_syslog=False,
        db_config=mock_db_config
    )
    
    assert manager.trap_receiver is not None
    assert manager.syslog_listener is None


@pytest.mark.asyncio
async def test_event_listener_manager_init_syslog_only(mock_db_config):
    """Test EventListenerManager with only syslog enabled"""
    manager = EventListenerManager(
        enable_traps=False,
        enable_syslog=True,
        db_config=mock_db_config
    )
    
    assert manager.trap_receiver is None
    assert manager.syslog_listener is not None


@pytest.mark.asyncio
async def test_event_listener_manager_init_none_enabled(mock_db_config):
    """Test EventListenerManager with no listeners enabled"""
    manager = EventListenerManager(
        enable_traps=False,
        enable_syslog=False,
        db_config=mock_db_config
    )
    
    assert manager.trap_receiver is None
    assert manager.syslog_listener is None


def test_event_listener_manager_stop(mock_db_config):
    """Test EventListenerManager.stop()"""
    manager = EventListenerManager(
        enable_traps=True,
        enable_syslog=True,
        db_config=mock_db_config
    )
    
    # Add mock tasks
    manager.tasks = [Mock(), Mock()]
    
    with patch.object(manager.trap_receiver, 'stop') as mock_trap_stop:
        with patch.object(manager.syslog_listener, 'stop') as mock_syslog_stop:
            manager.stop()
            
            # Verify both listeners stopped
            mock_trap_stop.assert_called_once()
            mock_syslog_stop.assert_called_once()
            
            # Verify tasks were cancelled
            for task in manager.tasks:
                task.cancel.assert_called_once()


# Integration-style tests (still mocked, but testing multiple components)

@pytest.mark.asyncio
async def test_snmp_trap_full_flow(mock_db_config):
    """Test full SNMP trap flow from parse to handle"""
    receiver = SNMPTrapReceiver(db_config=mock_db_config)
    
    trap_data = b"SNMPv2-MIB::linkDown interface down"
    addr = ("192.168.1.10", 12345)
    
    # Mock dependencies
    with patch.object(receiver.status_writer, 'get_device_id_by_ip', return_value=5):
        with patch.object(receiver.status_writer, 'update_device_status', return_value=True) as mock_update:
            with patch.object(receiver.api_client, 'send_device_event', new_callable=AsyncMock) as mock_api:
                # Parse trap
                event = receiver.parse_trap(trap_data, addr)
                assert event is not None
                
                # Handle event
                await receiver.handle_event(event)
                
                # Verify full flow
                assert event.device_id == 5
                mock_update.assert_called_once()
                mock_api.assert_called_once()


@pytest.mark.asyncio
async def test_syslog_full_flow(mock_db_config):
    """Test full syslog flow from parse to handle"""
    listener = SyslogListener(db_config=mock_db_config)
    
    syslog_data = b"<3>Jan 1 12:00:00 router interface GigabitEthernet0/1 down"
    addr = ("192.168.1.20", 54321)
    
    # Mock dependencies
    with patch.object(listener.status_writer, 'get_device_id_by_ip', return_value=10):
        with patch.object(listener.status_writer, 'update_device_status', return_value=True) as mock_update:
            with patch.object(listener.api_client, 'send_device_event', new_callable=AsyncMock) as mock_api:
                # Parse syslog
                event = listener.parse_syslog(syslog_data, addr)
                assert event is not None
                
                # Handle event
                await listener.handle_event(event)
                
                # Verify full flow
                assert event.device_id == 10
                mock_update.assert_called_once()
                mock_api.assert_called_once()


# Edge cases and error handling

def test_snmp_trap_parse_invalid_utf8():
    """Test SNMP trap parsing with invalid UTF-8"""
    receiver = SNMPTrapReceiver()
    
    # Invalid UTF-8 bytes
    trap_data = b"\xff\xfe invalid utf8 \x80\x81"
    addr = ("192.168.1.10", 12345)
    
    # Should handle gracefully (errors='ignore')
    event = receiver.parse_trap(trap_data, addr)
    
    # Event should still be created with cleaned data
    assert event is not None
    assert event.ip_address == "192.168.1.10"


def test_syslog_parse_no_priority():
    """Test syslog parsing without priority"""
    listener = SyslogListener()
    
    # Syslog without <priority>
    syslog_data = b"Jan 1 12:00:00 router message without priority"
    addr = ("192.168.1.30", 54321)
    
    event = listener.parse_syslog(syslog_data, addr)
    
    assert event is not None
    assert event.severity == EventSeverity.INFO  # Default for priority 0


def test_snmp_trap_parse_exception_handling():
    """Test SNMP trap parsing exception handling"""
    receiver = SNMPTrapReceiver()
    
    # This should not crash even with weird data
    with patch('event_listener.logger'):
        event = receiver.parse_trap(b"", ("invalid", "addr"))
        
        # Should return None on error
        assert event is None


def test_syslog_parse_exception_handling():
    """Test syslog parsing exception handling"""
    listener = SyslogListener()
    
    # This should not crash
    with patch('event_listener.logger'):
        # Pass invalid addr that will cause exception
        event = listener.parse_syslog(b"test", None)
        
        # Should return None on error
        assert event is None
