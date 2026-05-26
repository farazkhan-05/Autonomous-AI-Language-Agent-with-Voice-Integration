#!/usr/bin/env bash
set -euo pipefail

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required env var: ${name}" >&2
    exit 1
  fi
}

require_var PROJECT_ID
require_var SERVICE_NAME
require_var REGION
require_var NOTIFICATION_CHANNELS

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

AUTH_METRIC_NAME="spanishamigo_auth_failures"

echo "Ensuring logs-based metric exists: ${AUTH_METRIC_NAME}"
if ! gcloud logging metrics describe "${AUTH_METRIC_NAME}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud logging metrics create "${AUTH_METRIC_NAME}" \
    --project "${PROJECT_ID}" \
    --description "Count of Cloud Run request log auth failures (401/403) for SpanishAmigo" \
    --log-filter "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${SERVICE_NAME}\" AND logName=\"projects/${PROJECT_ID}/logs/run.googleapis.com%2Frequests\" AND (httpRequest.status=401 OR httpRequest.status=403)"
else
  echo "Metric already exists, skipping create."
fi

first_channel="$(echo "${NOTIFICATION_CHANNELS}" | cut -d',' -f1)"

render_template() {
  local src="$1"
  local dst="$2"
  sed \
    -e "s|__SERVICE_NAME__|${SERVICE_NAME}|g" \
    -e "s|__REGION__|${REGION}|g" \
    -e "s|__NOTIFICATION_CHANNEL__|${first_channel}|g" \
    "${src}" > "${dst}"
}

create_policy_if_missing() {
  local display_name="$1"
  local rendered_file="$2"
  local existing
  existing="$(gcloud monitoring policies list --project "${PROJECT_ID}" --format="value(displayName)" --filter="displayName=\"${display_name}\"" || true)"
  if [[ -n "${existing}" ]]; then
    echo "Policy exists: ${display_name}"
    return
  fi
  gcloud monitoring policies create \
    --project "${PROJECT_ID}" \
    --policy-from-file="${rendered_file}"
}

render_template "${SCRIPT_DIR}/alert-policy-5xx.json" "${TMP_DIR}/alert-policy-5xx.json"
render_template "${SCRIPT_DIR}/alert-policy-latency-p95.json" "${TMP_DIR}/alert-policy-latency-p95.json"
render_template "${SCRIPT_DIR}/alert-policy-auth-failures.json" "${TMP_DIR}/alert-policy-auth-failures.json"
render_template "${SCRIPT_DIR}/dashboard-cloud-run-overview.json" "${TMP_DIR}/dashboard-cloud-run-overview.json"

create_policy_if_missing "SpanishAmigo Cloud Run 5xx Spike" "${TMP_DIR}/alert-policy-5xx.json"
create_policy_if_missing "SpanishAmigo Cloud Run High P95 Latency" "${TMP_DIR}/alert-policy-latency-p95.json"
create_policy_if_missing "SpanishAmigo Auth Failures Spike" "${TMP_DIR}/alert-policy-auth-failures.json"

if gcloud monitoring dashboards list --project "${PROJECT_ID}" --format="value(displayName)" | grep -Fxq "SpanishAmigo Cloud Run Overview"; then
  echo "Dashboard exists: SpanishAmigo Cloud Run Overview"
else
  gcloud monitoring dashboards create \
    --project "${PROJECT_ID}" \
    --config-from-file="${TMP_DIR}/dashboard-cloud-run-overview.json"
fi

echo "Monitoring setup complete."
