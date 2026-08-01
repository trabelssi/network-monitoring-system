"""
Shared pytest fixtures for Python service tests

Phase 3, Step 4, Part 7: Consolidate duplicate TestClient fixture
"""

import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    """
    Create FastAPI test client for HTTP endpoint testing
    
    Used by: test_main_metrics.py
    Can be imported by any test file needing HTTP testing
    """
    return TestClient(app)
