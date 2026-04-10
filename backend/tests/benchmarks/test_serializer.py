"""
Benchmarks for RegistrationSerializer internals.

Focuses on _sync_activities (delete-all + bulk_create) since it runs on
every PUT and is the most likely bottleneck as activity count grows.
"""
import pytest
from guests.models import Activity, Registration, RegistrationActivity
from guests.serializers import RegistrationSerializer


@pytest.fixture
def registration(db):
    return Registration.objects.create(registration_id="bench-reg-1")


ALL_ACTIVITIES = list(Activity.values)


@pytest.mark.benchmark(group="sync_activities")
def test_sync_activities_empty(benchmark, registration):
    """Baseline: replace existing activities with an empty list."""
    RegistrationActivity.objects.bulk_create(
        [RegistrationActivity(registration=registration, activity=a) for a in ALL_ACTIVITIES]
    )
    benchmark(lambda: RegistrationSerializer()._sync_activities(registration, []))


@pytest.mark.benchmark(group="sync_activities")
def test_sync_activities_full(benchmark, registration):
    """Replace existing activities with all four options."""
    benchmark(lambda: RegistrationSerializer()._sync_activities(registration, ALL_ACTIVITIES))


@pytest.mark.benchmark(group="upsert")
def test_upsert_create(benchmark, db):
    """PUT that creates a new record (no prior row)."""
    counter = {"n": 0}

    def run():
        counter["n"] += 1
        reg_id = f"bench-new-{counter['n']}"
        s = RegistrationSerializer(data={
            "registration_id": reg_id,
            "flight_info": "AA123 Thu 6pm",
            "meal_preference": "vegan",
            "activities": ["yoga_class", "massage"],
        })
        s.is_valid(raise_exception=True)
        s.save()

    benchmark(run)


@pytest.mark.benchmark(group="upsert")
def test_upsert_update(benchmark, registration):
    """PUT that updates an existing record."""
    def run():
        s = RegistrationSerializer(registration, data={
            "flight_info": "UA456 Fri 9am",
            "meal_preference": "vegetarian",
            "activities": ["breath_work"],
        }, partial=True)
        s.is_valid(raise_exception=True)
        s.save()

    benchmark(run)
