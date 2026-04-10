"""
Benchmarks for RegistrationInfo HTTP endpoints using Django's test client.

The proxy view is excluded — its latency is dominated by the external
Retreat Guru API, which is mocked here to isolate our own overhead.
"""
import json
import pytest
from unittest.mock import patch, MagicMock
from django.test import Client
from guests.models import Registration, RegistrationActivity


@pytest.fixture
def client():
    return Client()


@pytest.fixture
def saved_registration(db):
    reg = Registration.objects.create(
        registration_id="view-bench-1",
        flight_info="AA123 Thu 6pm",
        meal_preference="vegan",
    )
    RegistrationActivity.objects.create(registration=reg, activity="yoga_class")
    return reg


@pytest.mark.benchmark(group="http_get")
def test_get_existing(benchmark, client, saved_registration):
    """GET for a registration that exists."""
    def run():
        return client.get("/api/registrations/view-bench-1/")
    result = benchmark(run)
    assert result.status_code == 200


@pytest.mark.benchmark(group="http_get")
def test_get_missing(benchmark, client, db):
    """GET for a registration that does not exist (404 path)."""
    def run():
        return client.get("/api/registrations/does-not-exist/")
    result = benchmark(run)
    assert result.status_code == 404


@pytest.mark.benchmark(group="http_put")
def test_put_create(benchmark, client, db):
    """PUT that inserts a new row each iteration."""
    counter = {"n": 0}

    def run():
        counter["n"] += 1
        return client.put(
            f"/api/registrations/bench-put-{counter['n']}/",
            data=json.dumps({"flight_info": "UA1 9am", "meal_preference": "omnivore", "activities": []}),
            content_type="application/json",
        )

    result = benchmark(run)
    assert result.status_code == 200


@pytest.mark.benchmark(group="http_put")
def test_put_update(benchmark, client, saved_registration):
    """PUT that updates the same existing row each iteration."""
    payload = json.dumps({"flight_info": "UA1 9am", "meal_preference": "vegetarian", "activities": ["massage"]})

    def run():
        return client.put(
            "/api/registrations/view-bench-1/",
            data=payload,
            content_type="application/json",
        )

    result = benchmark(run)
    assert result.status_code == 200


@pytest.mark.benchmark(group="http_proxy")
def test_proxy_overhead(benchmark, client):
    """GET proxy — external call is mocked to measure only our own overhead."""
    mock_response = MagicMock()
    mock_response.json.return_value = [{"id": 1, "program": "Test"}]
    mock_response.raise_for_status = lambda: None

    with patch("guests.views.http_requests.get", return_value=mock_response):
        def run():
            return client.get("/api/retreat-guru/registrations/")
        result = benchmark(run)
        assert result.status_code == 200
