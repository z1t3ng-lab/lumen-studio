# What REA found in Lightroom on the web

**REA successfully inspected the real [Lightroom web application](https://lightroom.adobe.com/home), opened Adobe’s sample editor, and changed Exposure from 0 to +1.00.** This provides executable evidence of one editing workflow and captured client code. The desktop application remains unavailable on this Mac; these findings concern the web build served on October 27, 2026.

## The experiment you can inspect

REA launched Chrome 156.0.8078.48 with a temporary, empty profile at 1440 × 900. It opened the public home page, selected **Make colors pop**, waited for the sample, entered zero in Exposure, committed with Tab, and captured the baseline. It then entered 1.00, committed, waited, and captured the edited result. No account login or personal photo upload was involved.

All ten recorded steps completed. Accessibility output changed from Exposure `0` to `+ 1.00`. The screenshots visibly show a brighter sample and a histogram shifted toward brighter tones. The Save control also changes from disabled to enabled. This demonstrates that the displayed value and preview respond to an edit. It does not establish the underlying formula or confirm that Save or export succeeds; those controls were not exercised.

[Inspect the complete exposure experiment](</Users/zitengzhou/Documents/ChatGPT/3D PC part/lumen-studio/docs/evidence/rea-lightroom-web-exposure-wide.json>). Evidence ID: `ev_e47e704cbc6e2a8323e3bc26819805a166e3cb64fb327bd66abd20e22d1fd2c9`.

![Actual Adobe Lightroom web sample, Exposure 0](/Users/zitengzhou/Documents/ChatGPT/3D PC part/lumen-studio/docs/evidence/rea-lightroom-web-baseline-wide.png)

![Same Adobe sample, Exposure +1.00](/Users/zitengzhou/Documents/ChatGPT/3D PC part/lumen-studio/docs/evidence/rea-lightroom-web-exposure-plus-one-wide.png)

These are unaltered REA screenshots, visually reviewed after capture. Adobe’s onboarding popover and a temporary notice obscure parts of the sample. Their contents change between captures, so a whole-screenshot pixel difference would mix interface animation with photo changes. We have not measured a pixel-level exposure response or compared exported files.

## How the observed application is organized

The public page routes to `/home`; selecting the sample moves to `/home/edit`. The editor places the photograph centrally, a histogram and adjustment groups on the right, and actions such as original-preview, Save, and Download above. REA’s accessibility capture lists Light, Color, Point Curve, Effects, Detail, Optics, Crop & Rotate, Presets, Remove, and Masking. Presence of a control proves its exposed interface, not that every feature was exercised.

The deployed client is split across multiple JavaScript files. REA’s bundle analysis observed and analyzed **56 scripts**, including a bootstrap file, router, home route, edit route, and larger shared chunks. A later passive capture exported **50 scripts totaling 12,330,431 bytes**. These are separate capture populations; the counts should not be treated as a completeness comparison. Every exported script’s SHA-256 was rechecked against the REA manifest.

[Bundle analysis](</Users/zitengzhou/Documents/ChatGPT/3D PC part/lumen-studio/docs/evidence/rea-lightroom-web-bundle.json>) establishes the captured URLs and hashes. [The export manifest](</Users/zitengzhou/Documents/ChatGPT/3D PC part/lumen-studio/docs/evidence/lightroom-web-scripts/manifest.json>) preserves the source URL, capture reference, digest, and local path for each retained file. Neither provides Adobe’s original source repository.

## What the captured code supports

The following are **static observations of shipped JavaScript**. They describe code present in the captured build, without asserting that a runtime trace observed each function executing.

| Observation | Inspectable source anchor |
| --- | --- |
| A Light-panel template creates its Exposure slider using the parameter identifier `Exposure2012`. The same captured chunk contains named Highlights and Shadows parameters. | [Shared editing chunk, line 183](</Users/zitengzhou/Documents/ChatGPT/3D PC part/lumen-studio/docs/evidence/lightroom-web-scripts/files/origins/858d9f6f272f100a0815fcf3d2937116dd7988f5461d869eb8868f7b455c7a45/modern/96059.1a339600386c8ba4.js:183>), character offset 2,356,075. |
| Components dispatch named parameter updates into an editing store. This is evidence of a separation between controls and editable state. | [Shared editing chunk, line 1](</Users/zitengzhou/Documents/ChatGPT/3D PC part/lumen-studio/docs/evidence/lightroom-web-scripts/files/origins/858d9f6f272f100a0815fcf3d2937116dd7988f5461d869eb8868f7b455c7a45/modern/96059.1a339600386c8ba4.js:1>), `setParameterValue` near character 774,540. |
| An image-view component initializes a WebGL or WebGL2 context, a shader program, and image texture and vertex buffers. The selection depends on a feature flag. | [Shared editing chunk, line 1](</Users/zitengzhou/Documents/ChatGPT/3D PC part/lumen-studio/docs/evidence/lightroom-web-scripts/files/origins/858d9f6f272f100a0815fcf3d2937116dd7988f5461d869eb8868f7b455c7a45/modern/96059.1a339600386c8ba4.js:1>), `_initWebGL` near character 931,512. |
| A preview path asks a rendering bridge for default pixels, wraps bytes in ImageData, draws through a 2D canvas, and applies rotation/mirroring from crop state. | [Shared editing chunk, line 249](</Users/zitengzhou/Documents/ChatGPT/3D PC part/lumen-studio/docs/evidence/lightroom-web-scripts/files/origins/858d9f6f272f100a0815fcf3d2937116dd7988f5461d869eb8868f7b455c7a45/modern/96059.1a339600386c8ba4.js:249>), `renderDefault` near character 3,601,440. |
| The edit-route code handles develop settings, an XMP develop link, `xmpCameraRaw`, crop dimensions, orientation, masks, and filters. | [Edit route, line 1](</Users/zitengzhou/Documents/ChatGPT/3D PC part/lumen-studio/docs/evidence/lightroom-web-scripts/files/origins/858d9f6f272f100a0815fcf3d2937116dd7988f5461d869eb8868f7b455c7a45/modern/site/routes/client/home/edit.0e862e2bbf58308e.js:1>), `getDevelopSettingsHref` near character 15,124. |

Offsets are zero-based Unicode character indexes in the saved UTF-8 text, provided because minified lines are long. The shared chunk digest is `2da7e495a84628823da6543e225bff795f362c454644d60fd78c1abd2c0a54dc`; the edit-route digest is `a1098980cde224014d2084cce5295a695dfe380a6a19a8f1ded1b07e743e6de1`.

A useful architectural inference is therefore: **controls update named settings; rendering components obtain pixels; the view displays those pixels with geometry; persistence carries develop settings separately.** This is an explanation supported by several code boundaries, not a complete recovered call graph. The evidence does not show which rendering stage computes exposure, whether that operation runs locally or remotely in every mode, or which equations Adobe uses.

## What remains unknown

REA labels the static analysis **partial**: all 56 scripts were parsed, with no outright parse failures, but the parser recovered errors in the client bundle. Source maps were not fetched. The passive capture only retained the Lightroom origin and its observed CloudFront script origin; other origins and scripts with unproven origin were filtered. Earlier network activity is unavailable after attachment.

The final exposure scenario is complete for its declared screenshots, accessibility, page-error, and worker capture. It intentionally requested no network recording. Earlier connected-browser scenarios are marked incomplete for events and must retain that caveat. REA’s many route and endpoint candidates include heuristic string matches; they are not a verified API inventory.

RAW decoding, internal color spaces, numerical tone mapping, masks, AI processing, authenticated storage, export fidelity, and desktop/web parity remain unresolved. A visible histogram shift cannot resolve those questions. No binary decompilation was performed, and the independent editor should not claim Adobe rendering equivalence.

## How this guides our editor

Our implementation can reproduce the supported interaction pattern using its own original-image store, editable recipe, preview renderer, geometry state, undo history, and export renderer. Keeping the recipe separate makes edits reversible; deriving preview and export from the same recipe keeps them consistent. Those are independent engineering choices informed by the observed workflow. Adobe’s captured bundles are research artifacts, not dependencies to embed in our application.

The next meaningful comparison is a controlled input chart exported by both applications with fixed profiles, dimensions, and output settings. The proposed protocol in [Adobe evidence](</Users/zitengzhou/Documents/ChatGPT/3D PC part/lumen-studio/docs/ADOBE-EVIDENCE.md>) describes that unexecuted work. This pass establishes a working interaction and inspectable implementation boundaries, while leaving algorithm equivalence open.

## Provenance and cleanup

The [complete canonical session bundle](</Users/zitengzhou/Documents/ChatGPT/3D PC part/lumen-studio/docs/evidence/rea-lightroom-web-all-evidence.json>) contains nine records. Key supporting IDs are:

- Sample editor runtime: `ev_0cd09ee54368feae902772b5ee54eb66f3dc581476c3992e32ee856137c160ff`.
- Static bundle analysis: `ev_14061794ad1a6180c37c733af57b0971976f9c8afcc25b75a4d8f7186611ef5d`.
- Passive source capture: `ev_2185d5523585bab73747c4358183963e715da5e748de9d2f0189bbaf63107299`.
- Verified source export: `ev_16fb68dfa623089f53699dc5ea4970dc7882125c6975e0c304bc559a5f693fa6`.

REA’s launch-owned browsers report cleanup. The separate task-owned headless Chrome root was verified by its exact executable and temporary-profile argument, then terminated; execution session 40144 returned exit code 0. The user’s ordinary browser profile was not used.
