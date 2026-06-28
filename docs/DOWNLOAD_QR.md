# QR Code App Download (RenTaxi)

## Can one QR install on any phone?

| Phone | Scan QR → auto install? |
|-------|---------------------------|
| **Android** | ✅ Yes — QR opens a page → downloads `.apk` → user taps Install |
| **iPhone (iOS)** | ❌ Not like Android — Apple requires **App Store** or **TestFlight** |

There is no legal way to “auto install” an iOS app from a random QR without App Store / TestFlight / enterprise MDM.

---

## How it works (recommended)

```
QR code  →  download page (index.html)  →  detects phone
                ├─ Android → download APK
                └─ iPhone  → App Store / “coming soon”
```

Files: `download/index.html`

---

## Step 1 — Build the Android APK

Install Flutter, then from each app folder:

```bash
cd mobile/passenger_app
flutter create . --platforms=android
flutter build apk --release \
  --dart-define=API_BASE_URL=https://taxibackend-production-4fb8.up.railway.app/v1
```

APK output:

`mobile/passenger_app/build/app/outputs/flutter-apk/app-release.apk`

Repeat for `mobile/driver_app` if needed.

---

## Step 2 — Host the APK online

Pick one:

### A) GitHub Releases (easiest, free)

1. GitHub repo → **Releases** → **New release**
2. Upload `app-release.apk` as `rentaxi-passenger.apk`
3. Copy the file URL (e.g. `https://github.com/.../rentaxi-passenger.apk`)

### B) Railway static file

Upload APK to any public URL (S3, Cloudflare R2, etc.)

---

## Step 3 — Update download page

Edit `download/index.html` — set real APK URLs:

```javascript
apk: 'https://github.com/TheDarkness2001/RenTaxi/releases/download/v1.0/rentaxi-passenger.apk',
```

---

## Step 4 — Host the download page

### Option A — GitHub Pages

1. Enable Pages on repo → folder `/download` or `docs`
2. URL: `https://TheDarkness2001.github.io/RenTaxi/download/`

### Option B — Netlify / Vercel (drag & drop `download` folder)

### Option C — Railway static service

New service → deploy `download/` folder as static site.

---

## Step 5 — Print the QR code

1. Open your hosted page in a browser, e.g.  
   `https://YOUR-PAGE.com/?app=passenger`
2. The page **generates the QR automatically** (points to itself)
3. Screenshot or print the QR for posters / taxi stands

Or generate manually: [https://www.qr-code-generator.com](https://www.qr-code-generator.com)  
Paste your download page URL.

---

## Android-only “instant download” QR

If you only care about Android (e.g. Uzbekistan market mostly Android), QR can link **directly** to the APK:

```
https://github.com/.../rentaxi-passenger.apk
```

⚠️ iPhone users will get a broken download — use the smart landing page instead for mixed audiences.

---

## iOS later

1. Apple Developer account ($99/year)
2. Publish to App Store or TestFlight
3. Put App Store URL in `download/index.html` → `ios:` field
4. iPhone scan → opens App Store

---

## Quick checklist

- [ ] Build APK with Railway API URL
- [ ] Upload APK (GitHub Releases)
- [ ] Update URLs in `download/index.html`
- [ ] Deploy page (GitHub Pages / Netlify)
- [ ] Test: scan QR on Android phone → install works
- [ ] iOS: App Store when ready
