# Lightroom desktop: evidence and reconstruction boundaries

Research date: October 27, 2026. Target: **Adobe Lightroom desktop**, including its Cloud and Local workflows. Lightroom Classic is a separate application and its catalog architecture is not assumed here.

This file records Adobe's published product behavior, not recovered source code. No Lightroom executable, decompiled function, runtime trace, or Adobe export comparison was available to this documentation pass. The user confirmed that Lightroom desktop is not installed on this Mac. The parent investigation also found no Lightroom application in `/Applications`, `~/Applications`, or a Spotlight filename search. Consequently the Adobe target is unavailable for binary or runtime inspection. A live REA connection was separately verified; see [REA status](evidence/REA-STATUS.md) and its complete saved tool result.

**Later web investigation:** the user subsequently requested Lightroom web. REA successfully inspected its public sample editor and captured client code; see [REA web findings](REA-WEB-FINDINGS.md). The desktop experiments below remain unexecuted.

## Documented behavior

| ID | Adobe-documented behavior | Source and inspected section |
| --- | --- | --- |
| D1 | Cloud import lets users review and select files, optionally choose an album, and add them. Imported originals are copied and uploaded at full resolution. | [Add photos](https://helpx.adobe.com/lightroom/desktop/add-import-and-capture-photos/add-photos.html), “Add photos from a hard drive folder” and introduction; updated April 24, 2025. |
| D2 | The Local tab accesses device folders without cloud import. Local edits remain editable and are stored as metadata inside the file or in an accompanying XMP sidecar, depending on file type. Export makes rendered changes visible to other applications. Cloud and Local copies are separate after copying to Cloud. | [Import and access photos](https://helpx.adobe.com/lightroom/desktop/add-import-and-capture-photos/access-photos.html), “Access locally stored photos” and “Local tab FAQ”; updated March 27, 2026. |
| D3 | Detail view exposes the editing controls, with a bottom filmstrip. The Light panel exposes tonal controls, while the histogram provides clipping indicators. Curves map input tone to output tone. A profile can alter rendering without overwriting slider values. Edits can be copied between photos. | [Edit photos](https://helpx.adobe.com/lightroom/desktop/edit-photos/edit-photos.html), workflow, histogram, Profile, Light, and copy/paste sections; updated October 18, 2026. |
| D4 | Presets are saved adjustment settings. Users can preview and apply them, adjust the preset amount, create their own from current settings, and export a preset as XMP. | [Edit photos with Presets](https://helpx.adobe.com/lightroom/desktop/edit-photos/presets.html), application, user creation, and export sections; updated April 16, 2026. |
| D5 | Crop provides draggable boundaries, fixed or free aspect ratio, and straightening. Rotate offers 90-degree turns and flips. Geometry also offers perspective corrections. | [Crop, Rotate, and Geometry](https://helpx.adobe.com/lightroom/desktop/edit-photos/crop-rotate-geometry.html), crop, rotate/flip, and geometry sections; updated April 16, 2026. |
| D6 | Export produces new image files incorporating edits. Custom export settings include file type, dimensions, quality, metadata, naming, output sharpening, and color space. | [Export or share your photos](https://helpx.adobe.com/lightroom/desktop/save-share-and-export/save-share-photos.html), “Export photos in the format of your choice”; updated April 24, 2025. |

D1–D6 are observations of **documentation**, not observations of application execution. They support product requirements but do not prove implementation details.

## How to reason from this evidence

A suitable independent editor can keep an original image and an editable settings object, render a preview from those inputs, and render a new output when exporting. This is our proposed design, inferred from the documented behavior. It does not establish Adobe's internal classes, functions, data structures, shader programs, processing order, or numerical formulas.

“Nondestructive” should be interpreted carefully: Adobe documents preservation of editable image adjustments, while Local metadata may be written inside the original file. It therefore does **not** promise an unchanged whole-file hash after edits. Our application may choose to preserve source bytes and keep settings separately, but that is a design choice.

A Lightroom-like exposure control can use a linear-light gain such as `2 ** exposureEV`. That is a conventional independent implementation choice, **not evidence of Adobe's algorithm**. Matching slider names or ranges does not establish matched rendering, especially for RAW input, clipped highlights, local contrast, color profiles, or adaptive processing.

## Claim ledger

| Claim | Classification | Evidence boundary | Status |
| --- | --- | --- | --- |
| Desktop supports both cloud-managed and local-folder workflows. | Documentation observation | D1, D2 | Supported |
| Local edits can be revisited, with metadata separate from rendered output. | Documentation observation | D2 | Supported |
| Photo, filmstrip, controls, histogram, crop, presets, and export form a coherent editing workflow. | Documentation observation | D3–D6 | Supported |
| Separate source, recipe, preview, and export subsystems can reproduce the workflow. | Engineering inference | Proposed design informed by D2–D6 | Implement and test independently |
| Adobe uses the same equations, processing order, or storage schema as our app. | Unknown | Requires target evidence; docs are insufficient | Unresolved |
| Adobe desktop output matches our app pixel-for-pixel. | Unknown | Requires controlled exports and numerical comparison | Unresolved |
| REA can recover exact original Adobe source from an arbitrary shipped build. | Unsupported claim | Decompilation and observations do not guarantee original source or full recovery | Do not claim |
| This reconstruction implements every Lightroom feature. | Unsupported claim | Feature completeness requires an enumerated comparison and tests | Do not claim |

## Reproducible desktop experiments — proposed, not executed

These steps are ready for a later pass once a specific installed Lightroom desktop build is available. They are a testing protocol, not a report of successful experiments.

1. **Record target identity.** Record the app path, displayed version/build, OS version, hardware, and SHA-256 of the selected executable. Use REA's advertised artifact tools to inspect the exact supplied application. Preserve REA Evidence IDs, byte identity, tool version, limitations, and unavailable providers. Artifact inventories establish packaging facts; filenames alone do not establish execution.
2. **Prepare controlled inputs.** Use a small lossless sRGB RGB test chart with neutral gray patches, a smooth ramp, saturated color patches, near-black and near-white patches, plus one user-authorized photograph. Keep immutable copies and record dimensions, bit depth, ICC profile, and SHA-256. Begin with a rendered format supported by both apps; treat RAW as a separate experiment.
3. **Establish the baseline.** Open a copy in Lightroom Local. Record all active settings, profile, automatic adjustments, and output settings. Reset editable controls and export a lossless baseline if the installed version supports it. Record any defaults that cannot be disabled. Use the same dimensions and output color space in each run; disable output sharpening where available.
4. **Vary one parameter.** Starting from the baseline for every case, export exposure at −1, 0, and +1 EV; Highlights at −50, 0, and +50; and Shadows at −50, 0, and +50. Do not change other controls. Record exact UI values and save the settings metadata if available. Repeat one baseline export to measure reproducibility.
5. **Observe state separately.** Capture before/after settings, preview, histogram, and export actions through REA's supported observation workflow for that build and platform. Inspect the documented schema before invoking a tool. UI appearance is evidence of a displayed result; it does not establish an internal call path. Native analysis requires the relevant configured provider.
6. **Compare output.** Decode both outputs with the same color-management path. Measure patch means and full-image differences against each app's own baseline. Convert to linear light before testing a multiplicative exposure hypothesis. Report mean absolute error, maximum error, clipping counts, and difference images. Preserve raw measurement data; do not attribute output differences to a single stage without isolation.
7. **Test composition and persistence.** Compare exposure then shadows with shadows then exposure when final settings match. Reopen the edited source and confirm the saved settings reappear. Test resetting edits, applying a preset, cropping, rotating four times, and exporting. Compare dimensions and pixels as well as screenshots.
8. **Update the ledger.** Mark each hypothesis supported, contradicted, or unresolved for this exact build and test set. Identical outputs for a few test images support only those cases. State color-management, precision, codec, default-profile, and unavailable-observation limitations explicitly.

## Evidence to retain

Keep a manifest of input and output hashes; target version and executable hash; REA output with Evidence IDs; recorded settings; screenshots; decoded pixel statistics; difference images; and commands or scripts sufficient to repeat the experiment. Store experimental results separately from this documentation review and from the independent editor's own tests.
