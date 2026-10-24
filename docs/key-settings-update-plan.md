# Key settings update — 2026-10-25

- Remove application binding from new and existing profiles. The supported-application selector belongs only to the key editor and selects a shortcut reference list; changing it never mutates assigned keys or labels.
- Expose a direct “사용 안 함” control that assigns disabled (no HID output), distinct from preserving existing device settings.
- Save optional per-layer LED settings in profile v4: key colors use a fixed16-color palette, unspecified colors/mode preserve current device values. Hardware mode is layer-wide, never falsely presented as per-key.
- Add LED controls below the selected key editor. Current palette and mode choices become part of save/export/share and one Apply action. Legacy keymaps preserve LEDs unless the user edits lighting.
- Preflight capability/readback before any key mutation; apply keys and LED from one UI operation. On LED failure restore touched LEDs and restore changed keys using their pre-apply raw backup; report any incomplete restoration explicitly. No arbitrary paths/commands or record-ID rotation.
- Original LED mode strings are numeric0..5. Map semantic labels only from model-matching evidence; otherwise show numeric modes with uncertainty instead of inventing always/press meanings.
- Preserve the physically validated direct key IDs and rotation behavior. Verify migration, disabled writes, palette rejection, LED merge/preserve, shared apply/rollback, catalog v4 loading, and native UI layout before packaging.

## Verification delivered

- App JS: 113/113; companion Python: 42/42; catalog: 16/16 and six profiles / 450 actions / six source datasets validated.
- Packaged 0.5.0 arm64, installed in the existing Applications location; deep strict code-signature verification passed.
- Native UI: new-profile form has no app field; supported-app selector changes the list; Codex function assignment, deletion, fixed-palette selection and layer-mode selection verified using a disposable map. Original user map restored in the editor; no user-map write to hardware.
- Connected 514c:8850 / [16,3,11]: combined apply with all keys preserved and one LED color patch succeeded with strict LED readback. Then restored the exact prior LED layer via persistent save. All 75 raw key records and all raw LED responses match the pre-test capture. Evidence is stored under ignored device-backups/led-canary-050-*.json.
- This verifies protocol persistence/baseline handling in the running app. Visual mode meanings and persistence after a power cycle remain unverified.
