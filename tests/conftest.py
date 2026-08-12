"""
tests/conftest.py
==================
Shared pytest configuration and session-level fixtures.
"""
import os
import sys

# Ensure the project root is on sys.path so `from main import app` resolves.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
