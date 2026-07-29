# K12 ClassScanner for Android

Native Kotlin and Jetpack Compose implementation of the classroom barcode workflow. It is designed for phones and tablets: phones use a bottom navigation bar, while tablet-width devices use a navigation rail and benefit from the wider content area.

## Features

- Student selection, point adjustments, and live active-student context
- Assignment selection and scan-to-complete workflow
- Scan-to-store redemption with stock and balance validation
- Scan-to-reward workflow with point awards
- Dashboard and class-report summaries
- Persistent on-device classroom data using Room; points, assignments, rewards, store stock, and scan history survive app restarts
- Camera barcode and QR scanning using CameraX and Google ML Kit
- Manual scanner entry suitable for hardware barcode scanners that act as keyboards

## Open in Android Studio

1. Open the `android-classscanner` folder in Android Studio.
2. Allow Gradle sync to download the Android Gradle Plugin and Compose dependencies.
3. Run the `app` configuration on an Android 7.0+ phone, tablet, or emulator.

The scanner field accepts the included seed codes: `STU1001` to `STU1005`, `ASM201` to `ASM203`, `ITM101`, `ITM104`, `ITM106`, and `ITM108`.

## Scanner support

The app accepts keyboard-wedge USB and Bluetooth barcode scanners through the scan field. Select the camera icon beside the field to scan with the device camera, then grant the requested camera permission. The first run may download ML Kit's barcode recognition model.

Classroom data is stored privately on the device in `classscanner.db`. Uninstalling the app or clearing its storage removes this local data.