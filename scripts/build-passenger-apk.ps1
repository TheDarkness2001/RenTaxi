# Build RenTaxi passenger APK for production (Railway API)
# Requires: Flutter SDK + Android SDK (via Android Studio)

$ErrorActionPreference = "Stop"
$ApiUrl = "https://taxibackend-production-4fb8.up.railway.app/v1"
$WsUrl = "https://taxibackend-production-4fb8.up.railway.app"
$AppDir = Join-Path $PSScriptRoot "..\mobile\passenger_app"

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  Write-Host "Flutter not found. Install from https://docs.flutter.dev/get-started/install/windows" -ForegroundColor Red
  exit 1
}

Push-Location $AppDir

if (-not (Test-Path "android")) {
  Write-Host "Creating Android project files..."
  flutter create . --platforms=android --org uz.rentaxi
}

flutter pub get

$defines = @(
  "--dart-define=API_BASE_URL=$ApiUrl",
  "--dart-define=WS_BASE_URL=$WsUrl"
)

if ($env:GOOGLE_MAPS_API_KEY) {
  $defines += "--dart-define=GOOGLE_MAPS_API_KEY=$env:GOOGLE_MAPS_API_KEY"
}

Write-Host "Building release APK..."
flutter build apk --release @defines

$apk = "build\app\outputs\flutter-apk\app-release.apk"
if (Test-Path $apk) {
  $out = Join-Path $PSScriptRoot "..\download\rentaxi-passenger.apk"
  Copy-Item $apk $out -Force
  Write-Host ""
  Write-Host "SUCCESS" -ForegroundColor Green
  Write-Host "APK: $((Resolve-Path $apk).Path)"
  Write-Host "Copied to: $((Resolve-Path $out).Path)"
} else {
  Write-Host "Build failed - APK not found." -ForegroundColor Red
  exit 1
}

Pop-Location
