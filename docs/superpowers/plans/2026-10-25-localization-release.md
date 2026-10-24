# Six-language product release implementation plan

**Goal:** Ship Mini Keyboard Studio0.6.0 with six UI languages, product-focused multilingual README screenshots, Developer ID signed DMG and a non-prerelease GitHub release on origin.

**Architecture:** Existing local-first Electron renderer and HID owner remain intact. Renderer UI localization uses a shared locale state with validated Electron settings IPC; native menus use the same locale codes. User-authored profile names, action labels and raw key data remain unchanged. Source Korean strings can remain stable translation keys. No hardware configuration changes are part of this release.

**Tech stack:** Electron45, nativeJSmodules, Python HID helper/PyInstaller, electron-builder26, Apple codesign/notarytool and GitHub CLI.

## Tasks

- [x] Renderer sixlocale UI and persistent compact language selector, meaningful tests and re-render verification.
- [x] Native menus/tray/dialog localization and validated get/setlocale IPC, sixlocale tests.
- [x] English/Korean/Japanese/Spanish/Simplified/Traditional README, crosslinks and actualapp screenshots; technical notes moved outof productoverview.
- [x] Root: version0.6.0, releaseDMG/ZIP configuration and realDeveloperID signing of helper/nestedframeworks/app/DMG. Inspect available notarization credentials without exposing secretvalues; notarize and staple when available. Clearly distinguish signing and notarization evidence.
- [x] Full JS/Python/catalog tests, security+localizationreview, packagednativeUI checks; preserve existinguserdata and device.
- [x] Capture real screenshots without user-specific names/data. Verifyimagepaths and all README links.
- [ ] Annotatedv0.6.0 tag on finalcleancommit, pushmain/tagorigin, publish non-draft/non-prerelease release with DMG/ZIP/checksums and anyupdate metadata. Verify releaseassets/digests and installedsignedapp.

## Review focus

Language switches must not mutate keymaps, lose edits or leak mainprocess privileges. Dynamicrendering must retaintranslationandHTMLescaping. Recoverymessages must preserve physicalverification limitations. DeveloperIDsignature includes the bundledPython runtime and code; no ad-hocartifact may be describedasdistribution-signed. Do not publish secrets, devicebackups or user screenshots. DMGassetsandtagmust matchthefinalreleasecommit.

USB removal reporting and verified explicit recovery were added after the user reported a stale connected indicator. See [release validation](../../releases/0.6.0.md).
