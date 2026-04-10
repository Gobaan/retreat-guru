# RetreatGuru Interview Project

## Style Guide (Pragmatic Programmer)
- DRY: no duplication. Extract repeated logic immediately.
- Small functions: single responsibility, short bodies. If it needs a comment to explain what it does, extract it.
- Names matter: reveal intent. No abbreviations unless universal (id, url, etc).
- No speculative generality: build what is needed now, not what might be needed later.
- Fail fast: validate at boundaries, raise early, don't swallow errors.
- Flat over nested: prefer guard clauses over deep nesting.

## Stack
- Backend: Django + Django REST Framework, SQLite
- Frontend: React

## Structure
- `backend/` — Django project
- `frontend/` — React app
