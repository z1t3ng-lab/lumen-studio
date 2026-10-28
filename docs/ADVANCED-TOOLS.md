# Lumen Studio0.3 — advanced photo tools

All eight recommended features plus clipping warnings are implemented locally in the desktop app and browser editor. The image engine and controls are independent implementations informed by the previously captured Lightroom workflow. No Adobe bundle or remote photo-processing service is used.

## Point Curve

Expand **Point Curve** beneath Light. Choose MasterRGB or an individualRed/Green/Blue channel. Click the graph to add a point, drag it, or enter exact0–255 Input/Output values. Select a point and use arrow keys to nudge; Shift moves ten steps. Use `[` and `]` to select adjacent points. Delete removes an interior point. Double-click a selected interior point or click Remove point to remove it. Endpoints stay at input0 and255; their output can be changed. Linear, Contrast and Lifted blacks presets are included. Each channel holds up to16 points.

The engine compiles shape-preserving cubic curves and applies the master curve before the individual-channel curves. Controls affect pixels, persist in recipes and export at full resolution.

## Color Mixer

Expand **Color Mixer** below Color. Choose one of eight color ranges: red, orange, yellow, green, aqua, blue, purple or magenta. Adjust Hue, Saturation and Luminance. **Pick color** lets you click the photograph to select the closest range. Reset range clears only the selected range.

This uses overlapping hue weights and HSL adjustments. It is not a calibrated perceptual color model or Lightroom Point Color implementation. Neutral grays are protected from color-range shifts.

## Masks

Click **Masks**, or add a Brush, Linear or Radial mask in its panel. Tool mode shows the full rotated image even when a crop exists. **Done** returns to the cropped view. The overlay is a viewing aid and never appears in exported photos.

- **Brush:** paint on the photo. Use Brush size and Feather, or enable Erase brush to subtract coverage. Feather adjusts existing strokes as well as future strokes. Brush size applies to future strokes.
- **Linear:** drag from the unaffected side toward the fully affected side. Feather controls the transition width; 0 makes a hard boundary and 100 uses the full dragged length. The gradient stays perpendicular to the drag direction on rectangular photos. This is useful for darkening a sky or lifting a foreground.
- **Radial:** drag the bounding rectangle for an elliptical mask. Feather softens its edge.

Choose a mask in the list to edit it. Each mask has local Exposure, Contrast, Highlights, Shadows, Temperature and Saturation, plus opacity, inversion, enabled/disabled and delete. Use Show overlay to hide the colored preview without disabling the mask. Up to12 masks and64 brush strokes per mask are supported. Automatic subject/sky segmentation is not included.

Coordinates are stored relative to the original oriented image. Rotation and cropping therefore preserve mask alignment. Mask adjustments run after global color processing; local exposure is applied in linear light. This is our processing order, not a claim about Adobe's engine.

## Texture, Clarity and Dehaze

Expand **Texture & Atmosphere**. Texture alters finer spatial contrast; Clarity alters broader local contrast. Negative settings soften those frequencies. Dehaze applies a simplified atmospheric-light correction; negative values introduce haze.

These are creative filters. Their algorithms and output do not reproduce Adobe's proprietary versions. Strong settings can create halos or clip colors, so inspect details and use clipping warnings.

## Noise Reduction

Use **Luminance noise** to smooth brightness noise and **Color noise** to reduce colored speckles. The local filter weights nearby pixels by distance and brightness similarity to protect strong edges. This is traditional edge-aware filtering, not AI denoise or RAW reconstruction. High amounts can remove fine texture. Large exports take longer when these filters are active.

## Remove: Clone and Heal

Open **Remove**, choose Clone or Heal, and click **Choose source on photo**. Click a clean source area, then paint over the distraction. Option-click sets another source. Size, feather and opacity affect the next stroke. Clear strokes removes the photo's retouch operations; normal Undo/Redo also restores strokes.

Clone copies pixels from the selected source with a consistent offset along the stroke. Heal also matches the source patch's average color to the target area and blends the boundary. It works best on small spots with a nearby clean sample. It is not generative object removal or content-aware reconstruction. Up to64 retouch strokes are supported. Source pixels are sampled from the optics-corrected original before global color processing; retouching never overwrites the original file.

## Optics

**Optics · Manual** includes barrel/pincushion Distortion, Red alignment, Blue alignment, and Purple/green defringe. Distortion and channel alignment use radial resampling. Defringe suppresses selected color excess at contrast edges while preserving uniform colored regions. Crop after correcting distortion to choose the final edges.

These are manual corrections. There is no automatic lens identification or camera/lens profile database. Color alignment is radial and cannot solve every chromatic aberration pattern. Out-of-image samples clamp to the edge, so strong distortion correction may require cropping.

## Film Grain

Control Amount, Size and Roughness in **Film Grain**. A fixed deterministic noise field avoids flickering on repeated renders. Size changes the noise cell size; Roughness mixes finer noise into that field. Grain is monochrome and does not change alpha. Preview sampling can differ from full-resolution detail, especially on very small images.

## Clipping warnings

Click **Clipping** or press **J**. Blue marks pixels with all RGB channels near black; red marks pixels with at least one channel near white. Percentages appear beneath the histogram. The indicators describe the rendered8-bit result, not lost information recoverable from a RAW sensor. Mask and clipping overlays are separate from the image pixels and are never exported.

## Recipes, history and compatibility

New saves use **version2 JSON recipes**, including curves, mixer, masks and retouches. Version1 recipes and existing libraries still load with neutral defaults for new features. A recipe is capped at2MB. Originals are retained unchanged, recipes remain editable, and normal undo/redo applies to the new tools. Double-click an adjustment slider to reset that adjustment.

The existing40MP/60MB import limits remain, but the maximum size has not been stress-tested with every advanced effect. Mask overlays use preview resolution; full export uses original resolution. The application remains8-bitSDR RGB and supports JPEG/PNG/WebP inputs. RAW/HEIC/TIFF, AI processing, lens profiles and Adobe XMP compatibility are outside this release.

## Verification

See `docs/advanced-validation/` for numerical/browser/desktop results and screenshots. Tests verify each algorithm's intended effect, masks outside/inside boundaries, color isolation, original immutability, export pixels without overlays, old/new recipe loading, coordinate alignment after crop/rotation and persistence. Adobe equivalence has not been tested.
