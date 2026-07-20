# WikiGuide

WikiGuide helps readers become lifelong Wikimedia contributors through guided
learning, gamification, chatbots, and personalized impact tracking.

## Stack

- React, TypeScript, and Vite
- Django and Django REST Framework
- SQLite for local development

## Local development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

The API health check is available at `http://localhost:8000/api/health/`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and expects the backend at
`http://localhost:8000` by default.

See [docs/architecture.md](docs/architecture.md) for the project layout and
[CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes.
