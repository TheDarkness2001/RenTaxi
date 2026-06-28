# Google Maps setup for Flutter apps
#
# 1. Get API key: https://console.cloud.google.com/google/maps-apis
# 2. Enable: Maps SDK for Android, Maps SDK for iOS, Directions API
#
# Android — android/app/src/main/AndroidManifest.xml:
#   <meta-data android:name="com.google.android.geo.API_KEY"
#              android:value="YOUR_KEY"/>
#
# iOS — ios/Runner/AppDelegate.swift:
#   GMSServices.provideAPIKey("YOUR_KEY")
#
# Run with:
#   flutter run --dart-define=GOOGLE_MAPS_API_KEY=YOUR_KEY \
#               --dart-define=API_BASE_URL=http://10.0.2.2:3000/v1
#
# Payment providers (.env):
#   CLICK_MERCHANT_ID, CLICK_SERVICE_ID, CLICK_SECRET_KEY, CLICK_MERCHANT_USER_ID
#   PAYME_MERCHANT_ID, PAYME_SECRET_KEY
#   PAYMENT_MOCK=true   # skip real API in dev (default when keys missing)
