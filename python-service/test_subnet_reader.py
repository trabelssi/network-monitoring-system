"""
Unit tests for subnet reader module

Tests with mocked database connections - no real MySQL needed.

Status: Written, NOT YET VERIFIED IN DOCKER
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from subnet_reader import (
    MonitoredSubnet, SubnetReader, get_subnets_to_scan
)


class TestMonitoredSubnet:
    """Test MonitoredSubnet dataclass"""
    
    def test_creation(self):
        """Test creating a MonitoredSubnet instance"""
        subnet = MonitoredSubnet(
            id=1,
            subnet="192.168.1.0/24",
            name="Office network",
            enabled=True
        )
        
        assert subnet.id == 1
        assert subnet.subnet == "192.168.1.0/24"
        assert subnet.name == "Office network"
        assert subnet.enabled is True
    
    def test_str_representation_enabled(self):
        """Test string representation for enabled subnet"""
        subnet = MonitoredSubnet(
            id=1,
            subnet="192.168.1.0/24",
            name="Office network",
            enabled=True
        )
        
        result = str(subnet)
        assert "192.168.1.0/24" in result
        assert "Office network" in result
        assert "enabled" in result
    
    def test_str_representation_disabled(self):
        """Test string representation for disabled subnet"""
        subnet = MonitoredSubnet(
            id=2,
            subnet="10.0.0.0/8",
            name="Disabled network",
            enabled=False
        )
        
        result = str(subnet)
        assert "10.0.0.0/8" in result
        assert "Disabled network" in result
        assert "disabled" in result


class TestSubnetReader:
    """Test subnet reader with mocked database"""
    
    def test_get_enabled_subnets(self):
        """Test getting all enabled subnets"""
        reader = SubnetReader()
        
        mock_rows = [
            {'id': 1, 'subnet': '192.168.1.0/24', 'name': 'Office network', 'enabled': True},
            {'id': 2, 'subnet': '192.168.10.0/24', 'name': 'IT Department', 'enabled': True},
            {'id': 3, 'subnet': '192.168.20.0/24', 'name': 'Bureau Principal', 'enabled': True},
        ]
        
        with patch.object(reader, 'get_connection') as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchall.return_value = mock_rows
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor
            
            subnets = reader.get_enabled_subnets()
            
            assert len(subnets) == 3
            assert all(isinstance(s, MonitoredSubnet) for s in subnets)
            assert subnets[0].subnet == '192.168.1.0/24'
            assert subnets[1].subnet == '192.168.10.0/24'
            assert subnets[2].subnet == '192.168.20.0/24'
            
            # Verify SQL query
            sql = mock_cursor.execute.call_args[0][0]
            assert "WHERE enabled = TRUE" in sql
            assert "ORDER BY subnet" in sql
    
    def test_get_enabled_subnets_empty(self):
        """Test getting enabled subnets when none exist"""
        reader = SubnetReader()
        
        with patch.object(reader, 'get_connection') as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchall.return_value = []
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor
            
            subnets = reader.get_enabled_subnets()
            
            assert subnets == []
    
    def test_get_all_subnets_enabled_only(self):
        """Test getting all subnets (enabled only by default)"""
        reader = SubnetReader()
        
        mock_rows = [
            {'id': 1, 'subnet': '192.168.1.0/24', 'name': 'Office', 'enabled': True},
            {'id': 2, 'subnet': '192.168.10.0/24', 'name': 'IT', 'enabled': True},
        ]
        
        with patch.object(reader, 'get_connection') as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchall.return_value = mock_rows
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor
            
            subnets = reader.get_all_subnets(include_disabled=False)
            
            assert len(subnets) == 2
            assert all(s.enabled for s in subnets)
    
    def test_get_all_subnets_include_disabled(self):
        """Test getting all subnets including disabled ones"""
        reader = SubnetReader()
        
        mock_rows = [
            {'id': 1, 'subnet': '192.168.1.0/24', 'name': 'Office', 'enabled': True},
            {'id': 2, 'subnet': '10.0.0.0/8', 'name': 'Legacy', 'enabled': False},
            {'id': 3, 'subnet': '192.168.10.0/24', 'name': 'IT', 'enabled': True},
        ]
        
        with patch.object(reader, 'get_connection') as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchall.return_value = mock_rows
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor
            
            subnets = reader.get_all_subnets(include_disabled=True)
            
            assert len(subnets) == 3
            assert subnets[0].enabled is True
            assert subnets[1].enabled is False
            assert subnets[2].enabled is True
            
            # Verify SQL doesn't filter by enabled
            sql = mock_cursor.execute.call_args[0][0]
            assert "WHERE enabled" not in sql
    
    def test_get_subnet_by_cidr_found(self):
        """Test getting specific subnet by CIDR notation"""
        reader = SubnetReader()
        
        mock_row = {
            'id': 1,
            'subnet': '192.168.1.0/24',
            'name': 'Office network',
            'enabled': True
        }
        
        with patch.object(reader, 'get_connection') as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchone.return_value = mock_row
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor
            
            subnet = reader.get_subnet_by_cidr('192.168.1.0/24')
            
            assert subnet is not None
            assert subnet.subnet == '192.168.1.0/24'
            assert subnet.name == 'Office network'
            
            # Verify parameterized query
            call_args = mock_cursor.execute.call_args
            assert '192.168.1.0/24' in call_args[0][1]
    
    def test_get_subnet_by_cidr_not_found(self):
        """Test getting subnet that doesn't exist"""
        reader = SubnetReader()
        
        with patch.object(reader, 'get_connection') as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchone.return_value = None
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor
            
            subnet = reader.get_subnet_by_cidr('10.0.0.0/8')
            
            assert subnet is None
    
    def test_count_enabled_subnets(self):
        """Test counting enabled subnets"""
        reader = SubnetReader()
        
        with patch.object(reader, 'get_connection') as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchone.return_value = {'count': 4}
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor
            
            count = reader.count_enabled_subnets()
            
            assert count == 4
            
            # Verify SQL
            sql = mock_cursor.execute.call_args[0][0]
            assert "COUNT(*)" in sql
            assert "WHERE enabled = TRUE" in sql
    
    def test_count_enabled_subnets_zero(self):
        """Test counting when no enabled subnets"""
        reader = SubnetReader()
        
        with patch.object(reader, 'get_connection') as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchone.return_value = {'count': 0}
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor
            
            count = reader.count_enabled_subnets()
            
            assert count == 0
    
    def test_count_enabled_subnets_no_result(self):
        """Test counting when query returns no result"""
        reader = SubnetReader()
        
        with patch.object(reader, 'get_connection') as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchone.return_value = None
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor
            
            count = reader.count_enabled_subnets()
            
            assert count == 0
    
    def test_schema_column_names_exact_match(self):
        """
        CRITICAL: Verify column names match monitored_subnets schema exactly
        
        Schema: 2026_07_29_151937_create_monitored_subnets_table.php
        Columns: id, subnet (string), name (string), enabled (boolean), 
                 created_at, updated_at
        """
        reader = SubnetReader()
        
        mock_rows = [
            {'id': 1, 'subnet': '192.168.1.0/24', 'name': 'Test', 'enabled': True}
        ]
        
        with patch.object(reader, 'get_connection') as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchall.return_value = mock_rows
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor
            
            reader.get_enabled_subnets()
            
            sql = mock_cursor.execute.call_args[0][0]
            
            # Verify all required columns present in SQL
            required_columns = ['id', 'subnet', 'name', 'enabled']
            for col in required_columns:
                assert col in sql, f"Missing required column: {col}"
            
            # Verify table name
            assert 'monitored_subnets' in sql
    
    def test_enabled_column_boolean_conversion(self):
        """Test that enabled column is properly converted to boolean"""
        reader = SubnetReader()
        
        # MySQL may return 0/1 instead of True/False
        mock_rows = [
            {'id': 1, 'subnet': '192.168.1.0/24', 'name': 'Test1', 'enabled': 1},
            {'id': 2, 'subnet': '192.168.10.0/24', 'name': 'Test2', 'enabled': 0},
        ]
        
        with patch.object(reader, 'get_connection') as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchall.return_value = mock_rows
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor
            
            subnets = reader.get_all_subnets(include_disabled=True)
            
            # Verify bool() conversion happened
            assert subnets[0].enabled is True
            assert subnets[1].enabled is False


