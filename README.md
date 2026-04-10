# Retreat Guru

A calendar app for managing retreat registrations. Pulls live registration data from the Retreat Guru API and lets staff attach supplemental guest info (flight details, meal preference, activities) per registration.

Live at: **https://gobaan.com/retreat-guru/**

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Django 6 + Django REST Framework, SQLite |
| Frontend | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 + DaisyUI v5 |
| Backend tests | pytest + pytest-benchmark + Locust |
| Frontend tests | Vitest + Testing Library + Playwright |

---

## Project Layout

```
retreat-guru/
├── backend/                    # Django project
│   ├── retreat_guru/           # Project config
│   │   ├── settings.py         # ALLOWED_HOSTS, DB, RETREAT_GURU_TOKEN env var
│   │   └── urls.py             # Mounts /admin/ and /api/
│   ├── guests/                 # The only Django app
│   │   ├── models.py           # Registration + RegistrationActivity + enums
│   │   ├── serializers.py      # RegistrationSerializer (handles activities list)
│   │   ├── views.py            # RetreatGuruRegistrationsProxy + RegistrationInfo
│   │   ├── urls.py             # API routes (see below)
│   │   └── migrations/
│   ├── tests/benchmarks/       # Performance tests
│   │   ├── test_serializer.py  # Benchmarks for _sync_activities and upsert
│   │   ├── test_views.py       # Benchmarks for HTTP endpoints
│   │   ├── locustfile.py       # Load test (20 concurrent users)
│   │   └── results/            # Saved benchmark output and Locust HTML report
│   ├── requirements.txt
│   └── pytest.ini
│
└── frontend/                   # Vite + React app
    ├── src/
    │   ├── App.jsx             # Root: fetches registrations, renders Calendar + modal
    │   ├── App.css             # Calendar grid and ribbon chip styles
    │   ├── components/
    │   │   ├── Calendar.jsx    # Monthly grid, slot scheduling, ribbon chips
    │   │   └── RegistrationPanel.jsx  # Modal: view/edit/delete registration info
    │   ├── api/
    │   │   ├── retreatGuru.js  # fetchRegistrations() → GET /api/retreat-guru/registrations/
    │   │   └── localBackend.js # fetchRegistrationInfo / saveRegistrationInfo / deleteRegistrationInfo
    │   └── tests/              # Vitest unit + snapshot tests
    │       ├── fixtures.js     # Shared registration fixtures
    │       ├── Calendar.test.jsx
    │       └── RegistrationPanel.test.jsx
    ├── e2e/                    # Playwright tests
    │   ├── calendar.spec.js    # Visual snapshots + load time assertions
    │   └── snapshots/          # Committed PNG baselines
    ├── vite.config.js          # base: '/retreat-guru/', Vitest config, dev proxy
    └── playwright.config.js
```

---

## API Routes

All routes are under `/api/`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/retreat-guru/registrations/` | Proxies to Retreat Guru API (avoids browser CORS) |
| `GET` | `/api/registrations/<id>/` | Fetch saved supplemental info for a registration |
| `PUT` | `/api/registrations/<id>/` | Create or update supplemental info (upsert) |
| `DELETE` | `/api/registrations/<id>/` | Delete supplemental info |

---

## Data Model

The Retreat Guru API already includes one participant per registration. This app stores only the **supplemental info** that Retreat Guru doesn't track:

```
Registration
  registration_id  CharField  (unique — matches Retreat Guru's registration id)
  flight_info      TextField
  meal_preference  CharField  (omnivore / vegetarian / vegan)

RegistrationActivity
  registration     ForeignKey → Registration
  activity         CharField  (yoga_class / juice_detox / massage / breath_work)
  (unique_together: registration + activity)
```

---

## Key Frontend Concepts

**Greedy slot scheduling (`assignSlots` in Calendar.jsx)**
Registrations that span multiple days are assigned a stable vertical slot index so the ribbon chip stays on the same row across all days it covers. Works like a calendar event layout: sort by start date, then greedily place each registration into the first slot whose previous occupant has already ended.

**Ribbon chips**
Each day cell renders a fixed-length array (`slottedRegs`) where the index is the slot number. Slots with no registration on that day render as invisible placeholders so row heights stay consistent across adjacent cells.

**Month-boundary titles**
When a multi-day registration spans into a new month, the program name is repeated on the 1st of that month so it's clear which program the ribbon belongs to.

---

## Running Locally

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend**
```bash
cd frontend
npm install
npm run dev        # proxies /api → localhost:8000
```

App is at `http://localhost:5173`.

**Override the Retreat Guru API token**
```bash
export RETREAT_GURU_TOKEN=your_token_here
export RETREAT_GURU_URL=https://your-instance.retreat.guru/api/v1/registrations
```

---

## Tests

**Backend benchmarks**
```bash
cd backend
pytest tests/benchmarks/ -v --benchmark-json=tests/benchmarks/results/benchmark_results.json
```

**Backend load test** (requires Django server running on port 8000)
```bash
python -m locust -f tests/benchmarks/locustfile.py --headless -u 20 -r 5 --run-time 30s --host http://localhost:8000
```

**Frontend unit + snapshot tests**
```bash
cd frontend
npm test
```

**Frontend e2e + visual regression + load time** (requires `npm run dev` running)
```bash
npm run test:e2e

# After an intentional visual change, update the PNG baselines:
npm run test:e2e:update
```

---

## Deployment

The app is deployed on `gobaan.com` with:
- **Gunicorn** serving Django on `127.0.0.1:8001` (managed by systemd as `retreat-guru.service`)
- **Nginx** serving the Vite build from `/var/www/html/retreat-guru/` and proxying `/api/` to Gunicorn
- **Let's Encrypt** TLS via Certbot

To redeploy after changes:
```bash
# Frontend
cd frontend && npm run build
scp -r dist/* lordofall@gobaan.com:~/retreat-guru/frontend-dist-new
ssh lordofall@gobaan.com "sudo cp -r ~/retreat-guru/frontend-dist-new/. /var/www/html/retreat-guru/"

# Backend
scp -r backend/guests backend/retreat_guru backend/manage.py lordofall@gobaan.com:~/retreat-guru/backend/
ssh lordofall@gobaan.com "sudo systemctl restart retreat-guru"
```
