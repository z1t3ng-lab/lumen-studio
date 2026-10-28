> **Debug update 0.3.1:** fixes numeric entry and persistence, imported curves, mask geometry and erasing, recipe/tool state, and Mac window reopening. See [the debug report](docs/DEBUG-REVIEW.md) for reproductions and validation.

# Lumen Studio

**Version0.3:** Point curves, eight-range Color Mixer, local masks, Texture/Clarity/Dehaze, luminance/color noise reduction, clone/heal, manual optics correction, grain and clipping warnings are now included. [Advanced tools guide](docs/ADVANCED-TOOLS.md).

**macOS desktop app:** Open `dist/Lumen Studio.app` in Finder. It runs independently of Node and the web server, with native photo dialogs, keyboard menus and numeric adjustments. See [desktop instructions](docs/DESKTOP.md).

A working local photo editor inspired by Lightroom's editing workflow, with an accompanying REA investigation of the actual Lightroom web application. The interface and processing algorithms here are independently written. Adobe's captured scripts are research evidence only; the editor never imports them.

## Repository contents

This repository contains the independent app source, tests, documentation, sample image, and Lumen validation evidence. Packaged apps, the Electron runtime, rollback copies, local library data, and raw REA sessions, captured Adobe images and captured Adobe JavaScript stay outside Git. References to those local research archives in the reports describe the original investigation; those archives are not distributed here. No open-source license has been selected.

For a source checkout, run `npm install` to install browser-test tooling, `npm test` for the numerical checks, and `npm start` for the browser editor. Browser tests require a running local server and Chrome. The application itself has no npm runtime dependencies. See [desktop source-build instructions](docs/REPOSITORY-SETUP.md) to prepare the separate Electron runtime.

## Open the editor

The local server is at **http://127.0.0.1:4173** while it is running.

On this Mac, double-click **Start Lumen.command**. Keep the Terminal window open while using the editor. Alternatively, from this folder:

```sh
npm start
```

Then open http://127.0.0.1:4173 in Chrome, Safari, or another current browser. Node.js is the only runtime prerequisite; the application has no npm runtime dependencies, account, API keys, build step, or photo-upload service. The browser editor and the packaged macOS app share the same editing engine. This version was tested in Chrome 156 on macOS.

- **Editor:** http://127.0.0.1:4173
- **Step-by-step walkthrough:** http://127.0.0.1:4173/guide.html
- **Actual REA evidence viewer:** http://127.0.0.1:4173/docs/evidence.html

## Edit your first photo

1. Click **Import photos**, drag files onto the workspace, or try the sample photograph. Use JPEG, PNG or WebP, up to 40 megapixels and 60 MB per file.
2. Select a photo in the filmstrip. Use Exposure and the Light controls, then Temperature, Tint, Vibrance and Saturation. Double-click a slider to reset only that control. On wider screens, choose a look from the left sidebar.
3. Click **Before** or press **B** to view the unedited original. Undo and redo preserve up to 60 recipe states per photo. A slider gesture becomes one history entry when released.
4. Click **Crop**, choose a centered aspect ratio or drag a rectangle on the photograph, then **Apply crop**. Dragging switches to freeform. Rotate turns 90° clockwise and clears the previous crop; undo can restore it.
5. Click **Export**, choose JPEG/PNG, quality where applicable, and full resolution or a smaller long edge. A new file is downloaded with the edits applied. Your original file remains untouched. Transparency is preserved in PNG; JPEG uses white behind transparent pixels.
6. On wider screens, **Save edit recipe** downloads a small JSON file containing your settings. **Load edit recipe** reapplies those settings to the selected photo. Version2 recipes include the new masks, curves, mixer and retouch strokes; version1 recipes still load. The recipe does not contain the original image. Keep both for a portable editable backup.

The browser library stores copies of imported image blobs, edit recipes, ratings and history in IndexedDB. Reopening the same browser/profile and origin restores them. Clearing browser data removes this library. Export finished images and recipes for durable copies. If storage fails, a persistent footer reports that editing is session-only or unsaved.

Favorites are photographs rated 4 or 5 stars. The compact mobile layout keeps import, adjustments, history, crop, rotate and export; the library sidebar, presets and recipe buttons are available in the wider layout.

## What REA actually established

See [the detailed report](docs/REA-WEB-FINDINGS.md), [interactive evidence viewer](docs/evidence.html), and [Adobe documentation ledger](docs/ADOBE-EVIDENCE.md).

REA 6.7.0 inspected the real public Lightroom web sample editor with a fresh Chrome profile. It recorded an Exposure 0 → +1.00 interaction, with matching control values, a brighter preview, a shifted histogram, and Save becoming enabled. The report links to raw Evidence IDs and unaltered screenshots.

Static analysis observed 56 loaded scripts. A separate passive capture exported 50 scripts (12,330,431 bytes), all verified against recorded SHA-256 digests. Captured code exposes named settings such as `Exposure2012`, store-update boundaries, WebGL initialization, a rendering bridge, ImageData/Canvas preview code, and XMP/develop settings. Static observations do not prove those exact paths ran in the exposure experiment.

The parser reported partial completeness, and we did not establish Adobe's exposure formula, RAW decoder, internal color space, AI processing, authenticated persistence, or desktop/web equivalence. Lightroom desktop was not installed. No desktop binary was decompiled. We did not test Adobe Save/export or compare exported Adobe and Lumen pixels.

## Build it step by step

Each stage below is implemented in the corresponding file; these are explanations of completed work, not claims about Adobe's exact architecture.

