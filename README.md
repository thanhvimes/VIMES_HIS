# VIMES HIS

VIMES HIS is a modular hospital information system with a React/Vite frontend, an Express/TypeScript API, PostgreSQL integration and an Android shell built with Capacitor.

## Local development

Use Node.js 22 and a dedicated PostgreSQL development database. Never use a production database for local development or automated tests.

1. Copy `.env.example` and `backend/.env.example` to their untracked `.env` counterparts.
2. Replace every placeholder. `JWT_SECRET` and `VIMES_SECURITY_KEY` must each be at least 32 characters.
3. Run `npm ci` in the repository root and in `backend/`.
4. Start the backend with `npm run dev` from `backend/`, then run `npm run dev` at the root.

Provider, database, SMS, PACS and signing credentials must stay on the backend. Clinical AI calls use the authenticated backend proxy.

## Quality gates

- Root: `npm run typecheck`, `npm run build`, `npm run bundle:check`, `npm run security:check`.
- Backend: `npm run typecheck`, `npm test`.
- Pull requests run these checks and dependency audits in GitHub Actions.

## Security and operations

- `/api` routes require a typed JWT by default. Only login, health, booking registration and explicitly listed kiosk endpoints are public.
- Staff and patient-portal tokens are not interchangeable.
- Configure `CORS_ORIGINS` explicitly in each deployed environment.
- Apply numbered SQL files from `backend/migrations`; never modify production schema manually.
- Back up the database and uploaded clinical files before deployment and verify restoration regularly.
- Rotate every credential that has appeared in Git history. Removing a file from the current tree does not revoke an exposed credential.

## Deployment & Installation Guide

- 📄 **[Hướng dẫn Triển khai cho Kỹ thuật viên (Step-by-step)](modules/health-check-sync/docs/HUONG_DAN_TRIEN_KHAI_CHO_KY_THUAT.md)**: Chi tiết từng bước kéo mã nguồn, cấu hình `.env`, tự động chạy Migration CSDL và thiết lập phân hệ Khám sức khỏe VNeID QĐ 1551 cho khách hàng.

Generate artifacts from source with `npm run build`; do not commit them. Deploy immutable frontend and backend revisions together, run migrations against staging first, perform health/auth smoke tests, and retain a tested database restore point for rollback.
