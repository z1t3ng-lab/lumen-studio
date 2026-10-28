# Lumen Studio interface contract

Job: edit a local photograph and export the rendered result. Primary action: Import photos, followed by Export. A dark, neutral photographic workspace keeps colors readable; warm ivory accents identify active controls. A restrained serif wordmark is the sole expressive element. Desktop 1440x900: library sidebar, central canvas, adjustments sidebar, bottom filmstrip. Mobile 390x844: stacked canvas and adjustment panels, compact toolbar, no hidden primary action. All control labels, focus, history and error feedback must remain usable.

Reference: Adobe Lightroom desktop help documents detail view, filmstrip, histogram, light/color controls. This is an independent interface and pixel pipeline, not an Adobe UI/code reproduction.

States: loading shows status and disables conflicting actions; empty offers import and demo; unsupported/corrupt image reports filename and supported formats; partial import retains valid photos and lists failed files; success shows local save/export status; browser storage failure leaves session editing available and asks user to export before closing. No special device/account permissions needed: native file picker is explicitly initiated by the user. Photos never upload. Evidence/help opens separate documentation rather than cluttering editing controls.
