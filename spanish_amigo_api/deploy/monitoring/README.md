# Cloud Run Monitoring Setup

This directory contains monitoring-as-code for SpanishAmigo backend.

It configures:

- A custom dashboard for Cloud Run service health.
- Alert policies for:
  - 5xx error spikes.
  - high p95 latency.
  - authentication failure spikes (401/403 from request logs).

## Required Inputs

Set these environment variables before running setup:

```bash
export PROJECT_ID="your-gcp-project-id"
export SERVICE_NAME="spanish-amigo-api"
export REGION="us-central1"
export NOTIFICATION_CHANNELS="projects/your-gcp-project-id/notificationChannels/1234567890123456789"
```

`NOTIFICATION_CHANNELS` can contain multiple channels separated by commas.

## Apply Monitoring Configuration

```bash
cd spanish_amigo_api/deploy/monitoring
bash setup_monitoring.sh
```

## What the Script Creates

1. Logs-based metric: `spanishamigo_auth_failures`
2. Alert policy: `SpanishAmigo Cloud Run 5xx Spike`
3. Alert policy: `SpanishAmigo Cloud Run High P95 Latency`
4. Alert policy: `SpanishAmigo Auth Failures Spike`
5. Dashboard: `SpanishAmigo Cloud Run Overview`

## Notes

- The script uses `gcloud monitoring policies create` and `gcloud monitoring dashboards create`.
- If objects already exist, the script skips them.
- For strict idempotency updates, export the existing policy/dashboard IDs and patch via API in a future phase.
