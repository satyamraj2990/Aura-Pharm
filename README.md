# Aura-Pharm Monorepo

Aura-Pharm is a multi-app workspace with a React frontend, an Express backend, and supporting project artifacts.

## Repository Structure

- `frontend/`: Main React + TypeScript + Vite web app
- `backend/`: Express API backend (AI assistant proxy and room-related endpoints)
- `focusroom/`: Additional app workspace artifacts
- `webDev-4.md`: Project notes

## Quick Start

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:8787` by default.

## Environment Variables

- Frontend variables are configured in `frontend/.env.local`
- Backend variables are configured in `backend/.env`

Refer to each sub-project README for detailed setup:
- `frontend/README.md`
- `backend/README.md`

## Build

From each app directory:

```bash
npm run build
```

## Notes

- Smart Focus Room supports shared rooms, focus mode timer, allowed-site navigation, and chat/file sharing.
- If a site blocks iframe embedding (for example, some external platforms), the app provides a fallback external-open experience.
