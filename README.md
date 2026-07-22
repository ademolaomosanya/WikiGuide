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

### Suggested edits

The dashboard's **Gamification** section requests live French Wikipedia
maintenance candidates from `GET /api/suggested-edits/`, then opens the selected
article in Wikipedia's VisualEditor. Results are cached briefly to avoid
unnecessary requests to Wikimedia. Set `WIKIMEDIA_USER_AGENT` in `backend/.env`
to a descriptive value with a working project URL or contact address.

### WikiGuide chatbot

```json
{
  "message": "How do I upload an image?"
}
```

Chat answers are grounded only in active `ChatResource` database records. The
initial resources are created by migration `0005_chatresource`; staff can add or
update resources through Django admin. Retrieval and answer generation use only
Django ORM keyword matching and stored resource text. No LLM, API key, embeddings,
or external search service is required.

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
