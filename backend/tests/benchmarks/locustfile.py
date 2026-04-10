"""
Locust load test for RegistrationInfo endpoints.

Usage (from backend/):
    locust -f tests/benchmarks/locustfile.py --headless -u 20 -r 5 --run-time 30s --host http://localhost:8000

Results are written to tests/benchmarks/results/ via --html and --csv flags
in the run script.
"""
from locust import HttpUser, task, between


REGISTRATION_IDS = [f"load-test-reg-{i}" for i in range(1, 21)]

PAYLOADS = [
    {"flight_info": "AA123 Thu 6pm", "meal_preference": "vegan",       "activities": ["yoga_class", "massage"]},
    {"flight_info": "UA456 Fri 9am", "meal_preference": "vegetarian",  "activities": ["breath_work"]},
    {"flight_info": "",              "meal_preference": "omnivore",     "activities": []},
]


class RegistrationUser(HttpUser):
    wait_time = between(0.05, 0.2)

    def on_start(self):
        # Seed a record for this user so GETs have something to hit.
        # Use id() to get a stable per-instance index for bucket assignment.
        self._idx = id(self) % len(REGISTRATION_IDS)
        self.reg_id = REGISTRATION_IDS[self._idx]
        self.client.put(
            f"/api/registrations/{self.reg_id}/",
            json=PAYLOADS[0],
            name="/api/registrations/[id]/ PUT",
        )

    @task(4)
    def get_registration(self):
        self.client.get(
            f"/api/registrations/{self.reg_id}/",
            name="/api/registrations/[id]/ GET",
        )

    @task(2)
    def update_registration(self):
        payload = PAYLOADS[self._idx % len(PAYLOADS)]
        self.client.put(
            f"/api/registrations/{self.reg_id}/",
            json=payload,
            name="/api/registrations/[id]/ PUT",
        )

    @task(1)
    def delete_and_recreate(self):
        self.client.delete(
            f"/api/registrations/{self.reg_id}/",
            name="/api/registrations/[id]/ DELETE",
        )
        self.client.put(
            f"/api/registrations/{self.reg_id}/",
            json=PAYLOADS[0],
            name="/api/registrations/[id]/ PUT",
        )
