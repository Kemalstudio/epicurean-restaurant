# Ember — mobile app (Flutter)

Android / iOS app for the Ember food-delivery marketplace. Design follows the mobile screens of the
Figma kit (Mobile Home, Mobile Restaurant, Mobile Cart, popups). Uses the same backend as the website.

## Run

The app needs the backend address at build time:

```bash
# Android emulator (10.0.2.2 = your computer) — this is the default
flutter run

# Real phone in the same Wi-Fi as the computer running the backend
flutter run --dart-define=API_URL=http://192.168.1.150:5000/api
```

Release APK:

```bash
flutter build apk --release --split-per-abi --dart-define=API_URL=https://api.your-domain.tm/api
# -> build/app/outputs/flutter-apk/
```

For Google Play, create your own signing key first (see
https://docs.flutter.dev/deployment/android#signing-the-app) — the default build is signed with the debug key.

## Before publishing

- Use HTTPS for the API and remove `android:usesCleartextTraffic="true"` from
  `android/app/src/main/AndroidManifest.xml` (it is there only so the app can reach a local HTTP backend).
- iOS: `NSAllowsLocalNetworking` in `ios/Runner/Info.plist` allows local HTTP only.

## Structure

```
lib/
  core/      config (API address), theme (kit colors/fonts), api client, app & basket state, translations
  widgets/   header, cards, buttons, popups, basket, product card + customise popup
  screens/   home, restaurants, restaurant, basket + checkout, order success + tracking, auth
```

## Translations

`lib/core/i18n_data.dart` is generated from the website dictionaries so both use the same texts.
Regenerate after changing `src/lib/translations*.js` (run from the repository root):

```bash
node --input-type=module -e "import fs from 'fs'; const { translations } = await import('./src/lib/translations.js'); let o='// GENERATED from the website dictionaries (src/lib/translations*.js). Do not edit by hand.\n// Regenerate: see mobile/README.md\n\nconst Map<String, Map<String, String>> kTranslations = {\n'; for (const l of ['en','ru','tk']) { o+='  \'' + l + '\': {\n'; for (const [k,v] of Object.entries(translations[l])) o+='    \'' + k + '\': ' + JSON.stringify(v) + ',\n'; o+='  },\n'; } o+='};\n'; fs.writeFileSync('mobile/lib/core/i18n_data.dart', o);"
```

App-only strings live in `lib/core/i18n_app.dart`.

## Fonts

Poppins (Latin), PoppinsExt (Latin Extended — Turkmen letters) and MontserratCyr (Cyrillic — Russian)
are bundled in `assets/fonts` (SIL Open Font License), converted from the website's self-hosted fonts.
