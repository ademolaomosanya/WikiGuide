# Architecture

WikiGuide is split into a browser client and an HTTP API.

```text
React/Vite client -> Django REST API -> application services -> external APIs
                                     -> Django ORM -> database
```

## Frontend

`frontend/src` groups UI components, pages, API calls, reusable hooks, and shared
TypeScript types. `App.tsx` is the application root, while `main.tsx` owns browser
bootstrapping.

## Backend

`backend/config` contains project-level Django configuration. `backend/core`
contains the initial domain model and API. Integrations and domain operations
live in `core/services` so views stay focused on HTTP concerns.

The starter uses SQLite locally. A production deployment should configure a
managed database, a production WSGI/ASGI server, static-file hosting, and secrets
through environment variables.
