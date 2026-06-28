# Deploy to Railway & Use on Your Phone

Yes — you can deploy this project to [Railway](https://railway.app) and use it from a real phone. Below is the practical path for a **demo / MVP** (not full production scale).

## What works on Railway

| Component | Railway | Notes |
|-----------|---------|-------|
| Backend API | ✅ | One Docker service runs all 7 microservices |
| PostgreSQL | ✅ | Add Railway Postgres plugin |
| Redis | ✅ | Add Railway Redis plugin |
| WebSockets (live tracking) | ✅ | Railway supports WS on public URL |
| Admin panel | ✅ | Optional second service or run locally |
| Flutter on phone | ✅ | Build APK/IPA pointing at your Railway URL |
| RabbitMQ | ⚠️ | Optional — app runs without it (degraded events) |
| PostGIS | ⚠️ | Enable manually on Postgres |
| MinIO (KYC uploads) | ⚠️ | Use Railway volume or S3 later |

## Architecture on Railway (recommended for cost)

```
Phone (Flutter app)
       │  HTTPS
       ▼
┌──────────────────────────────┐
│  Railway: taxi-api service   │  ← Dockerfile.railway
│  (gateway + all microservices) │
└──────────┬───────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
 Postgres      Redis
 (plugin)     (plugin)
```

Running **one container** with all services avoids paying for 7 separate Railway services (~$5+ each on hobby).

---

## Step 1 — Push code to GitHub

```bash
git init
git add .
git commit -m "Initial taxi platform"
git remote add origin https://github.com/YOUR_USER/taxi.git
git push -u origin main
```

Railway deploys from GitHub.

---

## Step 2 — Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → select your `taxi` repo
3. Add **PostgreSQL** → New → Database → PostgreSQL
4. Add **Redis** → New → Database → Redis

---

## Step 3 — Deploy the backend

1. **New Service** → GitHub repo → same repository
2. Settings:
   - **Root Directory:** `backend`
   - **Dockerfile Path:** `Dockerfile.railway`
3. **Variables** (Settings → Variables):

```env
NODE_ENV=production
JWT_SECRET=generate-a-long-random-string-here
PAYMENT_MOCK=true
KYC_OCR_PROVIDER=mock
SMS_PROVIDER=mock

# Railway auto-injects these when you link plugins:
# DATABASE_URL=${{Postgres.DATABASE_URL}}
# REDIS_URL=${{Redis.REDIS_URL}}

# Internal service URLs (same container = localhost)
AUTH_SERVICE_URL=http://127.0.0.1:3001
IDENTITY_SERVICE_URL=http://127.0.0.1:3002
RIDE_SERVICE_URL=http://127.0.0.1:3003
PAYMENT_SERVICE_URL=http://127.0.0.1:3004
LOCATION_SERVICE_URL=http://127.0.0.1:3005
NOTIFICATION_SERVICE_URL=http://127.0.0.1:3006
```

4. Link Postgres: Variables → **Add Reference** → `DATABASE_URL` from Postgres service
5. Link Redis: same for `REDIS_URL`
6. **Networking** → Generate Domain → e.g. `taxi-api-production.up.railway.app`

---

## Step 4 — Run database migrations

Railway Postgres does not auto-run our SQL files. Connect and run migrations once:

**Option A — Railway CLI**

```bash
npm i -g @railway/cli
railway login
railway link
railway connect postgres
```

Then paste/run SQL from:
- `backend/libs/database/migrations/init.sql`
- `backend/libs/database/migrations/002_notifications.sql`

**Option B — psql with public URL**

Copy `DATABASE_URL` from Railway Postgres → connect with any SQL client (DBeaver, TablePlus).

**PostGIS** (required for driver search):

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

If PostGIS is not available on your Railway plan, driver nearby-search will fail — upgrade plan or use a PostGIS-enabled host (Supabase, Neon with PostGIS, etc.).

---

## Step 5 — Verify API

Open in browser:

```
https://YOUR-RAILWAY-DOMAIN.up.railway.app/v1/health
```

Should return `{ "status": "ok", ... }`.

Swagger:

```
https://YOUR-RAILWAY-DOMAIN.up.railway.app/docs
```

Test OTP:

```bash
curl -X POST https://YOUR-DOMAIN.up.railway.app/v1/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"+998901234567"}'
```

With `SMS_PROVIDER=mock`, check Railway **Deploy Logs** for the OTP code (or use dev code if `NODE_ENV=development`).

---

## Step 6 — Build Flutter app for your phone

### Android (easiest)

1. Install Flutter + Android SDK on your PC
2. Generate platform folders (once):

```bash
cd mobile/passenger_app
flutter create . --org uz.taxi
```

3. Add Google Maps key — see `mobile/MAPS_SETUP.md`

4. Build APK with your Railway URL:

```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=https://YOUR-DOMAIN.up.railway.app/v1 \
  --dart-define=WS_BASE_URL=https://YOUR-DOMAIN.up.railway.app \
  --dart-define=GOOGLE_MAPS_API_KEY=YOUR_MAPS_KEY
```

5. Install on phone:

```bash
# USB debugging enabled
flutter install

# Or copy APK from:
# build/app/outputs/flutter-apk/app-release.apk
```

Send the APK to your phone (USB, Telegram, etc.) and install (enable “Install unknown apps”).

### iOS

Requires Mac + Apple Developer account. Build with same `--dart-define` flags, install via Xcode or TestFlight.

---

## Step 7 — Driver app (optional)

Same as passenger, from `mobile/driver_app`:

```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=https://YOUR-DOMAIN.up.railway.app/v1 \
  --dart-define=WS_BASE_URL=https://YOUR-DOMAIN.up.railway.app
```

**Note:** Driver endpoints need `driver` role on the user in the database.

---

## Phone ↔ Railway checklist

- [ ] Railway public HTTPS domain works (`/v1/health`)
- [ ] Flutter uses `https://` not `http://` (Android blocks cleartext by default)
- [ ] `WS_BASE_URL` uses `https://` (Socket.IO upgrades to WSS automatically)
- [ ] Google Maps API key allows your app package name (Android) or bundle ID (iOS)
- [ ] Phone has internet (Wi‑Fi or mobile data) — no need to be on same Wi‑Fi as your PC
- [ ] Postgres migrations applied + PostGIS enabled

---

## Costs (rough)

| Item | Estimate |
|------|----------|
| Railway Hobby | ~$5/month credit + usage |
| 1 backend service + Postgres + Redis | ~$10–20/month light usage |
| Google Maps | Free tier usually enough for testing |
| SMS (real OTP) | Paid (Eskiz.uz, Playmobile) — use mock for demo |

---

## Limitations for production

This Railway setup is fine for **testing on your phone** and small demos. For a real launch in Uzbekistan you would still need:

- Separate scalable infra (K8s or managed services)
- Real SMS OTP provider
- Real KYC (OCR + face match)
- Click/Payme production keys + webhooks pointing to your domain
- RabbitMQ for reliable events
- CDN + object storage for documents
- App Store / Google Play release

---

## Troubleshooting

**App says “Connection refused”**  
→ Wrong `API_BASE_URL`. Must be `https://YOUR-DOMAIN.up.railway.app/v1` (with `/v1`).

**OTP never arrives**  
→ Expected with `SMS_PROVIDER=mock`. Check Railway logs or set `NODE_ENV=development` and use `123456`.

**WebSocket not connecting**  
→ Ensure `WS_BASE_URL` is the Railway domain without `/v1`.

**Driver search fails**  
→ PostGIS not enabled or no online drivers in DB.

**Build fails on Railway**  
→ Check `backend/package-lock.json` exists (`cd backend && npm install` locally, commit lockfile).
