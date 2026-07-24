# K12 ClassScanner for macOS

A fully offline macOS edition of K12 ClassScanner built with Tauri v2, React, and Vite. This package contains the same current classroom workflow as the web and Windows desktop editions.

## Offline behavior

- The bundled interface, Inter fonts, JetBrains Mono fonts, and default reward images are stored locally in the application package.
- QR codes, barcodes, classroom reports, PDF generation, and Excel exports run locally.
- Classroom data is stored locally in the Tauri WebView profile using browser local storage. It remains on this Mac and is separate from the browser version of the app.
- User-provided remote image URLs are optional. If they are unavailable offline, the application uses its built-in reward icon fallback.

## Requirements

- macOS 10.15 or newer
- Node.js 18 or newer
- Xcode Command Line Tools: `xcode-select --install`
- Rust toolchain with Cargo: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

## Development

```bash
npm ci
npm run dev:tauri
```

`npm run dev:tauri` starts Vite on `http://127.0.0.1:1420` and opens the desktop application with hot reload.

## Validation

```powershell
npm run lint
npm run build:web
```

## macOS production build

```bash
npm run build:tauri
```

Run the build on the target Mac architecture. Tauri writes the `.app` application bundle and `.dmg` installer below `src-tauri/target/release/bundle`.

For Apple silicon, build on an Apple silicon Mac. For Intel, build on an Intel Mac. A universal build requires both Rust targets and a universal-binary workflow; create and test it on macOS before distribution.

## Distribution

Local testing can use the unsigned `.app` or `.dmg` output. Public distribution outside the Mac App Store requires an Apple Developer certificate, code signing, and notarization. Configure signing credentials in the macOS build environment; do not commit certificates, private keys, or Apple credentials to this repository.

## Local data backup

The first desktop launch creates a separate local browser-storage profile for the desktop app. To protect classroom data, export reports regularly and include the app's local WebView data directory in Mac backups. The desktop release does not automatically import data from the web app.
