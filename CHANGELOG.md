# Changelog

## v1.0.0-beta.5 - 2026-07-19

- Fixed cloud sync overwrite: Added `overwriteInventory` function in Firestore to properly overwrite (not merge) cloud inventory
- Fixed "Overwrite Cloud" button: Now uses `setDoc` without merge option to fully replace cloud data
- Improved sync error reporting with detailed error messages and sync state updates
- Added overwrite-specific sync state messages ("Overwriting cloud inventory...", "Cloud inventory overwritten", "Overwrite cloud failed")
  
## v1.0.0-beta.4 - 2026-05-16

- Added Google sign-in for inventory access.
- Added Firebase runtime configuration and example config files.
- Added Firestore-backed inventory persistence and cloud sync services.
- Preserved local inventory storage with migration-friendly service boundaries.
- Added inventory sorting by name, hue, and brand.
- Restored the full application layout, including the HEX lab DOM.
- Updated Docker publishing to emit versioned image tags from `package.json`.

