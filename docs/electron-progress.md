# Execution ledger — docs/electron-plan.md

2026-10-24: Read existing gateway, web renderer, Python main and current dependencies. User approved Electron direction and implementation. Electron 45.0.0 / electron-builder 26.18.0 verified against npm registry.

Ruling: Reuse supplied non-Git project directory — no worktree or commit can be created without inventing a separate repository.
Ruling: Bundle existing Python HID owner instead of porting protocol — preserve tested transactions and recovery.
Ruling: stable custom origin + optional API — preserve app storage and keep UI independent of port conflicts.

Task 1: complete. Red/green packaged executable + outside-ASAR cwd and backup path; graceful EOF exit test. Python main propagates restoration failure exit status.
Task 2: complete. Stable custom origin, isolated preload, tray/menu, native login settings, shared HID optional API. Policy and malformed URL regression tests passed.
Task 3: complete. Desktop IPC adapter, six-sample first-run seeding, native bounded share clipboard, app scheme event handling. Browser transport preserved. Clipboard verified by pasting into an unsaved app field and restoring the field.
Task 4: complete. PyInstaller arm64 runtime built, packaged app installed in ~/Applications. Ad-hoc deep signature verified. No private backups/evidence/venv in ASAR. Installed app connected to physical board and read current key values. Native login status enabled/openAtLogin true. Normal Quit removed both app and HID child; relaunch retained Codex profile + six templates. Hidden window retained tray/device/API. Independent installed API read matched original 75 records.
Task 5: complete. Fresh independent review found malformed optional API URL crash, cancelled-quit service restart and delayed EOF stdin reuse issues. Addressed with regression tests. Final npm test 48/48, Python 27/27. Installed ASAR source bytes match latest main/gateway/renderer; ZIP hash and runtime evidence saved in evidence/electron-build-20261024.json. Installed app running with USB connected and local API enabled.

Boundary: Chromium automation permits only http/https and rejected the mini-keyboard URL launch test. Do not bypass this policy. OS external deep-link activation remains unverified; native copying and link-policy unit checks passed. JSON sharing/import remains available.
