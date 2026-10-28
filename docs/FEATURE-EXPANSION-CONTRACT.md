# Lumen Studio 0.3 feature contract — 2026-10-28

Requested: all eight previously recommended Lightroom-inspired features plus clipping warnings. Keep original bytes, recipes, undo/redo, desktop dialogs and existing web capability. Existing REA observations establish controls and code boundaries, not Adobe algorithms. This release implements independent local algorithms.

Acceptance:
1. Master and individual RGB point curves with draggable/addable/removable points, keyboard point editing, presets/reset, persistence/export.
2. Eight-range HSL color mixer and color eyedropper. A red adjustment must not alter a pure blue patch.
3. Multiple brush, linear-gradient and radial masks; feather, opacity, inversion, enabled/delete; brush erase; local exposure/contrast/highlights/shadows/temperature/saturation. Mask coordinates in original oriented image; overlay never exported. Work after crop/rotation by showing full rotated image in tool mode.
4. Texture, Clarity and Dehaze. Real local-frequency texture/contrast filters and explicit atmospheric approximation.
5. Luminance and color noise reduction using local edge-aware filtering, measurable noise reduction without flattening a strong edge.
6. Clone and heal brush, explicit source sample, feather/size/opacity, reversible strokes, removed source mark, original immutable. Heal blends source with local target color; not generative reconstruction.
7. Optics: manual barrel/pincushion correction, red/blue channel alignment, purple/green fringe suppression. No automatic proprietary lens-profile database claim.
8. Deterministic grain amount/size/roughness. Grain stable across repeated renders, no temporal flicker.
9. J shortcut/button toggles clipping overlay; separate shadow/highlight counts; overlay not exported.

UI: keep dark neutral workspace and photo center; advanced panels in collapsible right sidebar. Mask/remove modes explicitly show tool instructions, active mode, Done action. Do not overload primary editing view with research claims. Target viewports 1440x900 and1100x760 desktop,390x844 browser; no horizontal overflow. Brush canvas supports pointer capture. Numeric fields, range labels, focus, and keyboard operation for curve points. Loading renders retain current image; invalid recipe reports an actionable error; no photo disables tools; storage failure keeps export possible. Native picker cancellation preserves current work.

Verification: numerical invariants/fixtures for each algorithm, recipe compatibility and validation, full-resolution export; UI exercises every feature in packagedElectron and meaningful browser regressions, original hashes and history restore, persist/relaunch; screenshot and native dialog review. Large images/resource limits clearly stated. Final build updates existing bundle identity/profile without modifying user library and preserves previous .app as rollback.