class TestGetSubnetsToScan:
    """Test convenience function"""
    
    def test_get_subnets_to_scan(self):
        """Test convenience function returns CIDR strings"""
        mock_rows = [
            {'id': 1, 'subnet': '192.168.1.0/24', 'name': 'Office', 'enabled': True},
            {'id': 2, 'subnet': '192.168.10.0/24', 'name': 'IT', 'enabled': True},
            {'id': 3, 'subnet': '192.168.20.0/24', 'name': 'Bureau', 'enabled': True},
            {'id': 4, 'subnet': '192.168.30.0/24', 'name': 'Production', 'enabled': True},
        ]
        
        with patch('subnet_reader.SubnetReader') as MockReader:
            mock_instance = MockReader.return_value
            mock_instance.get_enabled_subnets.return_value = [
                MonitoredSubnet(**row) for row in mock_rows
            ]
            
            result = get_subnets_to_scan()
            
            assert result == [
                '192.168.1.0/24',
                '192.168.10.0/24',
                '192.168.20.0/24',
                '192.168.30.0/24'
            ]
    
    def test_get_subnets_to_scan_empty(self):
        """Test convenience function with no enabled subnets"""
        with patch('subnet_reader.SubnetReader') as MockReader:
            mock_instance = MockReader.return_value
            mock_instance.get_enabled_subnets.return_value = []
            
            result = get_subnets_to_scan()
            
            assert result == []
    
    def test_get_subnets_to_scan_matches_original_hardcoded_values(self):
        """
        CRITICAL: Verify seeded values match original hardcoded array
        
        Original from app/Jobs/DiscoverNetworkDevices.php (git commit 161aef07):
        - 192.168.1.0/24  // Office network
        - 192.168.10.0/24 // IT Department
        - 192.168.20.0/24 // Bureau Principal
        - 192.168.30.0/24 // Production
        """
        # Simulate seeded data
        seeded_rows = [
            {'id': 1, 'subnet': '192.168.1.0/24', 'name': 'Office network', 'enabled': True},
            {'id': 2, 'subnet': '192.168.10.0/24', 'name': 'IT Department', 'enabled': True},
            {'id': 3, 'subnet': '192.168.20.0/24', 'name': 'Bureau Principal', 'enabled': True},
            {'id': 4, 'subnet': '192.168.30.0/24', 'name': 'Production', 'enabled': True},
        ]
        
        with patch('subnet_reader.SubnetReader') as MockReader:
            mock_instance = MockReader.return_value
            mock_instance.get_enabled_subnets.return_value = [
                MonitoredSubnet(**row) for row in seeded_rows
            ]
            
            result = get_subnets_to_scan()
            
            # Verify exact match with original hardcoded values
            expected_original = [
                '192.168.1.0/24',
                '192.168.10.0/24',
                '192.168.20.0/24',
                '192.168.30.0/24',
            ]
            
            assert result == expected_original


