# Cloud Run Monitoring Setup

This directory contains monitoring-as-code for the SpanishAmigo FastAPI backend on Google Cloud Run.

The setup is intentionally lightweight: it creates the minimum useful production visibility without changing application code or deploying new infrastructure runtimes.

## What It Creates

- Logs-based metric: `spanishamigo_auth_failures`
- Alert policy: `SpanishAmigo Cloud Run 5xx Spike`
- Alert policy: `SpanishAmigo Cloud Run High P95 Latency`
- Alert policy: `SpanishAmigo Auth Failures Spike`
- Dashboard: `SpanishAmigo Cloud Run Overview`

## Preferred Setup Path

Use the manual GitHub Actions workflow:

```text
.github/workflows/monitoring-bootstrap.yml
```

Run it from GitHub:

1. Open the repository on GitHub.
2. Go to `Actions`.
3. Select `Monitoring Bootstrap`.
4. Click `Run workflow`.
5. Confirm the run is green.
6. Save the run URL in `local_backend_docs/BACKEND_GO_LIVE_READINESS_CHECKLIST.md`.

## Required GitHub Secrets

The workflow reads these existing deploy secrets:

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `CLOUD_RUN_SERVICE`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT_EMAIL`

It also requires this monitoring-specific secret:

```text
GCP_MONITORING_NOTIFICATION_CHANNELS
```

Value format:

```text
projects/<your-gcp-project-id>/notificationChannels/<channel-id>
```

Multiple notification channels can be comma-separated. The current setup script uses the first channel for the alert policy templates.

## Required Google Cloud Permissions

The GitHub deploy service account needs permission to create/read:

- Cloud Monitoring dashboards
- Cloud Monitoring alert policies
- Cloud Logging logs-based metrics

Recommended roles for this bootstrap step:

- `roles/monitoring.editor`
- `roles/logging.configWriter`

If your organization prefers stricter access, create a custom role with only the needed Monitoring and Logging metric permissions.

## Local Manual Run

Use this only when you are authenticated with `gcloud` locally and intentionally applying monitoring from your machine.

```bash
cd spanish_amigo_api/deploy/monitoring
export PROJECT_ID="your-gcp-project-id"
export SERVICE_NAME="spanish-amigo-api"
export REGION="us-central1"
export NOTIFICATION_CHANNELS="projects/your-gcp-project-id/notificationChannels/1234567890123456789"
bash setup_monitoring.sh
```

Windows note: run the script from Git Bash, WSL, or GitHub Actions. PowerShell is not the target shell for this script.

## Idempotency Behavior

The script is safe to re-run:

- Existing logs-based metric is skipped.
- Existing alert policies with matching display names are skipped.
- Existing dashboard with matching display name is skipped.

It does not currently patch existing policies in place. If thresholds or notification channels change later, either update through the Google Cloud Console or add a future patch/update mode.

## Troubleshooting

If the workflow fails with missing inputs:

- Confirm all required GitHub secrets exist.
- Confirm `GCP_MONITORING_NOTIFICATION_CHANNELS` is the full notification channel resource path.

If the workflow fails with permission errors:

- Confirm the service account used by Workload Identity Federation has Monitoring and Logging metric configuration permissions.

If alerts are created but no notifications arrive:

- Verify the notification channel is enabled and verified in Google Cloud Monitoring.
- Trigger a test notification from the Google Cloud Console.

## Current Scope

Included:

- Backend service health dashboard.
- 5xx, latency, and auth-failure alerting.

Not included yet:

- Token/cost usage metrics for Gemini.
- Per-endpoint LLM cost dashboard.
- Rate limiting alerts.
