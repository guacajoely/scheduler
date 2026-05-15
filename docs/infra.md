# Infrastructure Notes

This document describes the current AWS layout for the Scheduler app

## Current Resources
- **DNS / Domain:** Route 53 hosted zone for `joels.codes`
- **Frontend Delivery:** S3 bucket behind CloudFront
- **Backend API:** ECS Fargate service fronted by an Application Load Balancer (ALB)
- **Container Registry:** ECR stores backend images
- **Database:** RDS PostgreSQL
- **Certificates:** ACM cert covering wildcard subdomains 

At a high level:
1. Browser requests `scheduler.joels.codes` via CloudFront.
2. CloudFront serves static frontend files from S3.
3. Frontend calls API at `api.joels.codes`.
4. Route 53 alias points `api.joels.codes` to ALB.
5. ALB forwards to ECS task(s) on container port `3000`.
6. Backend reads/writes data in RDS Postgres.

## AWS Components and Responsibilities

## Route 53
- Hosts DNS for `joels.codes`.
- Alias records are used for:
  - Frontend subdomain -> CloudFront distro
  - API subdomain -> ALB

## CloudFront + S3 (Frontend)
- Frontend is built with Vite and uploaded from `frontend/dist`.
- S3 stores build artifacts (`index.html`, `assets/*`).
- CloudFront provides caching, TLS termination, and custom domain support.
- Typical SPA behavior:
  - Default root object: `index.html`
  - 403/404 fallback to `index.html` for client-side routes

## ECR + ECS Fargate + ALB (Backend)
- Backend image is built from `backend/Dockerfile` and pushed to ECR.
- ECS service runs tasks from a task definition revision.
- ALB listeners:
  - 80 for HTTP (usually redirect to HTTPS)
  - 443 for HTTPS with ACM cert
- Target group health check path: `/health`
- Container mapping: backend container on port `3000`

## RDS PostgreSQL
- Backend connects through `DATABASE_URL`.
- Drizzle migrations are applied via `npm run db:migrate`.
- Seed script can reset and repopulate demo data via `npm run seed`.

## Security Groups
- **ALB SG:** allows inbound 80/443 from internet.
- **Task SG:** allows inbound 3000 from ALB SG.
- **RDS SG:** allows inbound 5432 from Task SG (and can whitelist local IP if need to connect for maintenance).

## Runtime Configuration
Core backend env vars:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_TRUSTED_ORIGINS`

Core frontend env var:
- `VITE_API_BASE_URL`

## Deployment Model (Current)
- Backend deploy: build image -> push ECR -> update ECS task/service.
- Frontend deploy: build static assets -> sync to S3 -> invalidate CloudFront.

**TO-DO**: Add GitHub Actions workflows to automate both paths.

## Practical Notes
- We have to backend env vars by creating an ECS task definition revision
- If backend auth or domain settings change, create a new task revision and force a service deployment.
- If frontend environment values change, rebuild before uploading; CloudFront invalidation speeds up 