### 1. Preserve the input and create a recipe

`src/storage.js` stores the original Blob and a settings object in IndexedDB. `src/engine.js` defines defaults and validates loaded recipes. Source image bytes never change. Editing means changing numbers such as exposure, saturation, rotation and normalized crop coordinates.

### 2. Decode once for a preview

`src/app.js` decodes the selected image using `createImageBitmap`, honoring browser-supported EXIF orientation. A canvas generates a preview capped at a 1600 px long edge. The browser's normal canvas conversion produces 8-bit RGB pixels. This avoids processing the full-resolution original on each slider movement.

### 3. Implement a deterministic pixel pipeline

`src/engine.js` takes input RGBA bytes and settings, returning a new buffer:

1. Convert encoded sRGB channels to linear light using the standard piecewise transfer function.
2. Multiply linear channels by `2 ** exposure`; apply independent red/green/blue temperature and tint gains.
3. Compute luminance `L = clamp(0.2126 R + 0.7152 G + 0.0722 B)` and soft tonal weights: shadows `(1-L)^3`, highlights `L^2`, blacks `(1-L)^8`, whites `L^6`. Combine slider-weighted stops and multiply channels by their power-of-two gain. This is our simplified design, not Adobe's tonal algorithm.
4. Return to encoded sRGB. Apply contrast around 0.5.
5. Interpolate channels away from or toward luminance for saturation. Vibrance weights lower-chroma pixels more strongly. These approximate creative controls are not a calibrated camera white-balance or perceptual color model.
6. Apply a radial vignette and a small four-neighbor unsharp operation, then clamp to displayable bytes. Alpha passes through unchanged.

One concrete verification: a neutral encoded channel value of **80 becomes 111 at +1 EV**, rather than the incorrect encoded-space doubling to 160. Full desaturation produces equal RGB channels. Default settings round-trip all 256 channel levels exactly.

### 4. Keep interaction responsive and reject stale work

`src/worker.js` runs the same pixel function in a Web Worker. `src/app.js` queues the latest preview and uses generation identifiers to prevent an old render from replacing a newer edit or another photo. A render is always derived from the preserved preview pixels, never the previously edited output.

### 5. Add geometry, history and looks

Rotation and normalized crop rectangles are applied after color processing. Crop coordinates refer to the rotated image. Presets supply ordinary recipe values. Undo/redo restores recipe snapshots, not compressed image copies. Ratings and the filmstrip organize a small personal library.

### 6. Render an export from the original

The export path decodes the stored original at full size, applies the same pixel function and geometry, optionally resizes, then encodes a new JPEG or PNG Blob. It never copies the smaller preview as the final result. Preview sampling and a one-pixel sharpening radius can still produce detail differences at different resolutions; this is not a color-critical proofing system.

### 7. Make the evidence inspectable

`docs/evidence.html` presents the real Adobe screenshots. `docs/REA-WEB-FINDINGS.md` links observations to Evidence IDs, captured scripts and exact source anchors. `docs/validation/` contains our separate test output and screenshots. Adobe observations and Lumen tests are deliberately attributed to their actual targets.

## Verify the implementation

```sh
npm test
```

This runs27 Node tests (the original nine,14 advanced-tool checks, and four debugging regressions) for identity, linear-light exposure, alpha preservation, monochrome, tonal weighting, histogram counts, crop bounds, recipe validation, and immutable processing.

`tests/browser.mjs` exercises 25 real browser checks: import, preview, comparison, undo/redo, downloadable files, recipes, crop, rotate, presets, ratings, reload, original SHA-256 preservation, mixed/corrupt inputs, responsive layouts, keyboard behavior, zero external application requests, and storage failure. It uses a separate browser profile. Set `PLAYWRIGHT_MODULE` to an installed playwright-core `index.mjs` and `CHROME_PATH` to Chrome if running elsewhere; the default module is the local development dependency; set CHROME_PATH for browsers outside the standard macOS Chrome location.

```sh
node tests/browser.mjs
```

Three additional focused browser regressions in `tests/edge-cases.mjs` verify persistent save-failure warnings, recipe selection races, and 4000×1 images. Their results are in `docs/validation/edge-case-results.json`.

The local server must already be running. See [browser results](docs/validation/browser-results.json) and [visual evidence](docs/validation/design-evidence.json). A successful record confirms the tested paths, not every browser, image codec or resource limit.

## Current limits

- JPEG, PNG and WebP only; no native RAW, HEIC or TIFF decoding.
- SDR 8-bit RGB processing; no HDR pipeline, custom ICC working spaces, soft proofing, camera/lens profiles or calibrated Kelvin values. Browser codecs and color conversion affect results.
- Local brush/linear/radial masks, clone/heal and traditional denoise are included. AI denoise, generative removal, automatic lens profiles, perspective correction, cloud sync and Lightroom catalog/XMP compatibility remain unavailable. The JSON recipe is specific to Lumen.
- Export omits camera metadata. Previews are capped at 1600 px; full images up to 40 MP are accepted. Large exports can use substantial memory and have not been stress-tested at the 40 MP ceiling.
- Browser library loading keeps original blobs locally and is intended for small collections, not a professional multi-terabyte catalog. Editing/export is not Adobe-pixel-equivalent.

## Sample photograph

The bundled landscape is downloaded from [Unsplash's image asset](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1800&q=88&fit=crop) for the sample workflow. It is stored locally in `assets/alpine.jpg`; using the editor does not fetch it from a third-party server. Adobe sample screenshots are identified separately as research evidence.
