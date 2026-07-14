# K12 ClassScanner Web

A deployable Vite and React version of K12 ClassScanner. This folder contains everything needed to publish the web application to GitHub and Vercel.

## Included

- React and Vite source in `src/`
- Bundled local fonts and default reward images for offline-friendly UI assets
- `package.json` and `package-lock.json` for reproducible installs
- `vercel.json` for Vite detection and single-page app rewrites
- `.gitignore` that excludes dependencies, generated output, and local environment files

## Run locally

```powershell
npm ci
npm run dev
```

## Validate and build

```powershell
npm run lint
npm run build
```

The production output is generated in `dist/`.

## Deploy to GitHub

1. Create a new GitHub repository.
2. From this folder, run:

```powershell
git init
git add .
git commit -m "Initial web deployment"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
git push -u origin main
```

## Deploy to Vercel

1. Import the GitHub repository in Vercel.
2. Vercel detects Vite automatically.
3. Keep the default build command: `npm run build`.
4. Keep the output directory: `dist`.
5. Deploy.

No server-side environment variables are required. Classroom data is stored in each browser using local storage, so data is not shared between devices or browsers.
