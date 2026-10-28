# Lumen Studio 0.3.1 — code review and debugging

Reviewed on October 28, 2026: image-processing modules, controls and tool gestures, recipe import/export, history and IndexedDB writes, worker/render scheduling, Electron menus and window lifecycle, preload bridge, local server, and desktop packaging.

## Reproduced and fixed

| Issue | Reproduction and correction |
| --- | --- |
| Decimal entry was disrupted | Typing `0.5` character by character into desktop Exposure produced `0`, because each input event rewrote the focused number field. Focused numeric drafts now survive preview renders and slider synchronization. |
| Invalid numeric drafts left inconsistent state | Preview a valid numeric value, clear the field, then leave it. An advanced control could leave its preview unsaved; a base control could remain blank. Blur now commits the last valid preview and restores that value in the field. Both base and advanced cases are covered, including reload. |
| Imported curve points could move backward or cross | A valid recipe with adjacent inputs 0.500 and 0.502 used a smaller gap than the UI assumed. Keyboard, drag and numeric moves now use the same minimum gap as validation, with floating-point tolerance. |
| Eraser strength depended on pointer-event density | A feathered eraser multiplied coverage once per overlapping segment. The same straight stroke erased more when sampled densely. Coverage is now combined across one stroke before subtraction; separate strokes can still accumulate. |
| Linear Feather had no effect | The linear-mask branch ignored Feather. It now controls transition width, including a hard boundary at zero. |
| Diagonal gradients were skewed on rectangular photos | Projection used normalized coordinates without compensating for image width and height. Projection now uses image-pixel geometry, preserving a perpendicular boundary. |
| Duplicate mask IDs made selection ambiguous | Imported recipes could contain two masks with the same ID. Validation now rejects duplicate IDs with a clear error before applying the recipe. |
| Loading a recipe could hide its crop | Loading a cropped recipe while drawing left uncropped tool mode active. A successfully validated recipe now exits tool mode before applying geometry. |
| Tool buttons remained pressed after changing photos | Internal tool state reset but button accessibility/visual states did not. Switching photos now clears those pressed states and the previous retouch-source instruction. |
| Dock activation could fail to reopen the editor | With the guide open, closing the editor left an auxiliary window, so activation incorrectly assumed an editor existed. The main-window reference now resets on close, and activation recreates it independently of guide windows. Menus target the new editor. |

The application and native bundle versions are now 0.3.1. The build script derives the native build version from the package version instead of keeping a fixed `3`.

## Regression evidence

Added `tests/audit-engine.test.mjs`, `tests/audit-browser.mjs` and `tests/audit-desktop.mjs`. Four new numerical regressions and seven browser/native failure scenarios were reproduced before their fixes. The native suite also checks that menus work after reopening.

- `debug-validation/browser-before.json`: original five browser failures.
- `debug-validation/browser-decimal-before.json`: additional decimal typing failure after the first fixes.
- `debug-validation/desktop-before.json`: original Dock activation failure.
- `debug-validation/browser-after.json`: six browser regressions passing.
- `debug-validation/desktop-after.json`: two packaged desktop lifecycle checks.
- `debug-validation/summary.json`: final suite results and source/bundle verification.

Existing numerical, browser, geometry, storage/error and packaged-desktop workflows were rerun. Tests use isolated profiles and synthetic/sample photos. Native dialog choices in the packaged suite are test doubles; actual OS dialog interaction was already checked for 0.3.0 and was not repeated for this patch.

## Compatibility and limits

Original photo files and the user's library are not rewritten by the update. The previous signed app bundle is retained in `dist/previous` for rollback. Recipe versions 1 and 2 remain supported.

Corrected linear-mask feathering/geometry and brush erasing can change the rendering of existing edits that relied on the old behavior. Their stored recipes remain intact. Maximum 40MP imports with every effect enabled, every malformed file, and every disk/OS failure are not exhaustively tested. This review does not establish Lightroom pixel equivalence.
