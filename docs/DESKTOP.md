# Lumen Studio 0.3.1 for macOS

Open **dist/Lumen Studio.app** in Finder. It bundles its runtime and editor, so the browser server and Node do not need to run. This build is for the current AppleSilicon Mac and is locally ad-hoc signed.

Version 0.3.1 fixes editing and window-lifecycle bugs documented in [the debug report](DEBUG-REVIEW.md).

## New in0.3

Master/RGB point curves, eight-range HSL Color Mixer and eyedropper, brush/linear/radial local masks, Texture/Clarity/Dehaze, luminance/color noise reduction, clone/heal brush, manual distortion/channel/defringe correction, film grain, and clipping warnings are implemented. See [the advanced tools guide](ADVANCED-TOOLS.md) for use and numerical limitations.

Native **Develop** menu entries open the new panels. Cmd-Shift-M opens Masks, Cmd-Shift-R opens Remove. J toggles clipping inside the editor, B toggles Original, R opens Crop. File/Edit/Window menus provide Cmd-O import, Cmd-Shift-E export, Cmd-Z undo and Cmd-Shift-Z redo. Exact values can be typed into numeric fields.

The app stores originals and edit recipes in its own ApplicationSupport profile. This is separate from the browser localhost library. Version1 recipes/libraries load with neutral defaults for the new tools; new recipes save as version2 and include masks/retouches. Clearing browser data does not clear the desktop library. Keep originals, exported images and recipes for durable backups.

## Build and rollback

Run `python3 scripts/build-desktop.py --replace` to build from the existing cached Electron40.10.6 arm64 runtime. The script signs and verifies the staged app before swapping it into place. It preserves the previous bundle in `dist/previous/`. It does not move, overwrite or reset the user's library. Close the running app before replacing its bundle.

Renderer sandboxing and context isolation are enabled. Files are read/written through explicit native dialog choices, with no arbitrary filesystem interface exposed to the renderer. API references: [Electron dialogs](https://www.electronjs.org/docs/latest/api/dialog), [Electron security](https://www.electronjs.org/docs/latest/tutorial/security).

## Verification

`docs/advanced-validation/` contains20 advanced-browser checks,10 packaged-desktop checks,5 geometry/reset checks, actual nativeOpen/Save verification, and a combined-effects export. The23 numerical tests and25 original browser workflow checks also pass. These are bounded tests, not a guarantee for every image or resource limit.

The real MacOpen sheet imported the bundled sample. The real Save sheet wrote a valid JPEG; the app reported successful1800x1200 export and returned to the editable workspace. Separate bridge tests exercised native cancellation and a disk-write failure. Masks survived app relaunch and reached exportedPNG pixels. Window layouts were inspected at1440x900 and1100x760; browser mobile width390 was checked. Maximum40MP images have not been stress-tested with all effects active.
