# DK Photography

A responsive photography portfolio for Dusko Ilieski, built with React, Vite, Anime.js and Three.js.

## Run locally

```sh
npm install
npm run dev
```

Before publishing, verify the production build with `npm run build`.

## Deploy to GitHub Pages

The repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`. Push to the `main` or `master` branch (or start the workflow manually from the Actions tab) to lint, build and deploy the site.

**Set the repository's Pages source to GitHub Actions:** open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**. Do not select **Deploy from a branch**. Branch publishing serves the unbuilt React source (`/src/main.jsx`), which browsers cannot run directly; its Jekyll deployment can also overwrite the correctly built site from this workflow.

Vite is configured with a relative base path, so the built JavaScript, photos, favicon and 3D model work at both `username.github.io/repository/` and a custom-domain root. The workflow deploys the generated `dist` directory.

## Photos and logos

Place source JPEGs in `src/assets/porfolio` (the directory name intentionally matches the existing project path), then run:

```sh
node scripts/prepare-photos.mjs
```

The script creates small, medium and large WebP versions in `public/photos` and updates `src/data/photos.json`. It categorizes images by source folder, with a few file-specific overrides in the script. The gallery displays the image files directly; it does not use their filenames as captions.

The header and footer use `src/assets/logo-white.png` and `src/assets/logo-black.png`. Replace those files to use another logo. `public/favicon.png` is the separate square DK mark used by the browser tab and loading screen.

## 3D camera

`src/scene/engine.js` loads `public/models/camera.glb`. Its scroll-driven poses, responsive positioning and rendering settings are defined in that file. The renderer reduces antialiasing, pixel ratio and idle frame rate on phones.

The decorative camera model is **Canon EOS 5D Mark IV** by [RAW](https://sketchfab.com/ocbsketch), from [Sketchfab](https://sketchfab.com/3d-models/canon-eos-5d-mark-iv-33001ed6f05042d89ac8690ffaaed0a4), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The photographer's stated shooting kit is a Canon R50 with a Tamron 17–70mm f/2.8 lens; the 3D model is decorative, not a representation of that kit.

## Accessibility

The site follows the operating system's reduced-motion preference, supports keyboard navigation in the photo viewer, and includes a persistent light/dark theme switch.
