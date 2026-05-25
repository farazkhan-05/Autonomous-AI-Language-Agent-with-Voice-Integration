param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectId,
    [Parameter(Mandatory = $true)]
    [string]$Region,
    [Parameter(Mandatory = $true)]
    [string]$ServiceAccountEmail,
    [Parameter(Mandatory = $true)]
    [string]$ImageUri,
    [string]$ServiceName = "spanish-amigo-api"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$templatePath = Join-Path $PSScriptRoot "cloudrun.service.yaml"
$renderedPath = Join-Path $PSScriptRoot "cloudrun.rendered.yaml"

$content = Get-Content -Raw -Path $templatePath
$content = $content.Replace("name: spanish-amigo-api", "name: $ServiceName")
$content = $content.Replace("REPLACE_WITH_SERVICE_ACCOUNT_EMAIL", $ServiceAccountEmail)
$content = $content.Replace("REPLACE_WITH_IMAGE_URI", $ImageUri)

Set-Content -Path $renderedPath -Value $content -Encoding utf8

Write-Host "Deploying Cloud Run service '$ServiceName' in region '$Region'..."
gcloud config set project $ProjectId | Out-Null
gcloud run services replace $renderedPath --region $Region --platform managed

Write-Host "Deployment submitted successfully."
