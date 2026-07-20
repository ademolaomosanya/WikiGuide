# Contributing to WikiGuide

Thank you for helping improve WikiGuide.

1. Create a focused branch from `main`.
2. Follow the setup instructions in the README.
3. Add or update tests for behavior you change.
4. Run the frontend and backend checks locally.
5. Open a pull request describing the problem and your solution.

## Checks

```bash
cd frontend && npm run build
cd backend && python manage.py check && python manage.py test
```

Keep credentials out of commits. Add new environment variables to the relevant
example environment file.
