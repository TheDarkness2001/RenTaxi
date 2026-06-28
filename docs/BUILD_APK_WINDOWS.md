# Build RenTaxi APK on Windows (step by step)

Your PC does **not** have Flutter yet. Follow these steps once (~30–60 min first time).

---

## Part 1 — Install tools (one time)

### Step 1: Install Flutter

1. Download: https://docs.flutter.dev/get-started/install/windows/mobile  
   (or direct ZIP: https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_stable.zip)

2. Extract to `C:\src\flutter` (avoid OneDrive paths for SDK)

3. Add to PATH:
   - Windows Search → **Environment Variables**
   - User **Path** → **New** → `C:\src\flutter\bin`
   - OK → **close and reopen** PowerShell

4. Verify:

```powershell
flutter --version
flutter doctor
```

---

### Step 2: Install Android Studio

1. Download: https://developer.android.com/studio

2. Install with defaults → open Android Studio

3. **More Actions → SDK Manager**:
   - **SDK Platforms** → check **Android 14 (API 34)** or latest
   - **SDK Tools** → check:
     - Android SDK Build-Tools
     - Android SDK Command-line Tools
     - Android SDK Platform-Tools
   - Apply

4. Accept Android licenses:

```powershell
flutter doctor --android-licenses
```

(Press `y` for each question)

5. Run again:

```powershell
flutter doctor
```

Fix anything marked with ❌ until Android toolchain shows ✅.

---

### Step 3: Java (JDK 17)

Flutter/Android usually bundle JDK via Android Studio. If `flutter doctor` complains about Java:

```powershell
winget install Microsoft.OpenJDK.17
```

---

## Part 2 — Build the passenger APK

Open **PowerShell** in your project folder:

```powershell
cd C:\Users\Lenovo\OneDrive\Desktop\taxi
```

### Option A — use our script (easiest)

```powershell
.\scripts\build-passenger-apk.ps1
```

### Option B — manual commands

```powershell
cd mobile\passenger_app

# Create android/ folder (first time only)
flutter create . --platforms=android --org uz.rentaxi

flutter pub get

flutter build apk --release `
  --dart-define=API_BASE_URL=https://taxibackend-production-4fb8.up.railway.app/v1 `
  --dart-define=WS_BASE_URL=https://taxibackend-production-4fb8.up.railway.app
```

---

## Part 3 — Install on your phone

APK location:

```
mobile\passenger_app\build\app\outputs\flutter-apk\app-release.apk
```

**Send to phone:**

- USB cable → copy file
- Telegram / WhatsApp → send to yourself
- Google Drive

**On phone:**

1. Open the APK file
2. Allow **Install unknown apps** if asked
3. Install → Open

---

## Part 4 — Google Maps (optional but recommended)

Maps need an API key:

1. https://console.cloud.google.com/google/maps-apis  
2. Enable **Maps SDK for Android**
3. Create API key
4. Rebuild with:

```powershell
$env:GOOGLE_MAPS_API_KEY = "YOUR_KEY_HERE"
.\scripts\build-passenger-apk.ps1
```

Or add key to `android/app/src/main/AndroidManifest.xml` after `flutter create` (see `mobile/MAPS_SETUP.md`).

---

## Part 5 — QR code download page

After APK is built:

1. Upload `rentaxi-passenger.apk` to **GitHub Releases**
2. Edit `download/index.html` → set the real APK URL
3. Host page on **GitHub Pages** or **Netlify**
4. Print the QR from the page

Full guide: `docs/DOWNLOAD_QR.md`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `flutter` not recognized | Reopen terminal after adding PATH |
| Android licenses | `flutter doctor --android-licenses` |
| Gradle slow / fails | Wait, or check internet; first build takes 5–15 min |
| App can't reach API | Rebuild with correct `API_BASE_URL` |
| Maps blank | Add `GOOGLE_MAPS_API_KEY` |

---

## Test login on phone

1. Open app
2. Phone: `+998901234567`
3. OTP: `123456` (mock mode on Railway)

---

## Driver app (later)

Same steps in `mobile\driver_app`:

```powershell
cd mobile\driver_app
flutter create . --platforms=android --org uz.rentaxi
flutter build apk --release --dart-define=API_BASE_URL=https://taxibackend-production-4fb8.up.railway.app/v1
```
