# Backend Deployment (Cloud Run)

This project deploys from GitHub Actions using `.github/workflows/backend-deploy.yml`.

## Required GitHub Secrets

- `GCP_PROJECT_ID`
- `GCP_REGION` (example: `us-central1`)
- `CLOUD_RUN_SERVICE` (example: `spanish-amigo-api`)
- `ARTIFACT_REPOSITORY` (example: `backend-images`)
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT_EMAIL`
- `DATABASE_URL` (for migration step)
- `GEMINI_API_KEY` (for migration/runtime env validation)
- `FIREBASE_PROJECT_ID`

## Required GCP Secret Manager Secrets

- `DATABASE_URL`
- `GEMINI_API_KEY`

The deploy workflow maps these to Cloud Run env vars:
- `DATABASE_URL=DATABASE_URL:latest`
- `GEMINI_API_KEY=GEMINI_API_KEY:latest`

## Deploy Flow

1. Build Docker image from `spanish_amigo_api/Dockerfile`.
2. Push image to Artifact Registry.
3. Run `alembic upgrade head`.
4. Deploy new revision to Cloud Run.

## Cloud Run IaC Template

- Service template: `spanish_amigo_api/deploy/cloudrun.service.yaml`
- Deploy script: `spanish_amigo_api/deploy/deploy_cloud_run.ps1`

Example:

```powershell
.\spanish_amigo_api\deploy\deploy_cloud_run.ps1 `
  -ProjectId "your-gcp-project-id" `
  -Region "us-central1" `
  -ServiceAccountEmail "cloud-run-sa@your-gcp-project-id.iam.gserviceaccount.com" `
  -ImageUri "us-central1-docker.pkg.dev/your-gcp-project-id/backend-images/spanish-amigo-api:YOUR_SHA" `
  -ServiceName "spanish-amigo-api"
```

## Notes

- Workflow triggers on `main` pushes touching backend files, and manual run (`workflow_dispatch`).
- `ENV=production` is set during deploy.
- Workflow now verifies `/health` after deploy before finishing.

## First Live Deploy Checklist

1. Add all required GitHub secrets listed above.
2. Confirm GCP service account has:
   - `roles/run.admin`
   - `roles/iam.serviceAccountUser`
   - `roles/artifactregistry.writer`
   - `roles/secretmanager.secretAccessor`
   - `roles/cloudsql.client` (only if using Cloud SQL; skip for Neon)
3. Ensure Secret Manager has `DATABASE_URL` and `GEMINI_API_KEY` with latest versions.
4. Run `Backend Deploy (Cloud Run)` from GitHub Actions via `workflow_dispatch`.
5. Confirm workflow succeeds and `/health` check passes.
