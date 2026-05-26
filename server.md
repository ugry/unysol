# Unysol — Production Server

> **Deployed:** 26 May 2026
> **Version:** v2.7.1

---

## Server Access

| Field | Value |
|---|---|
| IP | `212.224.88.47` |
| SSH | `ssh root@212.224.88.47` |
| OS | Ubuntu 22.04 (Jammy) |
| Hostname | srv865193920 |
| RAM | 1 GB (+ 2 GB swap) |
| Disk | 30 GB (25 GB free) |
| Docker | v29.5.2 |

---

## Deployed Services

| Service | Port | Container |
|---|---|---|
| Frontend (landing + app) | `:80` | `unysol-frontend` |
| Backend API | `:8080` | `unysol-backend` |
| PostgreSQL 16 | `127.0.0.1:5433` | `unysol-db` |
| Redis 7 | `127.0.0.1:6380` | `unysol-redis` |

---

## URLs

| URL | Purpose |
|---|---|
| `http://212.224.88.47/` | Landing page + app |
| `http://212.224.88.47/login` | Login / signup |
| `http://212.224.88.47/admin/login` | Admin login |
| `http://212.224.88.47:8080/api/system/health` | Backend health |

---

## Project Path

```
/root/unysol/
├── docker-compose.yml
├── .env                    (production secrets)
├── backend/
│   ├── Dockerfile
│   └── server              (pre-built Go binary)
├── frontend/
│   ├── Dockerfile
│   └── dist/               (pre-built React app)
└── database/
    └── 01-schema.sql
```

---

## Management Commands

```bash
# SSH into server
ssh root@212.224.88.47

# View logs
cd /root/unysol
docker compose logs -f --tail 50

# Restart all
docker compose down && docker compose up -d

# Rebuild (after code push)
git pull && docker compose up -d --build

# View status
docker compose ps

# Backup database
docker exec unysol-db pg_dump -U unysol unysol > backup_$(date +%Y%m%d).sql
```

---

## Environment Variables

Stored in `/root/unysol/.env`:
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `JWT_SECRET` (64-char hex)
- `DATABASE_URL`
- `GRAFANA_ADMIN_PASSWORD`

---

## Notes

- No reverse proxy (yet) — frontend on :80, backend on :8080 directly
- No TLS/SSL (yet) — HTTP only
- No monitoring stack (removed to fit 1GB RAM)
- Swap added (2GB) for build headroom
- Frontend uses pre-built dist + `serve` (lightweight), API URL baked in at build time
- Backend uses pre-compiled Go binary (no source build on server)