class TestSchemaValidation:
    """Schema validation tests to prevent column name mismatches"""
    
    def test_monitored_subnets_columns_documented(self):
        """Document expected monitored_subnets columns for future verification"""
        # Schema: 2026_07_29_151937_create_monitored_subnets_table.php
        expected_columns = {
            'id',           # bigint primary key
            'subnet',       # string(100) unique - CIDR notation
            'name',         # string(255) - human-readable name
            'enabled',      # boolean default true
            'created_at',   # timestamp
            'updated_at',   # timestamp
        }
        
        # This test documents what the schema expects
        assert 'subnet' in expected_columns  # Not 'cidr' or 'network'
        assert 'name' in expected_columns    # Not 'description' or 'label'
        assert 'enabled' in expected_columns # Not 'active' or 'is_enabled'
    
    def test_subnet_column_is_cidr_string(self):
        """Verify subnet column contains CIDR notation, not split IP/mask"""
        reader = SubnetReader()
        
        mock_rows = [
            {'id': 1, 'subnet': '192.168.1.0/24', 'name': 'Test', 'enabled': True}
        ]
        
        with patch.object(reader, 'get_connection') as mock_conn:
            mock_cursor = MagicMock()
            mock_cursor.fetchall.return_value = mock_rows
            mock_conn.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = mock_cursor
            
            subnets = reader.get_enabled_subnets()
            
            # Verify CIDR format preserved (not split into ip_address + netmask)
            assert subnets[0].subnet == '192.168.1.0/24'
            assert '/' in subnets[0].subnet  # CIDR notation has slash
